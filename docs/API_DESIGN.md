# Rentigo API Design

Version 0.1 | 14 November 2026 | Proposed v1 contract

## Scope

Read with DB_DESIGN.md. One Next.js application exposes same-origin JSON APIs under /api/v1. Internal server-rendered pages may call the same business services directly. No separate backend deployment is needed.

Latest decisions: username/password and Google sign-in; account creation does not grant a verified badge; both owners and renters require a successful live external identity check before transacting. Aadhaar OR PAN are intended options, dependent on provider capabilities. Admin manages initial users, permissions and reports, but does not manually validate government IDs. Public self-registration can coexist with admin-provisioned initial accounts; it is not invite-only.

Proposed, not final: 2–10-day rentals, rolling 24-hour billing, one-hour payment hold, 24-hour inspection after established actual return. Owner-response expiry, cancellations and minors' transaction eligibility remain unresolved. Paid launch must not proceed without these rules. Prototype identity and payment results are test-only.

## Conventions

- JSON uses camelCase, opaque string IDs, ISO 8601 UTC timestamps, integer paise, and currency INR.
- Authentication uses the chosen auth library's secure HttpOnly cookies. Its OAuth callbacks, session refresh, CSRF protections and sign-out routes remain library-owned.
- All mutations validate origin/session protections; all services check actor permissions and expected state.
- Standard single response: {"data": {...}}. List response: {"data": [...], "page": {"nextCursor": "opaque-or-null"}}.
- Default list limit 20, maximum 50. Cursors bind filters/sort and provide deterministic ordering with an ID tie-breaker. Nearby-search cursors must preserve distance ordering; do not use a createdAt cursor for distance-sorted pages.
- Error shape: {"error":{"code":"DATES_UNAVAILABLE","message":"This item is unavailable for those dates.","requestId":"opaque"}}. Validation errors may add safe fieldErrors.
- 200 read/update; 201 resource created; 202 provider operation pending; 204 deletion; 400 invalid input; 401 unauthenticated; 403 forbidden; 404 missing or intentionally concealed resource; 409 conflict; 422 policy/validation failure; 429 rate limit; 503 unavailable dependency.
- Use Idempotency-Key on identified mutation endpoints below. Same actor/key/body repeats the original result; same key with different body returns 409 IDEMPOTENCY_CONFLICT. Scope keys per actor and operation.
- Versioned updates include expectedVersion. Stale versions return 409 VERSION_CONFLICT. State transitions never accept a user-supplied arbitrary status.
- Send Cache-Control: no-store for accounts, bookings, private addresses, messages, verification and money responses. Public discovery may use bounded caching, with availability rechecked at acceptance.

## Account and sign-in

| Method and path | Access | Request and result |
| --- | --- | --- |
| POST /auth/register | Public, rate-limited | {username,email,password}; creates account and library-managed email/activation flow; no identity badge |
| POST /auth/password-reset-requests | Public, rate-limited | {email}; generic 202 response preventing account enumeration |
| POST /auth/password-resets | One-use reset token | {token,newPassword}; invalidate token and applicable sessions |
| GET /me | Signed in | Safe profile, roles, accountStatus, identityStatus, eligibilityStatus and capabilities |
| PATCH /me | Account owner | {displayName,avatarAssetId?,expectedVersion}; no roles or verification fields |
| GET /users/:id/profile | Public | Display name, safe avatar, genuine verification label and completed-rental count; no email, IDs or address |

Credentials login and Google OAuth start/callback routes follow the selected auth library and are not independently reinvented here. Google uses state and applicable PKCE protections. Do not silently link a Google identity to an existing credentials account based only on a matching email; require the library's secure linking policy and proof of account control.

Username/password users must have a recoverable verified contact method before sensitive operations. Do not reveal whether a username/email exists in password recovery or login errors.

## Identity verification

| Method and path | Access | Request and result |
| --- | --- | --- |
| POST /identity-verifications | Active account; idempotent | {documentType: aadhaar/pan,consentVersion}; returns verificationId, status and provider-hosted continuation URL |
| GET /identity-verifications/current | Account owner | Latest safe status, environment, reason code if actionable, next step |
| POST /webhooks/identity/:provider | Provider signature | Receives provider event; applies verified outcome |

The backend obtains document/person-match outcomes from an approved provider. No general government-ID upload endpoint is offered. Request explicit provider consent and any required alternative identification flow. A photo upload or PAN existence lookup cannot mark a user verified.

