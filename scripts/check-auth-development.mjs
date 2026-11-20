// Explicit opt-in: creates one test account in the configured development database.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
const base = process.env.RENTIGO_BASE_URL || "http://localhost:3101";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
assert.equal(process.env.RENTIGO_ALLOW_TEST_ACCOUNT, "true", "Set RENTIGO_ALLOW_TEST_ACCOUNT=true to create a development test account.");
const username = `rentigo_test_${Date.now()}`;
const email = `${username}@example.invalid`;
const password = randomBytes(24).toString("hex");
let cookie = "";
async function post(path, body, withCookie = false) {
  const response = await fetch(`${base}/api/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, ...(withCookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  return response;
}
function remember(response) { cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; "); }
const signup = await post("sign-up/email", { name: "Rentigo development test", username, email, password, role: "admin", identityStatus: "verified" });
assert.equal(signup.status, 200, `Signup failed: HTTP ${signup.status}`);
assert.equal((await fetch(`${base}/api/v1/me`)).status, 401);
const wrong = await post("sign-in/email", { email, password: "incorrect-password" });
assert.notEqual(wrong.status, 200, "Wrong password rejected");
const signin = await post("sign-in/email", { email, password });
assert.equal(signin.status, 200, `Signin failed: HTTP ${signin.status}`);
remember(signin); assert.ok(cookie);
const me = await fetch(`${base}/api/v1/me`, { headers: { Cookie: cookie } });
assert.equal(me.status, 200);
const { data } = await me.json();
assert.equal(data.email, email); assert.equal(data.emailVerified, false);
assert.deepEqual(data.roles, ["user"]); assert.equal(data.identityStatus, "unverified");
assert.equal(data.capabilities.canPublish, false); assert.equal(data.capabilities.canBook, false);
assert.equal((await post("sign-out", {}, true)).status, 200);
assert.equal((await fetch(`${base}/api/v1/me`, { headers: { Cookie: cookie } })).status, 401, "Old session revoked");
const byUsername = await post("sign-in/username", { username, password });
assert.equal(byUsername.status, 200); remember(byUsername);
await post("sign-out", {}, true);
console.log(`PASS: signup, email/username signin, wrong-password rejection, safe account defaults, session access and signout. One test account retained: ${username}. No emails sent.`);
