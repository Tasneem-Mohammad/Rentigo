# Local prototype publishing

Confirmed scope: 20 November 2026. Identity/eligibility integration is deferred for this local prototype, retained before public launch. Email verification remains required. No user verification flags are forged or updated.

## Use

Set `ENABLE_PROTOTYPE_PUBLISHING=true` in ignored `.env.local` and run `npm run dev`. The configured `BETTER_AUTH_URL` must use localhost or 127.0.0.1. Restart after changing environment settings. The flag is enabled in the current local file; `.env.example` defaults to false. `npm run start` uses production mode and intentionally cannot enable this exception.

1. Sign in, choose a category and complete item/rental details.
2. Add photos on the same page. This prepares private backing storage; it does not publish.
3. Complete prices, owner-entered deposit/value, pickup area and availability. Finish pending uploads.
4. Publish listing returns home with a dismissible success notification and a View listing link. My Listings and Explore show it as a local prototype.
5. Save as draft instead keeps the item private and returns to My Listings.
6. Unpublish and edit removes the item from prototype discovery and returns it to private editing. Its photos stay attached. Draft deletion remains available after withdrawal.

## Boundaries

POST `/api/v1/me/listings/:id/publish` requires same origin, JSON, strict expectedVersion, an active owner's verified-email session, complete validated details, at least one ready photo and no pending uploads. Atomic owner/status/version updates prevent publication racing with photo/detail changes. Owner/category/normalized-title duplicate checks include both drafts and active items and serialize through existing transactions.

DELETE on that route withdraws only the owner's prototype with the matching version. Withdrawal remains allowed when the feature flag is off. Production, missing flag and non-local configured URLs cannot publish or expose prototype catalog/photos. Existing prototypes are not silently published on deployment.

Public prototype reads include only explicitly marked active prototype records. Drafts are excluded. Public DTOs omit owner IDs, account details, approximate valuation, Cloudinary identifiers and pending upload slots. Authenticated Cloudinary assets remain authenticated; the photo proxy checks current publication on each request and streams without shared caching. Already downloaded images cannot be recalled after withdrawal.

Explore currently shows up to 100 recent prototypes with basic keyword/category/area matching, separate from fictional examples. Full date/distance discovery is later work. No real rental requests, payments, verified-identity badge or reservation behavior is provided.

Automated checks exercise isolated transactional persistence and UI doubles. Live database, browser and email acceptance are separate; no real owner listing was published during these checks.

## Development model reload

A running Next development server can retain Mongoose's earlier draft-only model after a code reload. Publication then rejects the new status/field and previously surfaced as the generic draft-access error. Development model initialization now replaces only a cached model missing publication support; compatible models are reused. This changes the in-memory model, not saved records. A database-free regression reproduces the old-schema rejection and validates the refreshed model (scripts/check-listing-model-reload.mjs). Restart the development server after pulling schema changes.

Publishing rejects an explicit zero deposit until its policy is approved; zero remains valid in private drafts. Explore accepts free-text pickup areas with case-insensitive substring matching. After a conflicting save, step navigation and local text remain available for copying; save/publish/photo mutations stay blocked until an explicit reload discards local changes.
