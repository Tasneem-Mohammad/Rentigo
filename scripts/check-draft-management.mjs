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
const matches = (row, filter) => Object.entries(filter).every(([key, value]) => value?.$ne !== undefined ? row[key] !== value.$ne : row[key] === value);
function query(work) { return { session() { return this; }, select() { return this; }, lean: async () => { assert.ok(locked || work.readOnly); return structuredClone(work()); } }; }
const model = {
  find: filter => query(() => records.filter(row => matches(row, filter))),
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
mock("server/auth/session.ts", { currentSession: async () => actor ? { user: { id: actor, accountStatus: "active" } } : null });
mock("server/auth/config.ts", { authConfig: () => ({ BETTER_AUTH_URL: "http://localhost:3000" }) });
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
