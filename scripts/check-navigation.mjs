// Run against `npm start`: node scripts/check-navigation.mjs
import assert from "node:assert/strict";

const base = process.env.RENTIGO_BASE_URL || "http://localhost:3000";
const queue = ["/", "/explore", "/items/cordless-drill", "/items/weekend-tent", "/items/home-projector", "/login", "/signup", "/dashboard", "/listings/new", "/listings", "/bookings", "/bookings/preview", "/messages", "/profile", "/admin"];
const seen = new Set();
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `${path} must return 200`);
  const html = await response.text();
  assert.match(html, /id="main"/, `${path} needs its main landmark`);
  for (const match of html.matchAll(/href="(\/[^"#]*)"/g)) {
    const href = match[1].replaceAll("&amp;", "&");
    if (!href.startsWith("/_next/") && !seen.has(href)) queue.push(href);
  }
  console.log(`PASS ${path}`);
}
for (const path of ["/items/not-a-listing", "/not-a-page"]) {
  assert.equal((await fetch(new URL(path, base))).status, 404, `${path} must return 404`);
}
const filtered = await (await fetch(`${base}/explore?category=Tools`)).text();
assert.match(filtered, /href="\/items\/cordless-drill"/);
assert.doesNotMatch(filtered, /href="\/items\/weekend-tent"/);
const empty = await (await fetch(`${base}/explore?q=nonexistent-example`)).text();
assert.match(empty, /No sample listings match/);
console.log(`Verified ${seen.size} pages/filter URLs, public 404s, category filtering and empty search. Auth redirects are checked separately.`);