Only a successful live provider check updates real identity status. Test responses include environment=test and badgeLabel=Demo verification; live authorisation ignores them. If the provider is unconfigured, return 503 VERIFICATION_UNAVAILABLE, not a fake success. Verification does not independently determine adult contractual eligibility.

Webhook handling verifies the signature over the raw request body and applicable timestamp/replay checks. Unknown sessions, environment mismatches or invalid signatures must not change identity. Acknowledge valid duplicates; retry safe processing after transient failures. Never log raw document payloads.

## Categories, listings and images

| Method and path | Access | Contract |
| --- | --- | --- |
| GET /categories | Public | Active category IDs, slugs, names and order |
| GET /listings | Public | q,categoryId,lat,lng,radiusKm,startAt,endAt,cursor,limit filters |
| GET /listings/:id | Public for active listing | Public projection, owner summary and approximate location only |
| GET /me/listings | Owner | Draft/active/paused/archived own listings |
| POST /listings | Active account | Create draft from listing fields; does not publish |
| PATCH /listings/:id | Owner | Allowed fields and expectedVersion; accepted booking terms unchanged |
| POST /listings/:id/publish | Verified eligible owner | Validate required fields, category policy and availability; {expectedVersion} |
| POST /listings/:id/pause | Owner | Stop new discovery/requests; existing bookings retained |
| POST /listings/:id/archive | Owner | Archive rather than deleting booking history |
| GET /listings/:id/availability | Public | startAt,endAt; indicative availability, not a reservation |
| POST /listings/:id/availability-blocks | Owner | {startAt,endAt}; coordinate with bookings transactionally |
| DELETE /listings/:id/availability-blocks/:blockId | Owner | Remove own owner block, not booking reservation |
| POST /uploads/sign | Active owner | {listingId,purpose:listing_photo,contentType,sizeBytes}; bounded provider upload authorisation |
| POST /listings/:id/photos | Owner | {assetId,expectedVersion}; backend verifies ownership/type/size before attachment |
| DELETE /listings/:id/photos/:assetId | Owner | Detach and arrange safe provider cleanup |

Create/update fields: title, categoryId, description?, condition {status,note}, dailyRatePaise, depositPaise, approximateValuePaise, areaLabel, approximateLocation, and permitted photo references. Exact pickup details use a separate owner-only update path: PUT /listings/:id/pickup-details {pickupAddress,pickupInstructions?,exactLocation?}.

Search requires lat and lng together; validate coordinates and bounded radius. Both dates must be supplied together. Filter availability before final pagination. Without coordinates, allow area/category browsing; do not claim exact distance. Availability can change after the response. Hidden/private listings return 404 to unauthorised callers.

Cloudinary upload signatures are server-generated and short-lived; the browser uploads directly to the provider. Do not accept arbitrary external URLs or another user's asset IDs as verified listing photos. Restrict formats, size and count; periodically clean orphaned uploads.

## Quotes and booking requests

POST /booking-quotes — active verified eligible renter. Body:

```json
{
  "listingId": "listing-id",
  "startAt": "2026-12-01T04:30:00Z",
  "endAt": "2026-12-03T04:30:00Z"
}
```

Example data response:

```json
{
  "quoteId": "quote-id",
  "billableDays": 2,
  "dailyRatePaise": 20000,
  "rentalSubtotalPaise": 40000,
  "depositPaise": 180000,
  "platformFeePaise": 0,
  "totalUpfrontPaise": 220000,
  "currency": "INR",
  "policyVersion": "prototype-v1",
  "expiresAt": "2026-11-14T10:15:00Z",
  "environment": "test"
}
```

A quote reserves nothing. Its expiry and provisional billing formula must be configurable and clearly labelled while policy remains unapproved. The server computes all amounts.

