// Actual reset page and error shell; form and auth configuration are isolated.
// No database access, email delivery or password changes.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../src");
function FormPlaceholder() { return React.createElement("form", { "data-reset-form": true }); }
function load(relative) {
  const file = path.resolve(root, relative);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const compiled = { exports: {} };
  const dependency = name => name === "./auth-form" ? { AuthForm: FormPlaceholder }
    : name === "@/server/auth/config" ? { authEnabled: () => true, authConfig: () => ({ verificationRequired: true, emailAvailable: true }) }
    : name.startsWith("@/") ? load(name.slice(2) + ".tsx") : require(name);
  new Function("require", "module", "exports", output)(dependency, compiled, compiled.exports);
  return compiled.exports;
}

const { default: ResetPassword } = load("app/(auth)/reset-password/page.tsx");
for (const query of [
  {},
  { error: "INVALID_TOKEN" },
  { token: "" },
  { token: "   " },
  { token: ["one", "two"] },
  { token: "test-token", error: "INVALID_TOKEN" },
  { token: "test-token", error: ["INVALID_TOKEN", "other"] },
]) {
  const page = await ResetPassword({ searchParams: Promise.resolve(query) });
  const html = renderToStaticMarkup(page);
  assert.match(html, /role="alert"/);
  assert.match(html, /password-reset link is missing, invalid or expired/);
  assert.match(html, /href="\/forgot-password"/);
  assert.match(html, /Request a new reset link/);
  assert.doesNotMatch(html, /<form/);
}
const valid = await ResetPassword({ searchParams: Promise.resolve({ token: "test-token" }) });
assert.equal(valid.props.token, "test-token");
const validHTML = renderToStaticMarkup(valid);
assert.match(validHTML, /data-reset-form/);
assert.doesNotMatch(validHTML, /role="alert"/);
console.log("PASS: invalid, expired, missing and repeated reset parameters show recovery guidance without a form; a normal token reaches the reset form. No providers contacted.");
