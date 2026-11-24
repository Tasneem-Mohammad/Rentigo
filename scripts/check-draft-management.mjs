// Actual repository/service/routes against isolated transactional persistence doubles.
// Does not read .env.local, connect to Atlas, delete real drafts or send email.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../src");
const cache = new Map(), mocks = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (mocks.has(file)) return mocks.get(file);
  if (cache.has(file)) return cache.get(file);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const compiled = { exports: {} }; cache.set(file, compiled.exports);
  const dependency = name => name === "server-only" ? {} : name.startsWith("@/") ? load(name.slice(2) + ".ts") : name.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(file), name + ".ts"))) : require(name);
  new Function("require", "module", "exports", output)(dependency, compiled, compiled.exports);
  cache.set(file, compiled.exports); return compiled.exports;
}
const mock = (file, exports) => mocks.set(path.resolve(root, file), exports);
let records = [], cleanup = [], counter = 0, actor = "owner", chain = Promise.resolve(), locked = false, failQueue = false;
const matches = (row, filter) => Object.entries(filter).every(([key, value]) => value?.$in ? value.$in.includes(row[key]) : value?.$ne !== undefined ? row[key] !== value.$ne : row[key] === value);
function query(work) { return { sort() { return this; }, limit() { return this; }, session() { return this; }, select() { return this; }, lean: async () => { assert.ok(locked || work.readOnly); return structuredClone(work()); } }; }
const model = {
  find: filter => query(Object.assign(() => records.filter(row => matches(row, filter)), { readOnly: true })),
  findOne: filter => query(Object.assign(() => records.find(row => matches(row, filter)) ?? null, { readOnly: true })),
  create: async ([fields]) => { assert.ok(locked); const record = { ...fields, _id: (++counter).toString(16).padStart(24, "0"), version: 0, photos: [], updatedAt: new Date() }; records.push(record); return [{ toObject: () => structuredClone(record) }]; },
  findOneAndUpdate: (filter, update) => query(() => { const record = records.find(row => matches(row, filter)); if (!record) return null; Object.assign(record, update.$set); record.version += update.$inc.version; return record; }),
  findOneAndDelete: filter => query(() => { const index = records.findIndex(row => matches(row, filter)); return index < 0 ? null : records.splice(index, 1)[0]; }),
};
const connection = {
  connection: { collection: name => ({
    updateOne: async filter => { assert.equal(name, "draftOwnerLocks"); assert.equal(typeof filter._id, "string"); locked = true; },
    insertMany: async entries => { assert.equal(name, "draftPhotoCleanup"); if (failQueue) throw new Error("Queue unavailable"); cleanup.push(...entries); },
  }) },
  startSession: async () => ({
    withTransaction: async work => { const prior = chain; let release; chain = new Promise(resolve => { release = resolve; }); await prior; const snapshot = structuredClone({ records, cleanup }); try { return await work(); } catch (error) { records = snapshot.records; cleanup = snapshot.cleanup; throw error; } finally { locked = false; release(); } },
    endSession: async () => {},
  }),
};
mock("models/listing.ts", { Listing: model });
mock("lib/mongodb.ts", { connectDatabase: async () => connection });
let emailVerified=false;
mock("server/auth/session.ts", { currentSession: async () => actor ? { user: { id: actor, accountStatus: "active", emailVerified } } : null });
mock("server/auth/config.ts", { authConfig: () => ({ BETTER_AUTH_URL: "http://localhost:3000" }) });
let prototypeEnabled = false;
mock("server/prototype-publishing.ts", { prototypePublishingEnabled: () => prototypeEnabled });
load("server/repositories/drafts.ts");
const services = load("server/services/drafts.ts");
const { draftName } = load("lib/draft-name.ts");
assert.equal(draftName("  TENT\t  Large "), "tent large");
const fields = { title: "Tent", category: "Outdoor & leisure", condition: "working_well", areaLabel: "Patamata" };
const first = await services.saveNewDraft(fields);
await assert.rejects(() => services.saveNewDraft({ ...fields, title: "  TENT  " }), error => error.code === "DUPLICATE_DRAFT");
assert.equal(records.length, 1);
await services.saveNewDraft({ ...fields, category: "Tools" });
actor = "other"; await services.saveNewDraft(fields); actor = "owner";
const concurrent = await Promise.allSettled([services.saveNewDraft({ ...fields, title: "Camping table" }), services.saveNewDraft({ ...fields, title: "CAMPING TABLE" })]);
assert.equal(concurrent.filter(result => result.status === "fulfilled").length, 1);
assert.equal(concurrent.find(result => result.status === "rejected").reason.code, "DUPLICATE_DRAFT");
const table = records.find(row => row.title === "Camping table" || row.title === "CAMPING TABLE");
await assert.rejects(() => services.saveExistingDraft(table._id, { ...fields, expectedVersion: 0 }), error => error.code === "DUPLICATE_DRAFT");
await services.saveExistingDraft(first.id, { ...fields, areaLabel: "Benz Circle", expectedVersion: 0 });
const original = records.find(row => row._id === first.id);
original.photos = [{ publicId: `rentigo/drafts/${first.id}/11111111-1111-4111-8111-111111111111`, expiresAt: new Date(Date.now() + 3600000), state: "pending" }];
actor = "other"; await assert.rejects(() => services.deleteOwnDraft(first.id, { expectedVersion: 1 }), error => error.status === 404); actor = "owner";
await assert.rejects(() => services.deleteOwnDraft(first.id, { expectedVersion: 0 }), error => error.code === "VERSION_CONFLICT");
failQueue = true; await assert.rejects(() => services.deleteOwnDraft(first.id, { expectedVersion: 1 }));
assert.ok(records.some(row => row._id === first.id), "Queue failure rolls deletion back"); failQueue = false;
const routes = load("app/api/v1/me/listings/[id]/route.ts");
const context = { params: Promise.resolve({ id: first.id }) };
const request = (origin, body) => new Request("http://localhost:3000/api/v1/me/listings/" + first.id, { method: "DELETE", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
assert.equal((await routes.DELETE(request("https://other.invalid", { expectedVersion: 1 }), context)).status, 403);
actor = null; assert.equal((await routes.DELETE(request("http://localhost:3000", { expectedVersion: 1 }), context)).status, 401); actor = "owner";
assert.equal((await routes.DELETE(request("http://localhost:3000", { expectedVersion: 1, ownerId: "other" }), context)).status, 400);
const result = await routes.DELETE(request("http://localhost:3000", { expectedVersion: 1 }), context);
assert.equal(result.status, 204); assert.match(result.headers.get("cache-control"), /no-store/);
assert.ok(!records.some(row => row._id === first.id));
assert.equal(cleanup.length, 1); assert.ok(cleanup[0].notBefore > new Date());
await assert.rejects(() => services.getOwnDraft(first.id), error => error.status === 404);
await services.saveNewDraft(fields); // Deletion frees the product name.
assert.ok(records.some(row => row.ownerId === "other" && row.title === "Tent"));
console.log("PASS: category/owner-scoped normalized duplicates, competing creates, duplicate rename rejection, unchanged-name edits, ownership/origin/session/body/version delete guards, hard deletion, transactional cleanup queue/rollback, and name reuse. Persistence is mocked; live Atlas transaction testing remains pending.");

const publish = load("app/api/v1/me/listings/[id]/publish/route.ts");
const staged = records.at(-1);
const publishRequest = version => new Request("http://localhost:3000/api", {method:"POST",headers:{Origin:"http://localhost:3000","Content-Type":"application/json"},body:JSON.stringify({expectedVersion:version})});
const publishContext={params:Promise.resolve({id:staged._id})};
const incomplete=await publish.POST(publishRequest(staged.version),publishContext);
assert.equal(incomplete.status,400);assert.equal((await incomplete.json()).error.code,"LISTING_INCOMPLETE");
staged.description="";staged.conditionNote="";staged.photos=[{id:"fixture",state:"ready",width:2,height:2}];staged.dailyRatePaise=100;staged.depositPaise=100;staged.approximateValuePaise=10000;staged.availableFrom="2026-12-01";staged.availableUntil="2026-12-10";
const emailGate=await publish.POST(publishRequest(staged.version),publishContext);
assert.equal(emailGate.status,403);assert.equal(staged.status,"draft");
console.log("PASS: incomplete and unverified listings cannot publish and remain private.");

emailVerified=true;
const identityGate=await publish.POST(publishRequest(staged.version),publishContext);
assert.equal(identityGate.status,403);assert.equal((await identityGate.json()).error.code,"PUBLISHING_NOT_READY");assert.equal(staged.status,"draft");
console.log("PASS: complete/email-verified accounts remain private while prototype publishing is disabled.");

prototypeEnabled = true;
actor = "other";
assert.equal((await publish.POST(publishRequest(staged.version), publishContext)).status, 404);
actor = null;
assert.equal((await publish.POST(publishRequest(staged.version), publishContext)).status, 401);
actor = "owner";
assert.equal((await publish.POST(publishRequest(staged.version + 1), publishContext)).status, 409);
staged.depositPaise = 0;
const zeroDeposit = await publish.POST(publishRequest(staged.version), publishContext);
assert.equal(zeroDeposit.status, 400); assert.equal((await zeroDeposit.json()).error.code, "ZERO_DEPOSIT_NOT_APPROVED"); assert.equal(staged.status, "draft");
staged.depositPaise = 100;
staged.availableFrom = null; staged.availableUntil = null; // Usually available is publishable.
const published = await publish.POST(publishRequest(staged.version), publishContext);
assert.equal(published.status, 200);
assert.match(published.headers.get("cache-control"), /no-store/);
assert.equal((await published.json()).data.status, "active");
let stored = records.find(row => row._id === staged._id);
assert.equal(stored.prototypePublished, true);
assert.equal(stored.status, "active");
mock("lib/cloudinary.ts", { getCloudinary: () => { throw new Error("Unexpected provider access"); } });
const publicReads = load("server/services/published-listings.ts");
const visible = await publicReads.getPublishedListing(stored._id);
assert.equal(visible.title, stored.title);
for (const secret of ["ownerId", "approximateValuePaise", "prototypePublished", "pendingPhotoIds"]) assert.equal(secret in visible, false);
assert.match(visible.photos[0].url, /^\/api\/v1\/listings\//);
assert.equal(await publicReads.getPublishedListing(table._id), null, "Drafts stay private");
await assert.rejects(() => publicReads.readPublishedPhoto(table._id, "fixture"), error => error.status === 404);
prototypeEnabled = false;
assert.equal(await publicReads.getPublishedListing(stored._id), null);
assert.deepEqual(await publicReads.getPublishedListings(), []);
prototypeEnabled = true;
await assert.rejects(() => services.getOwnDraft(stored._id), error => error.status === 404);
await assert.rejects(() => services.saveNewDraft(fields), error => error.code === "DUPLICATE_DRAFT");
actor = "other";
assert.equal((await publish.DELETE(publishRequest(stored.version), publishContext)).status, 409);
actor = "owner";
assert.equal((await publish.DELETE(publishRequest(stored.version - 1), publishContext)).status, 409);
prototypeEnabled = false; // Withdrawal remains possible after turning off publication.
const withdrawn = await publish.DELETE(publishRequest(stored.version), publishContext);
assert.equal(withdrawn.status, 200);
stored = records.find(row => row._id === staged._id);
assert.equal(stored.status, "draft"); assert.equal(stored.prototypePublished, false);
console.log("PASS: explicit prototype publish, private-to-active transition, duplicate protection across statuses, owner/session/version guards and withdrawal with the flag disabled.");assert.equal(await publicReads.getPublishedListing(stored._id), null, "Withdrawal hides the item");
await assert.rejects(() => publicReads.readPublishedPhoto(stored._id, "fixture"), error => error.status === 404);
console.log("PASS: public DTO privacy, draft exclusion, flag-disabled catalog exclusion and withdrawn-photo denial without provider access.");

// Exercise the real guard independently of the route's injected test switch.
mocks.delete(path.resolve(root, "server/prototype-publishing.ts"));
cache.delete(path.resolve(root, "server/prototype-publishing.ts"));
const guard = load("server/prototype-publishing.ts").prototypePublishingEnabled;
const previous = { NODE_ENV: process.env.NODE_ENV, ENABLE_PROTOTYPE_PUBLISHING: process.env.ENABLE_PROTOTYPE_PUBLISHING, BETTER_AUTH_URL: process.env.BETTER_AUTH_URL };
try {
  process.env.ENABLE_PROTOTYPE_PUBLISHING = "true"; process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.NODE_ENV = "production"; assert.equal(guard(), false);
  process.env.NODE_ENV = "development"; assert.equal(guard(), true);
  process.env.BETTER_AUTH_URL = "https://rentigo.example"; assert.equal(guard(), true);
  process.env.NODE_ENV = "production"; assert.equal(guard(), true);
  process.env.BETTER_AUTH_URL = "http://rentigo.example"; assert.equal(guard(), false);
  process.env.BETTER_AUTH_URL = "not a URL"; assert.equal(guard(), false);
  process.env.BETTER_AUTH_URL = "http://localhost:3000"; process.env.ENABLE_PROTOTYPE_PUBLISHING = "false"; assert.equal(guard(), false);
} finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
console.log("PASS: real feature guard allows explicit HTTPS hosted testing and rejects non-local HTTP, malformed URLs and disabled flags.");