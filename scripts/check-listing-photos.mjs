// Isolated regression tests: real services/validation/routes, mocked persistence and Cloudinary.
// Does not read .env.local or contact external services.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../src");
const mocks = new Map();
function load(relative) {
  let file = path.resolve(root, relative);
  if (!fs.existsSync(file) && file.endsWith(".ts")) file += "x";
  if (mocks.has(file)) return mocks.get(file);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiled = { exports: {} };
  const dependency = name => name === "server-only" ? {} : name.startsWith("@/") ? load(name.slice(2) + ".ts") : name.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(file), name + ".ts"))) : require(name);
  new Function("require", "module", "exports", output)(dependency, compiled, compiled.exports);
  return compiled.exports;
}
const mock = (file, exports) => mocks.set(path.resolve(root, file), exports);
class DraftError extends Error { constructor(status, code, message) { super(message); Object.assign(this, { status, code }); } }
const id = "1234567890abcdef12345678";
let actor = "owner";
let record = { _id: id, updatedAt: new Date(), ownerId: actor, status: "draft", version: 0, photos: [] };
let available = true;
let stored;
let destroyed = [];
let cleanupFails = false;
let signed;
const { draftDto } = load("server/repositories/draft-dto.ts");
const dto = (row = record) => draftDto(row);
let afterReplace;
const cloud = {
  config: () => ({ cloud_name: "test", api_key: "public-api-key", api_secret: "private-test-secret" }),
  utils: { api_sign_request: params => { signed = params; return "test-signature"; }, private_download_url: () => "https://test.invalid/private-download" },
  api: { resource: async publicId => ({ public_id: publicId, resource_type: "image", type: "authenticated", format: "jpg", width: 800, height: 600, bytes: 1000, ...stored }) },
  uploader: { destroy: async publicId => { if (cleanupFails) throw new Error("offline"); destroyed.push(publicId); return { result: "ok" }; } },
};
mock("lib/cloudinary.ts", { getCloudinary: () => { if (!available) throw new Error("disabled"); return cloud; } });
mock("server/services/drafts.ts", { DraftError, draftOwner: async () => { if (!actor) throw new DraftError(401, "AUTH_REQUIRED", "Sign in"); return actor; } });
mock("server/repositories/listing-photos.ts", {
  photoDraft: async owner => owner === record.ownerId ? structuredClone(record) : null,
  reservePhoto: async (owner, _id, version, photo) => {
    if (owner !== record.ownerId || version !== record.version || record.photos.length >= 20 || record.photos.filter(p => p.state !== "removed").length >= 5) return null;
    record.photos.push(photo); record.version++; return structuredClone(record);
  },
  replacePhotos: async (owner, _id, version, photos) => {
    if (owner !== record.ownerId || version !== record.version) return null;
    record.photos = photos; record.version++;
    const committed = dto(structuredClone(record));
    if (afterReplace) await afterReplace();
    return committed;
  },
  claimExpiredPhoto: async (owner, _id, version, photoId, now) => {
    const photo = record.photos.find(p => p.id === photoId && p.state !== "ready" && p.expiresAt <= now);
    if (owner !== record.ownerId || version !== record.version || !photo) return null;
    photo.state = "removed"; record.version++; return structuredClone(record);
  },
  forgetExpiredPhoto: async (owner, _id, version, photoId, now) => {
    const photo = record.photos.find(p => p.id === photoId && p.state === "removed" && p.expiresAt <= now);
    if (owner !== record.ownerId || version !== record.version || !photo) return null;
    record.photos = record.photos.filter(p => p.id !== photoId); record.version++; return structuredClone(record);
  },
});
mock("server/auth/config.ts", { authConfig: () => ({ BETTER_AUTH_URL: "http://localhost:3000" }) });
const service = load("server/services/listing-photos.ts");
mock("server/services/listing-photos.ts", service);
const request = () => ({ expectedVersion: record.version, contentType: "image/jpeg", sizeBytes: 1000 });
const fails = (operation, status) => assert.rejects(operation, error => error.status === status);
actor = null; await fails(() => service.authorizePhoto(id, request()), 401);
actor = "other"; await fails(() => service.authorizePhoto(id, request()), 404);
actor = "owner";
await fails(() => service.authorizePhoto("bad", request()), 404);
await fails(() => service.authorizePhoto(id, { ...request(), publicId: "someone-elses-photo" }), 400);
await fails(() => service.authorizePhoto(id, { ...request(), contentType: "image/svg+xml" }), 400);
await fails(() => service.authorizePhoto(id, { ...request(), sizeBytes: 6 * 1024 * 1024 }), 400);
available = false; await fails(() => service.authorizePhoto(id, request()), 503); assert.equal(record.photos.length, 0); available = true;
const first = await service.authorizePhoto(id, request());
assert.equal(signed.type, "authenticated"); assert.equal(signed.overwrite, false);
assert.ok(signed.public_id.startsWith(`rentigo/drafts/${id}/`));
assert.ok(!JSON.stringify(first).includes("private-test-secret"));
await fails(() => service.authorizePhoto(id, { ...request(), expectedVersion: 0 }), 409);
for (const invalid of [{ type: "upload" }, { public_id: "foreign-asset" }, { resource_type: "raw" }, { format: "svg" }, { bytes: 6 * 1024 * 1024 }, { width: 0 }, { height: 2000 }]) {
  stored = invalid;
  await fails(() => service.changePhoto(id, { expectedVersion: record.version, photoId: first.photoId, action: "complete" }), 400);
  assert.equal(record.photos[0].state, "pending");
}
stored = undefined;
await service.changePhoto(id, { expectedVersion: record.version, photoId: first.photoId, action: "complete" });
assert.equal(dto().photos.length, 1);
await fails(() => service.changePhoto(id, { expectedVersion: 0, photoId: first.photoId, action: "remove" }), 409);
const second = await service.authorizePhoto(id, request());
await service.changePhoto(id, { expectedVersion: record.version, photoId: second.photoId, action: "complete" });
await service.changePhoto(id, { expectedVersion: record.version, photoId: second.photoId, action: "cover" });
assert.equal(dto().photos[0].id, second.photoId);
await service.changePhoto(id, { expectedVersion: record.version, photoId: second.photoId, action: "remove" });
assert.equal(dto().photos.length, 1); assert.equal(destroyed.length, 0);
record.photos.find(p => p.id === second.photoId).expiresAt = new Date(Date.now() - 1);
cleanupFails = true;
const third = await service.authorizePhoto(id, request());
assert.ok(record.photos.some(p => p.id === second.photoId), "Failed cleanup retains its reference");
cleanupFails = false;
await service.authorizePhoto(id, request());
assert.ok(!record.photos.some(p => p.id === second.photoId)); assert.equal(destroyed.length, 1);
assert.ok(record.photos.some(p => p.id === first.photoId && p.state === "ready"));
record.photos.find(p => p.id === third.photoId).expiresAt = new Date(Date.now() - 1);
await fails(() => service.changePhoto(id, { expectedVersion: record.version, photoId: third.photoId, action: "complete" }), 400);
await service.authorizePhoto(id, request());
await service.authorizePhoto(id, request());
await service.authorizePhoto(id, request());
await fails(() => service.authorizePhoto(id, request()), 409);
let fetches = 0;
globalThis.fetch = async () => { fetches++; return new Response(new Uint8Array([1, 2, 3]), { status: 200 }); };
actor = "other"; await fails(() => service.readPhoto(id, first.photoId), 404); assert.equal(fetches, 0);
actor = "owner";
const image = await service.readPhoto(id, first.photoId);
assert.equal(image.headers.get("cache-control"), "private, no-store");
assert.equal(image.headers.get("content-type"), "image/jpeg");
const routes = load("app/api/v1/me/listings/[id]/photos/route.ts");
const context = { params: Promise.resolve({ id }) };
const crossOrigin = await routes.POST(new Request("http://localhost:3000/api", { method: "POST", headers: { Origin: "https://other.invalid", "Content-Type": "application/json" }, body: JSON.stringify(request()) }), context);
assert.equal(crossOrigin.status, 403);
const oversized = await routes.POST(new Request("http://localhost:3000/api", { method: "POST", headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ padding: "x".repeat(17000) }) }), context);
assert.equal(oversized.status, 413);