| Method and path | Actor | Contract |
| --- | --- | --- |
| POST /bookings | Renter | {quoteId,message?}; Idempotency-Key; creates requested booking, rejects self-rental |
| GET /me/bookings | Participant | role=owner/renter, status, cursor, limit |
| GET /bookings/:id | Participant | Agreement, safe parties, stage, allowedActions, relevant financial summary |
| GET /bookings/:id/events | Participant | Safe chronological event history |
| POST /bookings/:id/accept | Owner | {expectedVersion}; Idempotency-Key; recheck both users, dates and agreement; create payment hold |
| POST /bookings/:id/decline | Owner | {expectedVersion,reasonCode?} |
| POST /bookings/:id/proposals | Participant before acceptance | {expectedVersion,startAt,endAt,dailyRatePaise,depositPaise}; server calculates totals |
| POST /bookings/:id/proposals/:proposalId/accept | Other participant | {expectedVersion}; establishes agreement and reserves dates transactionally |
| POST /bookings/:id/proposals/:proposalId/reject | Other participant | {expectedVersion}; no silent acceptance or price change |
| POST /bookings/:id/cancel | Participant | {expectedVersion,reasonCode}; apply applicable policy; financial outcome separate |

An owner counteroffer enters awaiting_renter_agreement. A renter counteroffer awaits owner agreement. Only the other participant may accept. Supersede older proposals. State and version checks reject races. Accepting original or revised final terms must consistently reserve the item before payment. Do not expose a payment operation for an unaccepted proposal.

Pre-acceptance withdrawal may cancel without payment. Later cancellation rules are not final. The real-money path must fail closed where the financial policy is unconfigured rather than inventing fees. Do not auto-expire unanswered requests until the owner-response policy is decided.

## Pickup, return and exceptions

| Method and path | Actor | Contract |
| --- | --- | --- |
| GET /bookings/:id/pickup-details | Owner or booked renter | Exact address and instructions; no-store |
| POST /bookings/:id/pickup-confirmations | Participant | {expectedVersion,conditionNote?,evidenceAssetIds?}; Idempotency-Key |
| POST /bookings/:id/return-confirmations | Participant | {expectedVersion,conditionNote?,evidenceAssetIds?}; Idempotency-Key |
| POST /bookings/:id/reports | Participant | {category,description,evidenceAssetIds?}; report an issue in a valid stage |
| GET /reports/:id | Authorised participant/admin | Role-filtered report, no private internal notes |
| POST /reports/:id/evidence-upload-session | Authorised participant | Short-lived private upload authorisation |
| POST /reports/:id/evidence | Authorised participant | {assetId}; verify purpose and ownership |

Both pickup confirmations are required for in_use. Both return confirmations, or a documented administrative resolution, establish return. A report can pause settlement without erasing booking history. Refused return, one-sided confirmation and silence need review/escalation, not automatic assumptions of guilt.

An item mismatch can be reported before pickup. A suspended user retains tightly scoped ability to return an existing item, communicate about that booking and respond to a report. Suspension blocks new transactions rather than trapping current rentals.

Return inspection is proposed at 24 hours after established actual return; the no-response and financial-release rule is unresolved. No scheduled process may silently invent that rule.

## Messaging

| Method and path | Access | Contract |
| --- | --- | --- |
| POST /conversations | Active account | {listingId}; return existing or new owner/renter conversation |
| GET /me/conversations | Participant | Paginated summaries |
| GET /conversations/:id/messages | Participant | cursor or afterMessageId,limit; stable ordering |
| POST /conversations/:id/messages | Participant | {body,clientMessageId}; idempotent by client message ID |

Validate nonempty bounded text and display as text, not executable HTML. Proposed maximum 2,000 characters. Poll only an open visible conversation and back off on errors; no blanket constant polling across every screen.

## Payments and billing

| Method and path | Access | Contract |
| --- | --- | --- |
| POST /bookings/:id/payment-session | Booking renter | {termsRevision}; Idempotency-Key; derives amount from stored agreement |
| GET /bookings/:id/payment-summary | Participant | Separate rental/deposit/collection/refund/payout status |
| POST /webhooks/payments/:provider | Provider signature | Verified event processing, duplicate-safe |

Payment-session response: operationId, environment, status, expiresAt and provider continuation URL when applicable. Browser cannot submit a payable amount or select the payee. Session expiry cannot outlive the reservation without an explicit recovery design.

Webhook signature validation uses raw bytes and a secret, with provider-specific replay handling. Persist event identity uniquely, then transactionally update operation and booking state. Return 2xx for already processed valid events; transient failures must be retryable. A browser redirect never marks payment succeeded.

If collection succeeds after the reservation expired, do not automatically book an overlapping rental. Flag recovery and arrange provider-supported refund/reconciliation under a defined policy. Background reconciliation must cover delayed/missed events before live payments.

