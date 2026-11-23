// Component-level interaction regression, without browser, database or email delivery.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../src");
let state = [];
let index = 0;
const destinations = [];
const router = { replace(destination) { destinations.push(destination); }, refresh() {} };
const hooks = { ...React,
  useState(initial) { const slot = index++; if (!(slot in state)) state[slot] = initial; return [state[slot], value => { state[slot] = typeof value === "function" ? value(state[slot]) : value; }]; },
  useEffect() {}, useRef: () => ({ current: null }),
};
function load(relative, mockHooks = true) {
  const file = path.resolve(root, relative);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const compiled = { exports: {} };
  const dependency = name => name === "react" && mockHooks ? hooks : name === "next/navigation" ? { useRouter: () => router }
    : name.startsWith("@/") ? load(name.slice(2) + ".tsx", mockHooks)
    : name.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(file), name + ".tsx")), mockHooks) : require(name);
  new Function("require", "module", "exports", output)(dependency, compiled, compiled.exports);
  return compiled.exports;
}
const { AuthForm } = load("components/shared/auth-form.tsx");
const props = { mode: "signup", enabled: true, google: false, verificationRequired: true, emailAvailable: true };
function render(overrides = {}) { index = 0; return AuthForm({ ...props, ...overrides }); }
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement(node)) return [];
  return [node, ...elements(node.props.children)];
}
const named = (tree, name) => elements(tree).find(node => typeof node.type === "function" && node.type.name === name);
let resets = 0;
const calls = [];
globalThis.FormData = class { constructor(form) { this.values = form.values; } get(key) { return this.values[key] ?? null; } };
async function submit(tree, values, status, data = {}, sessionStatus = 200) {
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (url === "/api/v1/me") return { ok: sessionStatus === 200, status: sessionStatus, json: async () => ({ data: { id: "test-user" } }) };
    return { ok: status >= 200 && status < 300, status, json: async () => data };
  };
  const form = elements(tree).find(node => node.type === "form");
  assert.ok(form);
  await form.props.onSubmit({ preventDefault() {}, currentTarget: { values, reset() { resets++; } } });
}
const registration = { name: "Test", username: "test_user", email: "test@example.test", password: "test-password-only" };
let tree = render();
assert.ok(!named(tree, "VerificationResend"), "Signup does not start with a distracting resend reminder");
await submit(tree, registration, 200);
tree = render();
assert.ok(!elements(tree).some(node => node.type === "form"), "Submitted signup is replaced by check-inbox step");
assert.equal(named(tree, "EmailVerificationStatus").props.state, "pending", "Generic signup success cannot prove verification");
assert.equal(named(tree, "VerificationResend").props.defaultEmail, registration.email);
assert.equal(named(tree, "VerificationResend").props.expanded, true);
assert.equal(named(tree, "VerificationResend").props.initialCooldown, true);
assert.equal(resets, 1);
state = []; tree = render();
await submit(tree, registration, 400);
assert.ok(elements(render()).some(node => node.type === "form"), "Failed signup retains editable form");
assert.equal(resets, 1);
state = []; tree = render({ mode: "login" });
assert.ok(!named(tree, "VerificationResend"), "Ordinary sign-in has no expanded verification reminder");
await submit(tree, { identifier: registration.email, password: registration.password }, 403, { code: "EMAIL_NOT_VERIFIED" });
tree = render({ mode: "login" });
assert.equal(named(tree, "EmailVerificationStatus").props.state, "unverified");
assert.equal(named(tree, "VerificationResend").props.defaultEmail, registration.email);
assert.equal(named(tree, "VerificationResend").props.initialCooldown, true);
state = []; tree = render({ mode: "login" });
await submit(tree, { identifier: "test_user", password: registration.password }, 403, { code: "EMAIL_NOT_VERIFIED" });
assert.equal(named(render({ mode: "login" }), "VerificationResend").props.defaultEmail, "", "Username sign-in never reveals an email");
state = []; tree = render({ mode: "login" });
await submit(tree, { identifier: registration.email, password: "incorrect" }, 401);
assert.ok(!named(render({ mode: "login" }), "EmailVerificationStatus"), "Bad credentials never disclose email verification status");
state = []; tree = render({ mode: "login" }); destinations.length = 0;
await submit(tree, { identifier: registration.email, password: registration.password }, 200, {}, 401);
assert.deepEqual(destinations, [], "Successful HTTP status without a usable session never navigates into a signup bounce");
assert.ok(elements(render({ mode: "login" })).some(node => node.props.role === "status" && node.props.children.includes("couldn’t confirm")));
state = []; tree = render({ mode: "login" });
await submit(tree, { identifier: registration.email, password: registration.password }, 200);
assert.deepEqual(destinations, ["/dashboard"]);
state = []; tree = render({ mode: "login" });
await submit(tree, { identifier: registration.email, password: registration.password }, 503, { code: "EMAIL_DELIVERY_UNAVAILABLE" });
assert.equal(named(render({ mode: "login" }), "EmailVerificationStatus").props.state, "unverified");
state = []; tree = render({ mode: "verify" });
assert.equal(named(tree, "EmailVerificationStatus").props.state, "pending");
assert.ok(named(tree, "VerificationResend"));
state = []; index = 0;
const { VerificationResend } = load("components/shared/verification-resend.tsx");
const resend = VerificationResend({ disabled: false, defaultEmail: registration.email, expanded: true });
await submit(resend, { verificationEmail: registration.email }, 200);
assert.equal(calls.at(-1).url, "/api/auth/send-verification-email");
assert.equal(calls.at(-1).credentials, "omit");
assert.equal(JSON.parse(calls.at(-1).body).email, registration.email);
assert.equal(JSON.parse(calls.at(-1).body).password, undefined);
index = 0;
let waiting = VerificationResend({ disabled: false });
assert.equal(elements(waiting).find(node => node.type === "fieldset").props.disabled, true);
assert.equal(named(waiting, "Button").props.children, "Try again in 30s");
const beforeBlockedSubmit = calls.length;
await submit(waiting, { verificationEmail: registration.email }, 200);
assert.equal(calls.length, beforeBlockedSubmit, "Resend handler refuses submission during cooldown");
state = []; index = 0;
waiting = VerificationResend({ disabled: false, initialCooldown: true });
assert.equal(named(waiting, "Button").props.children, "Try again in 30s", "Initial email send starts a 30-second countdown");
state[1] = 0; index = 0;
const ready = VerificationResend({ disabled: false });
assert.equal(elements(ready).find(node => node.type === "fieldset").props.disabled, false);
assert.equal(named(ready, "Button").props.children, "Resend verification email");
for (const [status, code, expected] of [[503, "EMAIL_TEST_RECIPIENT_RESTRICTED", "Resend account"], [503, "EMAIL_DELIVERY_UNAVAILABLE", "delivery is temporarily"], [403, "INVALID_ORIGIN", "configured address"]]) {
  state = []; index = 0;
  const form = VerificationResend({ disabled: false });
  await submit(form, { verificationEmail: registration.email }, status, { code });
  index = 0;
  const failed = VerificationResend({ disabled: false });
  assert.ok(elements(failed).some(node => node.props.role === "status" && node.props.children.includes(expected)), code);
}
const { EmailVerificationStatus } = load("components/shared/email-verification-status.tsx", false);
for (const [value, label] of [["verified", "Email verified"], ["unverified", "Email not verified"], ["pending", "Email verification pending"]]) {
  const html = renderToStaticMarkup(React.createElement(EmailVerificationStatus, { state: value }));
  assert.ok(html.includes(label)); assert.ok(html.includes("<svg")); assert.ok(html.includes('aria-hidden="true"'));
}
console.log("PASS: signup verification step and prefilled resend, neutral pending badge, failed-signup retention, verified/unverified icons, sign-in verification guidance and wrong-password/username privacy. Component hooks, fetch and form data mocked; browser acceptance pending.");

for (const [code, text] of [["USERNAME_IS_ALREADY_TAKEN", "username is already taken"], ["USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "email already exists"]]) {
 state=[]; tree=render(); const before=resets;
 await submit(tree,registration,code.startsWith('USERNAME')?400:409,{code});
 assert.ok(elements(render()).some(node=>node.props.role==='status'&&String(node.props.children).includes(text)));
 assert.ok(elements(render()).some(node=>node.type==='form'));
 assert.equal(resets,before,'Duplicate errors must retain entered details');
}
console.log('PASS: specific duplicate username/email guidance retains the signup form and entered details.');
