// Run against a server with ENABLE_AUTH=false. Never uses real credentials.
import assert from "node:assert/strict";
const base = process.env.RENTIGO_BASE_URL || "http://localhost:3000";
for (const endpoint of ["get-session", "sign-in/email", "sign-up/email", "sign-in/social", "request-password-reset", "reset-password"]) {
  const response = await fetch(`${base}/api/auth/${endpoint}`, endpoint === "get-session" ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(response.status, 503, endpoint);
  assert.equal(response.headers.get("set-cookie"), null, "No fabricated session");
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await response.json()).error.code, "AUTH_UNAVAILABLE");
}
const me = await fetch(`${base}/api/v1/me`, { headers: { Cookie: "better-auth.session_token=fake" } });
assert.equal(me.status, 401);
for (const route of ["/dashboard", "/listings/new", "/listings", "/bookings", "/messages", "/profile", "/admin"]) {
  const response = await fetch(base + route);
  const html = await response.text();
  assert.ok(new URL(response.url).pathname === "/login" || /NEXT_REDIRECT[^]*?\/login/.test(html) || /url=\/login/.test(html), `${route} must redirect to login`);
}
// Use a placeholder token to render the disabled reset form; missing-link recovery has its own test.
for (const route of ["/login", "/signup", "/forgot-password", "/reset-password?token=unconfigured-test-token"]) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Account services are not configured yet/);
  assert.match(html, /fieldset disabled/);
}
console.log("PASS: unconfigured auth fails closed; no cookies; private routes guarded; forms clearly unavailable; fake cookie rejected.");