The mock provider is available only in explicit test mode. If a demo callback endpoint is needed, restrict it to the test environment and authorised test actors. Live mode must reject all simulation actions. Test identity does not grant real verified privileges; demo transactions use an isolated sandbox with no real handovers or funds.

Refunds, deposit releases and payouts are backend operations triggered by an approved policy or admin decision. No public arbitrary-amount refund endpoint. Never automatically transfer the deposit to the owner on their unsupported claim. A provider-independent payment adapter is required, but escrow and hold capabilities are not assumed. Full financial ledger, fees, settlement and provider onboarding remain live-launch prerequisites.

## Admin API

Every admin mutation is authorised server-side and audited. A first admin is provisioned using a controlled server-side setup, not a public request field.

| Method and path | Contract |
| --- | --- |
| POST /admin/users | {email,displayName}; creates pending activation, unverified account |
| GET /admin/users | Filtered safe list |
| PATCH /admin/users/:id/roles | {roles,expectedVersion,reason}; prevent accidental removal of last admin |
| POST /admin/users/:id/restrictions | {action:suspend/restore,reason,expectedVersion} |
| GET /admin/reports | status,cursor,limit |
| POST /admin/reports/:id/assign | {adminId,expectedVersion} |
| POST /admin/reports/:id/decisions | {outcomeCode,reason,expectedVersion}; financial actions remain tracked separately |
| POST /admin/listings/:id/hide | {reason,expectedVersion} |
| POST /admin/categories | {slug,name,sortOrder} |
| PATCH /admin/categories/:id | {name?,active?,sortOrder?,expectedVersion} |

No admin endpoint marks a live identity verified without provider evidence. Operator actions do not bypass party agreement or create successful payment records.

## Connection and transaction flows

1. Listing: authenticated owner creates draft, obtains upload authorisation, uploads directly, attaches verified asset references, and publishes only after identity/eligibility checks.
2. Booking: renter gets quote, requests rental, owner accepts through the coordinated reservation transaction, then renter starts payment for stored terms.
3. Payment: provider collects or simulates, verified event updates records, booking becomes booked; exact pickup details become accessible.
4. Handover: both confirm pickup; server advances state once.
5. Return: both confirm or admin resolves; inspection/issue process applies; backend requests financial settlement and records provider outcomes before completion.
6. Identity: provider collects approved data, checks document/person match, sends verified result; server updates minimal verification records and capabilities.

In-process timers cannot guarantee expiry, reminders or payouts on serverless hosting. Enforce deadlines during reads/mutations and add an authorised scheduler/reconciliation service before guaranteed background operations. Scheduler and webhook internal operations are idempotent and use the same business services.

## Key error codes

VALIDATION_ERROR, AUTH_REQUIRED, FORBIDDEN, ACCOUNT_RESTRICTED, IDENTITY_VERIFICATION_REQUIRED, TRANSACTION_ELIGIBILITY_PENDING, VERIFICATION_UNAVAILABLE, LISTING_UNAVAILABLE, SELF_RENTAL_NOT_ALLOWED, QUOTE_EXPIRED, TERMS_CHANGED, DATES_UNAVAILABLE, RESERVATION_EXPIRED, INVALID_BOOKING_STATE, VERSION_CONFLICT, IDEMPOTENCY_CONFLICT, POLICY_NOT_CONFIGURED, PAYMENT_PENDING, PROVIDER_UNAVAILABLE, RATE_LIMITED.

Messages should explain the next action without exposing provider secrets or revealing private resource existence. Dependency outages are retryable; unsuccessful identity outcomes are not automatically retried indefinitely.

## Verification plan

Before prototype release, test owner/renter access boundaries, private address leakage, self-rental, quote tampering, stale proposal acceptance, overlapping concurrent reservations, expired holds, duplicate confirmation requests, and test/live separation. Before paid launch, add signed-webhook tests, duplicate/out-of-order events, partial refunds, settlement failures, delayed payment success, and reconciliation recovery.

## Unresolved launch decisions

Identity provider and approved Aadhaar/PAN verification mechanism; treatment of minors; credentials recovery provider; final rental duration/rounding; cancellations; owner request expiry; inspection escalation; deposit/payout mechanism; real financial accounting; retention periods; and the scheduler/reconciliation operational owner. Free hosting does not imply these services are free or automatically available.