record = { _id: id, updatedAt: new Date(), ownerId: actor, status: "draft", version: 0, photos: [] };
const concurrent = await Promise.allSettled([service.authorizePhoto(id, request()), service.authorizePhoto(id, request())]);
assert.equal(concurrent.filter(result => result.status === "fulfilled").length, 1);
assert.equal(concurrent.find(result => result.status === "rejected").reason.status, 409);

// A later text edit must not be adopted by the photo response's version.
const photoRepository = mocks.get(path.resolve(root, "server/repositories/listing-photos.ts"));
record = { _id: id, updatedAt: new Date(), ownerId: actor, status: "draft", title: "Original title", version: 0,
  photos: [{ id: first.photoId, publicId: "snapshot-photo", state: "ready", format: "jpg", width: 800, height: 600, expiresAt: new Date() }] };
afterReplace = async () => { record.title = "Other tab's newer title"; record.version++; };
const committed = await service.changePhoto(id, { expectedVersion: 0, photoId: first.photoId, action: "cover" });
afterReplace = undefined;
assert.equal(committed.version, 1, "Response identifies only the photo commit");
assert.equal(committed.title, "Original title");
assert.equal(record.version, 2);
assert.equal(record.title, "Other tab's newer title");
assert.equal(await photoRepository.replacePhotos(actor, id, committed.version, record.photos), null, "The stale client version cannot overwrite the newer edit");

