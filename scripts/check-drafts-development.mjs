// Creates two labelled development accounts and one draft. No emails or public listings.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
const base = process.env.RENTIGO_BASE_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
assert.equal(process.env.RENTIGO_ALLOW_TEST_ACCOUNT, "true");
const stamp = Date.now();
async function request(path, method = "GET", body, cookie = "", origin = base) {
  return fetch(base + path, { method, headers: { Origin: origin, "Content-Type": "application/json", Cookie: cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function account(label) {
  const username = `draft_${label}_${stamp}`;
  const email = `${username}@example.invalid`; const password = randomBytes(24).toString("hex");
  assert.equal((await request("/api/auth/sign-up/email", "POST", { name: "Draft feature test", username, email, password })).status, 200);
  const signin = await request("/api/auth/sign-in/email", "POST", { email, password });
  assert.equal(signin.status, 200);
  return signin.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
}
assert.equal((await request("/api/v1/me/listings")).status, 401);
const owner = await account("owner"); const other = await account("other");
const path = "/api/v1/me/listings";
assert.equal((await request(path, "POST", { title: "No cross origin" }, owner, "https://untrusted.example")).status, 403);
assert.equal((await request(path, "POST", { title: "Invalid", category: "Tools", condition: "working_well", status: "active" }, owner)).status, 400);
assert.equal((await request(path, "POST", { title: "Invalid", category: "Tools", condition: "working_well", ownerId: "someone-else" }, owner)).status, 400);
assert.equal((await request(path, "POST", { title: "Invalid", category: "Tools", condition: "working_well", dailyRatePaise: -1 }, owner)).status, 400);
assert.equal((await request(path, "POST", { title: " ", category: "Tools", condition: "working_well" }, owner)).status, 400);
assert.equal((await request(path, "POST", { title: "Missing category", condition: "working_well" }, owner)).status, 400);
assert.equal((await request(path, "POST", { title: "Missing condition", category: "Tools" }, owner)).status, 400);
assert.equal((await request(path, "POST", { title: "Needs explanation", category: "Tools", condition: "has_issues" }, owner)).status, 400);
const create = await request(path, "POST", { title: `Private draft test ${stamp}`, category: "Tools", condition: "working_well" }, owner);
assert.equal(create.status, 201, `Creation returned ${create.status}`);
assert.match(create.headers.get("cache-control"), /no-store/);
const { data: draft } = await create.json();
assert.equal(draft.status, "draft"); assert.equal(draft.dailyRatePaise, null);
assert.equal(draft.version, 0); assert.equal(draft.ownerId, undefined);
const item = `${path}/${draft.id}`;
assert.equal((await request(item, "GET", undefined, other)).status, 404);
assert.equal((await request(item, "PATCH", { title: "Not yours", category: "Tools", condition: "working_well", expectedVersion: 0 }, other)).status, 404);
assert.equal((await request(item)).status, 401);
assert.equal((await request(`${path}/bad-id`, "GET", undefined, owner)).status, 404);
assert.equal((await request(`/items/${draft.id}`)).status, 404, "No public draft details");
const others = await (await request(path, "GET", undefined, other)).json();
assert.ok(!others.data.some(row => row.id === draft.id));
const payload = { category: "Tools", condition: "working_well", title: "Edited private draft", dailyRatePaise: 25050, depositPaise: 0, expectedVersion: 0 };
const race = await Promise.all([request(item, "PATCH", payload, owner), request(item, "PATCH", payload, owner)]);
assert.deepEqual(race.map(response => response.status).sort(), [200, 409], "Stale update rejected atomically");
const persisted = await (await request(item, "GET", undefined, owner)).json();
assert.equal(persisted.data.title, payload.title); assert.equal(persisted.data.dailyRatePaise, 25050); assert.equal(persisted.data.depositPaise, 0); assert.equal(persisted.data.version, 1);
const listingPage = await (await request("/listings", "GET", undefined, owner)).text();
assert.ok(listingPage.includes("Edited private draft"));
const editPage = await request(`/listings/${draft.id}/edit`, "GET", undefined, owner);
assert.equal(editPage.status, 200);
const explore = await (await request(`/explore?q=${encodeURIComponent(payload.title)}`)).text();
assert.ok(!explore.includes(`href="/items/${draft.id}"`));
await request("/api/auth/sign-out", "POST", {}, owner); await request("/api/auth/sign-out", "POST", {}, other);
console.log(`PASS: create/read/edit persistence, required category/condition, paise/zero deposit, two-user isolation, public exclusion, origin checks, strict validation and concurrent edit conflict. Retained one private test draft ${draft.id} and two labelled accounts.`);
