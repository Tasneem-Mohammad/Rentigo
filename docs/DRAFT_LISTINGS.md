# Private draft listings

## Deletion and duplicate prevention — 19 November 2026

My Listings has a labelled trash icon, a permanent-delete confirmation and Cancel. The owner-only DELETE endpoint requires configured origin, strict JSON, an active session, ownership, draft status and expected version. It hard-deletes the listing document; stale deletes receive 409, foreign/missing records 404. Success returns to My Listings with a deletion notice. Existing user duplicates are not automatically removed.

Create and rename/category-change operations reject the same normalized title in the same category for the same owner. NFKC normalization, case folding and whitespace normalization are used. Existing legacy duplicates can retain their unchanged title while editing other details; creating another or renaming into a collision is blocked. Errors leave the form editable. Names do not identify matching photographs or differently named physical products.

MongoDB transactions serialize metadata mutations with one `draftOwnerLocks` revision document per owner, preventing concurrent create/rename races across app instances without a destructive backfill or new unique-title index. The existing listing owner/status/version filters still fence photo changes and deletion. Atlas replica-set transactions and CRUD/create-collection permissions are required. No external service or in-process correctness lock is introduced.

Deletion atomically records provider IDs in `draftPhotoCleanup` before the draft disappears. Entries become due only after their original upload reservation expires, preventing late uploads from recreating already-cleaned assets. No full draft contents are retained in the queue. Run `node --env-file=.env.local scripts/cleanup-deleted-draft-photos.mjs` for a dry run; add `--apply` for due development assets. Failed provider deletions retain queue entries for retry. This is an explicit maintenance command, not a scheduled job; schedule cleanup before external rollout.

Isolated management, form and photo regressions passed. An opt-in live Atlas regression passed concurrent duplicate prevention, owner/category scope, rename collision, stale/foreign deletion rejection, hard deletion and name reuse. It used new labelled disposable QA owner IDs, no photos/auth accounts, and removed its drafts/locks afterward. The live browser delete confirmation and deletion image-cleanup path still need manual acceptance. Lint, TypeScript and the Webpack production build passed for the implementation.

After a successful details save the app continues to `/listings?saved=1`. Drafts stay private; Edit draft reopens details, photos and availability. Publishing/readiness and real discovery are later increments, not side effects of saving.


## Save-flow refinement — 19 November 2026

The user confirmed approximate pickup area is required for private drafts. UI and server validation reject missing/whitespace-only areas; existing records remain readable and need an area on their next details save. The saved-draft photo editor now appears inside step 3 after the details, before the final save action, rather than beneath the entire form. Photo changes continue saving immediately with shared version/conflict handling. Both successful creation and editing return to `/listings?saved=1`, where My Listings shows a private-save confirmation. Validation failures and conflicts keep the user in the form. First-time creation still explicitly saves the draft before photos can be managed: return to My Listings and choose Edit draft. No silent creation, publishing or price/deposit policy changes were introduced. Earlier optional-area descriptions below describe the preceding draft baseline.

Validation: `node scripts/check-draft-journey.mjs` and the isolated photo regression passed, along with lint, TypeScript and the Webpack production build. The journey test covers missing/blank/trimmed areas on create/update and the model, photo placement before Save, Continue without persistence, non-save submitters, photo-operation blocking/shared version, zero deposit, both success redirects and conflict retention. Browser inspection of the user's existing draft confirmed the required pickup-area label and photo region before Save, retaining its existing image and values. No live save or photo mutation was performed during that inspection; final browser save/navigation acceptance is left for the user's next test. The older live account-creation test script was updated for required areas but was not rerun.

## Photo follow-up — 18 November 2026

Saved drafts now support an owner-only Cloudinary photo editor, separate from the guided text/details save. Cloudinary configuration and live acceptance are pending. See [Private draft photos](LISTING_PHOTOS.md) for setup, API behavior, authenticated image delivery, cleanup limitations and tests. References below to no uploads describe the original draft-only increment.

## Delivered scope

An active signed-in user can save an item privately, find it in My Listings, and edit it later. Identity verification is not required for drafts. There is no publishing endpoint or status transition, and drafts cannot receive rental requests. Existing public pages continue to use sample data and never query private drafts.

Pages: `/listings`, `/listings/new`, `/listings/[id]/edit`. The existing authenticated workspace layout protects these pages. Each service also independently verifies session and active account status; future endpoints must not rely only on page guards.

## Guided entry flow

The category-first interface has three steps: visual category selection, item name/condition/description, then optional rental and pickup details. Native radio controls and labelled inputs support keyboard access; back navigation preserves mounted input values. Existing drafts open at item details if they have a category, or at category selection otherwise. No new record is created until Save private draft is submitted. Existing incomplete records are retained, but the new required fields must be filled before their next save.

Deposit and approximate value remain independent owner-entered amounts, confirmed by the user. No automatic formula is applied.