// Pause confirmation over the expiry boundary, then exercise both possible winners.
const ActualDate = Date;
let now = ActualDate.now();
const originalResource = cloud.api.resource;
const originalDestroy = cloud.uploader.destroy;
const originalClaim = photoRepository.claimExpiredPhoto;
globalThis.Date = class extends ActualDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
};
try {
  for (const winner of ["cleanup", "confirmation"]) {
    record = { _id: id, updatedAt: new ActualDate(now), ownerId: actor, status: "draft", version: 0,
      photos: [{ id: first.photoId, publicId: "expiry-race", state: "pending", expiresAt: new ActualDate(now + 1) }] };
    let releaseResource, notifyStarted, deleted = false;
    const started = new Promise(resolve => { notifyStarted = resolve; });
    cloud.api.resource = async publicId => {
      notifyStarted();
      return new Promise(resolve => { releaseResource = () => resolve({ public_id: publicId, resource_type: "image", type: "authenticated", format: "jpg", width: 800, height: 600, bytes: 1000 }); });
    };
    const confirmation = service.changePhoto(id, { expectedVersion: 0, photoId: first.photoId, action: "complete" }).then(result => ({ result }), error => ({ error }));
    await started; now += 2;
    if (winner === "cleanup") {
      cloud.uploader.destroy = async () => {
        assert.equal(record.photos[0].state, "removed", "Claim precedes provider deletion");
        assert.equal(record.version, 1);
        releaseResource();
        const outcome = await confirmation;
        assert.equal(outcome.error?.code, "VERSION_CONFLICT");
        deleted = true; return { result: "ok" };
      };
      const authorized = await service.authorizePhoto(id, request());
      assert.equal(authorized.version, 3, "Claim, forget and reservation each advance the version");
      assert.ok(!record.photos.some(p => p.id === first.photoId));
      assert.equal(deleted, true);
    } else {
      photoRepository.claimExpiredPhoto = async (...args) => {
        releaseResource();
        assert.ok((await confirmation).result);
        return originalClaim(...args);
      };
      cloud.uploader.destroy = async () => { deleted = true; return { result: "ok" }; };
      await fails(() => service.authorizePhoto(id, request()), 409);
      assert.equal(record.photos[0].state, "ready");
      assert.equal(deleted, false, "Losing cleanup never deletes the ready asset");
      photoRepository.claimExpiredPhoto = originalClaim;
    }
  }
} finally {
  globalThis.Date = ActualDate;
  cloud.api.resource = originalResource;
  cloud.uploader.destroy = originalDestroy;
  photoRepository.claimExpiredPhoto = originalClaim;
}

