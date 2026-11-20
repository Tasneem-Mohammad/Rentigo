// Opt-in development-only repository integration test; creates/removes labelled fixtures.
// node --env-file=.env.local scripts/check-draft-management-live.mjs --allow-test-drafts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import ts from "typescript";
const require = createRequire(import.meta.url);
assert.ok(process.argv.includes("--allow-test-drafts"), "Explicit test-draft opt-in required.");
assert.ok(/^rentigo_(development|dev|test)(_|$)/.test(process.env.MONGODB_DB ?? ""), "Use a Rentigo development/test database.");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.BETTER_AUTH_URL).hostname));
const root = path.resolve(import.meta.dirname, "../src"), cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const compiled = { exports: {} }; cache.set(file, compiled.exports);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const dependency = name => name === "server-only" ? {} : name.startsWith("@/") ? load(name.slice(2) + ".ts") : name.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(file), name + ".ts"))) : require(name);
  new Function("require", "module", "exports", output)(dependency, compiled, compiled.exports);
  cache.set(file, compiled.exports); return compiled.exports;
}
const repository = load("server/repositories/drafts.ts");
const { Listing } = load("models/listing.ts");
const owner = `qa-draft-management-${randomUUID()}`, other = `qa-draft-management-${randomUUID()}`;
const fixtures = [owner, other];
const fields = { title: "QA disposable tent", category: "Outdoor & leisure", condition: "working_well", conditionNote: "", description: "Disposable repository regression fixture", areaLabel: "QA test area", dailyRatePaise: null, depositPaise: null, approximateValuePaise: null, availableFrom: null, availableUntil: null };
try {
  const first = await repository.createDraft(owner, fields);
  await assert.rejects(() => repository.createDraft(owner, { ...fields, title: "  QA   DISPOSABLE TENT " }), error => error instanceof repository.DuplicateDraftError);
  await repository.createDraft(owner, { ...fields, category: "Tools" });
  await repository.createDraft(other, fields);
  const race = await Promise.allSettled([repository.createDraft(owner, { ...fields, title: "QA race" }), repository.createDraft(owner, { ...fields, title: "qa race" })]);
  assert.equal(race.filter(result => result.status === "fulfilled").length, 1);
  assert.ok(race.find(result => result.status === "rejected").reason instanceof repository.DuplicateDraftError);
  const racer = race.find(result => result.status === "fulfilled").value;
  await assert.rejects(() => repository.updateDraft(owner, racer.id, 0, fields), error => error instanceof repository.DuplicateDraftError);
  const updated = await repository.updateDraft(owner, first.id, 0, { ...fields, areaLabel: "Updated QA area" });
  assert.equal(updated.version, 1);
  assert.equal(await repository.deleteDraft(other, first.id, 1), false);
  assert.equal(await repository.deleteDraft(owner, first.id, 0), false);
  assert.equal(await repository.deleteDraft(owner, first.id, 1), true);
  assert.equal(await repository.findDraft(owner, first.id), null);
  await repository.createDraft(owner, fields);
  console.log("PASS: live Atlas transactions, concurrent duplicate prevention, owner/category scope, rename rejection, update versions, hard deletion and name reuse. Only disposable QA fixtures used; no photos or auth accounts created.");
} catch (error) {
  console.error(`Live draft checks did not pass (${error instanceof assert.AssertionError ? "assertion failure" : "database/transaction failure"}). No private error payload displayed.`);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState === 1) {
    await Listing.deleteMany({ ownerId: { $in: fixtures } });
    await mongoose.connection.collection("draftOwnerLocks").deleteMany({ _id: { $in: fixtures } });
    console.log("Disposable QA drafts and their owner locks removed.");
  }
  await mongoose.disconnect();
}
