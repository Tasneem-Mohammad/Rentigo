// Exercises the real draft form and schema without a database, browser or uploads.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as React from "react";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../src");
let state = [], index = 0;
const destinations = [], requests = [];
const router = { replace(value) { destinations.push(value); }, refresh() {} };
const hooks = { ...React, useRef: () => ({ current: null }), useState(initial) { const slot = index++; if (!(slot in state)) state[slot] = initial; return [state[slot], value => { state[slot] = typeof value === "function" ? value(state[slot]) : value; }]; } };
function load(relative) {
  let file = path.resolve(root, relative);
  if (!fs.existsSync(file)) file = file.replace(/\.tsx?$/, "") + (fs.existsSync(file.replace(/\.tsx?$/, "") + ".tsx") ? ".tsx" : ".ts");
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const compiled = { exports: {} };
  const dependency = name => name === "react" ? hooks : name === "server-only" ? {} : name === "next/navigation" ? { useRouter: () => router }
    : name.startsWith("@/") ? load(name.slice(2) + ".ts") : name.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(file), name + ".ts"))) : require(name);
  new Function("require", "module", "exports", output)(dependency, compiled, compiled.exports);
  return compiled.exports;
}
const { DraftForm } = load("components/listings/draft-form.tsx");
const { draftFields, draftUpdate } = load("server/validation/draft-listing.ts");
const fields = { title: "QA drill", category: "Tools", condition: "working_well", areaLabel: "Patamata" };
for (const areaLabel of [undefined, "", "   "]) {
  assert.equal(draftFields.safeParse({ ...fields, areaLabel }).success, false);
  assert.equal(draftUpdate.safeParse({ ...fields, areaLabel, expectedVersion: 0 }).success, false);
}
assert.equal(draftFields.parse({ ...fields, areaLabel: "  Patamata  " }).areaLabel, "Patamata");
assert.equal(draftFields.parse({ ...fields, depositPaise: 0 }).depositPaise, 0);
const { Listing } = load("models/listing.ts");
await assert.rejects(() => new Listing({ ...fields, ownerId: "test-owner", areaLabel: "" }).validate());
globalThis.requestAnimationFrame = callback => { callback(); return 0; };
globalThis.HTMLButtonElement = class { constructor(name, value) { this.name = name; this.value = value; } };
globalThis.FormData = class { constructor(form) { this.values = form.values; } get(key) { return this.values[key] ?? null; } };
let status = 200;
globalThis.fetch = async (url, options) => { requests.push({ url, ...options }); return { ok: status < 400, status, json: async () => status < 400 ? { data: { id: "test-id", version: 10 } } : { error: { message: "Reload the latest draft." } } }; };
const draft = { ...fields, id: "1234567890abcdef12345678", version: 2, photos: [], pendingPhotoIds: [] };
const values = { title: fields.title, areaLabel: "  Patamata  ", rate: "25.50", deposit: "0", value: "2000" };
const props = { draft, photosEnabled: true };
function render(options = props) { index = 0; return DraftForm(options); }
function nodes(node) { if (Array.isArray(node)) return node.flatMap(nodes); if (!React.isValidElement(node)) return []; return [node, ...nodes(node.props.children)]; }
const named = (tree, name) => nodes(tree).find(node => typeof node.type === "function" && node.type.name === name);
function next(tree) { nodes(tree).find(node => node.key === "continue").props.onClick({ preventDefault() {} }); }
async function save(tree, data = values, submitter = new HTMLButtonElement("draftAction", "save")) {
  await nodes(tree).find(node => node.type === "form").props.onSubmit({ preventDefault() {}, nativeEvent: { submitter }, currentTarget: { values: data, querySelector: () => ({ focus() {} }) } });
}
let tree = render(); next(tree); tree = render();
const form = nodes(tree).find(node => node.type === "form");
assert.ok(named(form, "DraftPhotos"), "Photo editor is inside the details form");
const rental = nodes(form).find(node => node.type === "section" && node.props.hidden === false && node.props.className === "journey-fields");
assert.ok(named(rental, "DraftPhotos"), "Photos are in the visible final details step");
assert.ok(nodes(form).indexOf(named(form, "DraftPhotos")) < nodes(form).findIndex(node => node.key === "save"), "Photos appear before Save private draft");
const area = nodes(tree).find(node => node.props.id === "areaLabel");
assert.equal(area.props.required, true);
await save(tree, { ...values, areaLabel: "  " }); assert.equal(requests.length, 0); assert.equal(destinations.length, 0);
await save(render(), values, new HTMLButtonElement("other", "")); assert.equal(requests.length, 0);
named(tree, "DraftPhotos").props.onVersion(9);
named(tree, "DraftPhotos").props.onBusy(true);
await save(render()); assert.equal(requests.length, 0, "Saving waits for a photo operation");
named(tree, "DraftPhotos").props.onBusy(false);
await save(render());
assert.equal(requests.at(-1).method, "PATCH");
assert.equal(JSON.parse(requests.at(-1).body).expectedVersion, 9);
assert.equal(JSON.parse(requests.at(-1).body).areaLabel, "Patamata");
assert.equal(JSON.parse(requests.at(-1).body).depositPaise, 0);
assert.deepEqual(destinations, ["/listings?saved=1"]);
state = []; requests.length = 0; destinations.length = 0;
const creation = {};
tree = render(creation); named(tree, "CategoryPicker").props.onChange("Tools"); next(render(creation));
tree = render(creation);
nodes(tree).find(node => node.type === "input" && node.props.value === "working_well").props.onChange();
next(render(creation)); assert.equal(requests.length, 0, "Continue does not create a draft");
await save(render(creation));
assert.equal(requests.at(-1).method, "POST"); assert.deepEqual(destinations, ["/listings?saved=1"]);
state = []; destinations.length = 0; status = 409;
tree = render(); next(tree); await save(render());
assert.deepEqual(destinations, []); assert.equal(named(render(), "DraftPhotos").props.disabled, true);
console.log("PASS: required/trimmed pickup area on create/update/model, photos before final Save, no Continue/accidental-submit writes, upload/save coordination and shared version, zero deposit, create/edit return to My Listings, and conflict retention. UI/persistence mocked; live acceptance remains manual.");
