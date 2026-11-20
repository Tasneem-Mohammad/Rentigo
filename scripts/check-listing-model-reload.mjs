// Reproduce a Next development reload without connecting to a database.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import mongoose from "mongoose";
import ts from "typescript";
const require = createRequire(import.meta.url);
const previous = process.env.NODE_ENV;
process.env.NODE_ENV = "development";
try {
  const old = mongoose.model("Listing", new mongoose.Schema({ status: { type: String, enum: ["draft"] } }, { strict: "throw" }));
  assert.throws(() => new old({ status: "active", prototypePublished: true }), /prototypePublished/);
  const source = fs.readFileSync(new URL("../src/models/listing.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  function reload() {
    const compiled = { exports: {} };
    new Function("require", "module", "exports", output)(name => name === "server-only" ? {} : require(name), compiled, compiled.exports);
    return compiled.exports.Listing;
  }
  const current = reload();
  assert.notEqual(current, old);
  const item = new current({ ownerId: "test", title: "Tent", category: "Outdoor & leisure", condition: "working_well", areaLabel: "Test area", status: "active", prototypePublished: true });
  await item.validate();
  assert.equal(item.prototypePublished, true);
  assert.equal(reload(), current, "Compatible models must be reused");
  assert.equal(mongoose.connection.readyState, 0);
  console.log("PASS: stale draft-only development model reproduced and refreshed; active prototype validates, compatible reload reuses model; no database connection.");
} finally {
  mongoose.deleteModel("Listing");
  if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;
}