## Data and implementation decisions

- A Mongoose `Listing` model persists to the development `listings` collection. Ownership references the Better Auth user ID as a string; no duplicate user model is created.
- Item name (maximum 120 characters), category and owner-reported condition are required to save. Selecting has issues also requires a short explanation. Description, prices, estimated value, deposit and approximate area remain optional for private drafts. Publishing requirements from the PRD are not relaxed.
- Category labels are the existing suggested scaffold categories, not final maintained category records. Publishing will need validated category IDs and an approved category policy.
- Prices use integer paise, INR, and nonnegative values. Null means not entered; zero is retained. Zero in a private draft does not approve a zero-deposit publishing policy. A technical storage/input ceiling of 1,000,000,000,000 paise and bounded text lengths prevent unbounded values; these are not marketplace pricing policies.
- Status is server-assigned `draft`, currency `INR`, schemaVersion 1. User input cannot assign owner, timestamps, status, currency or version. The model currently permits only drafts; future publishing must deliberately expand it after its checks exist.
- Approximate area is a label only. No exact address, geocoding, uploads or availability is collected in this increment.
- A version counter enables atomic compare-and-update. Stale edits receive 409 instead of silently replacing another tab's save. The UI retains entered values and offers an explicit discard/reload action after a conflict.
- Saves are explicit, with pending feedback and a disabled submit button. No autosave or automatic publishing. Optional fields can be cleared by saving blanks/null.
- My Listings returns the latest 100 private drafts, ordered by saved time. This limit is stated in the interface; cursor pagination is deferred. Timestamps display in Asia/Kolkata.

## Private API

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/api/v1/me/listings` | Current owner's latest drafts |
| POST | `/api/v1/me/listings` | Save a new draft; title, category and condition required; issue explanation required when applicable |
| GET | `/api/v1/me/listings/:id` | Retrieve only the owner's draft |
| PATCH | `/api/v1/me/listings/:id` | Save a complete draft snapshot with expectedVersion |

PATCH treats omitted optional fields as cleared/defaulted, matching the form's complete-snapshot submission. This is not a partial-field merge. Missing, foreign-owned, malformed and non-draft identifiers return the same 404 response to authorized callers. Signed-out callers receive 401. Restricted accounts receive 403. Database failures return a safe retry message rather than raw provider details.

Mutations require JSON and the configured application Origin, enforce a 16KiB streamed body limit, and reject unknown fields using strict Zod schemas. Responses use private/no-store caching. This increment implements private draft resources under `/me/listings`; the proposed public listing/publishing API is still unimplemented.

The proposed owner/status/update-time index is declared in the model. Existing connection configuration intentionally disables automatic index creation; create/review indexes through an authorized migration before scaling. No index migrations or production connections were performed. Production abuse controls, pagination, image management, availability, and publication validation remain future work.

## Validation — 17 November 2026

Lint, TypeScript and production build passed. `scripts/check-drafts-development.mjs` passed against the configured development server and Atlas: initial title-only creation (before the later required-field revision), read-after-save persistence, edits, integer-paise precision and zero deposit, rejection of empty title/negative prices/ownership and status injection, foreign-origin rejection, signed-out rejection, two-user read/write isolation, malformed identifiers, public item exclusion, My Listings rendering, edit-page response, and concurrent-update conflict handling.

The script is explicitly opt-in (`RENTIGO_ALLOW_TEST_ACCOUNT=true`) and creates two labelled development accounts and one private draft. Those test fixtures were retained; no emails, public listings or rentals were created. UI form submission and mobile visual review remain manual review items; the automated persistence/security checks exercise the real API and authenticated page responses.

## Next

### Category-first revision validation

The 17 November category-first revision passed lint, TypeScript and production build. Direct schema checks passed for missing category/condition, issues without an explanation, required fields on updates, negative amounts, and independently entered deposit/value. The live integration rerun could not complete: account setup returned 503 and independent Atlas pings timed out with MongoServerSelectionError. The earlier live draft tests above describe the prior version; they are not a claim that this revised flow was retested against Atlas. Database-backed and visual wizard review remain pending until connectivity is restored.

The user subsequently reported that Atlas connectivity was restored. The revised guided flow still awaits a confirmed full save/edit and visual review; connectivity recovery alone is not a completed acceptance test.

18 November checkpoint: the supplied manual review confirmed category selection, required-field checks, retained values, refresh persistence and zero deposit. It identified Continue unexpectedly saving during a step transition. Continue and Save now have separate React keys, Continue cancels its default click action, and persistence requires the named Save submitter. Lint, TypeScript and production build passed after the fix. The user reported the result looks good and plans another check; the final browser regression is not claimed complete.

Review the private draft flow, then add Cloudinary photo uploads to these same draft records. Availability and publishing readiness follow separately. Final publishing requires approved item/category policy, all PRD fields, genuine identity verification and transaction eligibility; development draft access does not bypass those requirements.