// Render both configured and disabled states without browser or provider access.
const { DraftPhotos } = load("components/listings/draft-photos.tsx");
const preview = { id, title: "Test camera", photos: [{ id: first.photoId, url: `/api/v1/me/listings/${id}/photos/${first.photoId}`, width: 800, height: 600 }], pendingPhotoIds: [] };
const props = { draft: preview, version: 0, disabled: false, onBusy() {}, onVersion() {}, onConflict() {} };
const configured = renderToStaticMarkup(createElement(DraftPhotos, { ...props, enabled: true }));
assert.ok(configured.includes("Cover photo")); assert.ok(configured.includes(preview.photos[0].url));
assert.ok(!configured.includes("cloudinary.com"));
const disabled = renderToStaticMarkup(createElement(DraftPhotos, { ...props, enabled: false }));
assert.ok(disabled.includes("Photo uploads need Cloudinary configuration"));
assert.match(disabled, /type="file"[^>]*disabled/);

// Inspect the real repository's atomic query boundaries independently of service mocks.
let query;
const row = { _id: { toString: () => id }, title: "Test camera", updatedAt: new Date(), version: 0 };
mock("models/listing.ts", { Listing: {
  findOneAndUpdate: (...args) => { query = args; return { lean: async () => null }; },
  findOne: () => ({ lean: async () => row }),
} });
mock("lib/mongodb.ts", { connectDatabase: async () => {} });
mocks.delete(path.resolve(root, "server/repositories/listing-photos.ts"));
const repository = load("server/repositories/listing-photos.ts");
await repository.reservePhoto("owner", id, 3, { id: first.photoId, publicId: "test", state: "pending", expiresAt: new Date() });
assert.equal(query[0].ownerId, "owner"); assert.equal(query[0].status, "draft"); assert.equal(query[0].version, 3);
assert.ok(query[0].$expr.$and.length === 2); assert.equal(query[1].$inc.version, 1);
await repository.replacePhotos("owner", id, 4, []);
assert.equal(query[0].ownerId, "owner"); assert.equal(query[0].version, 4); assert.equal(query[0].status, "draft");
const expiredAt = new Date();
await repository.claimExpiredPhoto("owner", id, 5, first.photoId, expiredAt);
assert.equal(query[0].ownerId, "owner"); assert.equal(query[0].status, "draft"); assert.equal(query[0].version, 5);
assert.deepEqual(query[0].photos.$elemMatch, { id: first.photoId, state: { $in: ["pending", "removed"] }, expiresAt: { $lte: expiredAt } });
assert.equal(query[1].$set["photos.$.state"], "removed"); assert.equal(query[1].$inc.version, 1);
await repository.forgetExpiredPhoto("owner", id, 6, first.photoId, expiredAt);
assert.equal(query[0].ownerId, "owner"); assert.equal(query[0].status, "draft"); assert.equal(query[0].version, 6);
assert.equal(query[0].photos.$elemMatch.state, "removed");
assert.equal(query[1].$pull.photos.state, "removed"); assert.equal(query[1].$inc.version, 1);
const drafts = load("server/repositories/drafts.ts");
assert.deepEqual((await drafts.findDraft("owner", id)).photos, [], "Old drafts remain readable");
row.photos = [{ id: first.photoId, publicId: "private-provider-id", state: "ready", width: 800, height: 600 }];
const photoDTO = await drafts.findDraft("owner", id);
assert.ok(!JSON.stringify(photoDTO).includes("private-provider-id"));
assert.equal(photoDTO.photos[0].url, preview.photos[0].url);
console.log("PASS: photo ownership/authentication, strict input, fixed signed IDs, asset verification, committed response version, both expiry/confirmation race orders, cleanup fencing/retry, photo limits, cover/removal, private delivery, origin/body limits and repository query boundaries. Provider and database mocked; live integration still required.");
