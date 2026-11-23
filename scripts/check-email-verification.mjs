// Exercises the actual auth configuration, replacing only MongoDB and email delivery.
// No .env.local, real accounts, database connections or external email sends are used.
import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import ts from "typescript";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { username } from "better-auth/plugins";

const require = createRequire(import.meta.url);
Object.assign(process.env, {
  NODE_ENV: "development", ENABLE_AUTH: "true", ENABLE_DATABASE: "true",
  MONGODB_URI: "mongodb://localhost/test", MONGODB_DB: "test",
  BETTER_AUTH_SECRET: "verification-test-secret-which-is-at-least-32-characters",
  BETTER_AUTH_URL: "http://localhost:3000", AUTH_REQUIRE_EMAIL_VERIFICATION: "true",
  RESEND_API_KEY: "mock-only", AUTH_EMAIL_FROM: "Rentigo <onboarding@resend.dev>",
  GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "",
});
const store = { user: [], account: [], session: [], verification: [], rateLimit: [] };
let config;
let cookie = "";
function load(file) {
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiled = { exports: {} };
  const dependency = name => name === "server-only" ? {} : name === "./config" ? config
    : name === "better-auth" ? { betterAuth }
    : name === "better-auth/plugins" ? { username }
    : name === "better-auth/adapters/mongodb" ? { mongodbAdapter: () => memoryAdapter(store) }
    : name === "mongodb" ? { MongoClient: class { db() { return {}; } } }
    : name === "@/server/auth/auth" ? { getAuth }
    : name === "./auth" ? { getAuth }
    : name === "@/server/auth/config" ? config
    : name === "@/components/shared/auth-preview" ? { AuthPreview: () => null }
    : name === "next/headers" ? { headers: async () => new Headers({ Cookie: cookie }) }
    : name === "next/navigation" ? { redirect: destination => { throw Object.assign(new Error("Redirect"), { destination }); } } : require(name);
  new Function("require", "module", "exports", output)(dependency, compiled, compiled.exports);
  return compiled.exports;
}
config = load("../src/server/auth/config.ts");
const { getAuth } = load("../src/server/auth/auth.ts");
const sent = [];
let deliveryFailure;
globalThis.fetch = async (url, options) => {
  assert.equal(url, "https://api.resend.com/emails");
  sent.push(JSON.parse(options.body));
  if (deliveryFailure === "network") throw new Error("private transport details");
  if (deliveryFailure) return new Response(JSON.stringify(deliveryFailure), { status: 403 });
  return new Response("{}", { status: 200 });
};
const auth = getAuth();
const base = "http://localhost:3000";
async function post(path, body) {
  return auth.handler(new Request(`${base}/api/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify(body) }));
}
const email = "verification@example.test";
const password = "test-only-password-1234";
const callbackURL = "/login?verification=complete";
const signup = await post("sign-up/email", { name: "Verification test", username: "verify_test", email, password, callbackURL });
assert.equal(signup.status, 200);
const id = (await signup.json()).user.id;
const duplicate = await post("sign-up/email", { name: "Different name", username: "different_user", email: email.toUpperCase(), password: "different-password-1234", callbackURL });
assert.equal(duplicate.status, 409, "Duplicate email has explicit signup guidance");
const duplicateUsername = await post("sign-up/email", { name: "Different name", username: "VERIFY_TEST", email: "other@example.test", password, callbackURL });
assert.equal(duplicateUsername.status, 400); assert.equal((await duplicateUsername.json()).code, "USERNAME_IS_ALREADY_TAKEN");
assert.equal(store.user.length, 1, "Duplicate/case-variant email or username never creates a second stored account");
assert.equal(store.user[0].id, id);
assert.equal(store.user[0].username, "verify_test");
assert.equal(store.account.length, 1, "Duplicate signup does not add or replace credentials");
for (const [path, identifier] of [["sign-in/email", { email }], ["sign-in/username", { username: "verify_test" }]]) {
  const response = await post(path, { ...identifier, password, callbackURL });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "EMAIL_NOT_VERIFIED");
  assert.ok(!response.headers.get("set-cookie"));
}
const wrong = await post("sign-in/email", { email, password: "wrong-password" });
assert.notEqual((await wrong.json()).code, "EMAIL_NOT_VERIFIED");
assert.equal((await post("send-verification-email", { email, callbackURL })).status, 200);
const link = sent.at(-1).text.split("\n").find(line => line.startsWith("http"));
const count = sent.length;
assert.equal((await post("send-verification-email", { email: "absent@example.test", callbackURL })).status, 200);
assert.equal(sent.length, count);
deliveryFailure = { message: `You can only send testing emails to your own email address (${email}).` };
const restricted = await auth.api.sendVerificationEmail({ body: { email, callbackURL }, asResponse: true });
assert.equal(restricted.status, 503);
const restrictedBody = await restricted.json();
assert.equal(restrictedBody.code, "EMAIL_TEST_RECIPIENT_RESTRICTED");
assert.ok(!JSON.stringify(restrictedBody).includes(email), "Provider recipient details stay private");
deliveryFailure = "network";
const deliveryOutage = await auth.api.sendVerificationEmail({ body: { email, callbackURL }, asResponse: true });
assert.equal(deliveryOutage.status, 503);
assert.equal((await deliveryOutage.json()).code, "EMAIL_DELIVERY_UNAVAILABLE");
deliveryFailure = undefined;
const invalid = new URL(link);
invalid.searchParams.set("token", "invalid");
const rejected = await auth.handler(new Request(invalid));
assert.equal(rejected.status, 302);
assert.ok(rejected.headers.get("location").includes("error="));
const verified = await auth.handler(new Request(link));
assert.equal(verified.status, 302);
const login = await post("sign-in/username", { username: "verify_test", password });
assert.equal(login.status, 200);
const user = (await login.json()).user;
assert.equal(user.id, id);
assert.equal(user.emailVerified, true);
assert.equal(user.identityStatus, "unverified");
cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
const route = load("../src/app/api/auth/[...all]/route.ts");
const blocked = await route.POST(new Request(`${base}/api/auth/sign-up/email`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie }, body: JSON.stringify({ name: "Should not create", username: "blocked_user", email: "second@example.test", password }) }));
assert.equal(blocked.status, 409);
assert.equal((await blocked.json()).error.code, "ALREADY_SIGNED_IN");
assert.equal(store.user.length, 1);
const { default: SignupPage } = load("../src/app/(auth)/signup/page.tsx");
await assert.rejects(() => SignupPage(), error => error.destination === "/dashboard", "Signed-in signup page redirects to the existing account");
const guards = load("../src/server/auth/session.ts");
assert.equal((await guards.requireUser()).user.id, id);
store.user[0].emailVerified = false;
assert.equal(await guards.currentSession(), null);
await assert.rejects(() => guards.requireUser(), error => error.destination === "/verify-email", "Unverified sessions retain verification guidance");
store.user[0].emailVerified = true;
const savedCookie = cookie; cookie = "";
await assert.rejects(() => guards.requireUser(), error => error.destination === "/login", "Missing sessions return to sign-in, never signup");
cookie = savedCookie;
console.log("PASS: email/username verification gates, wrong-password privacy, neutral resend, invalid link, successful verification, unchanged user ID and identity status, and verified sign-in. Persistence and delivery mocked; no external services contacted.");
