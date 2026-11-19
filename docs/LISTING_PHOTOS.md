# Private draft photos

## Scope and current status

The user authorized photo work while separate agents review authentication. Authentication implementation is not changed by this increment. Photo upload code is implemented. Development Cloudinary is configured and its provider integration has been checked; the full owner/browser journey still awaits acceptance. No production resources are connected.

## Development connection check — 19 November 2026

The user's existing Cloudinary Test environment credentials were saved only in ignored `.env.local`, preserving other settings. Cloudinary was enabled and a read-only API ping passed. A generated nonpersonal 2×2 PNG then passed the same signed-upload parameters used by the application, server-side asset lookup, authenticated download and rejection of an unsigned delivery URL. The disposable test asset was successfully destroyed afterward. No real listing, account, owner photo or application source was changed by this provider test. This confirms provider setup, not the complete draft-to-upload browser flow. The local application was started at `http://localhost:3000` using the Webpack development fallback, and the homepage returned HTTP 200.

Owners first explicitly save a private draft, then manage photos on its edit page. Photo changes save immediately and separately from text/rental details; the interface explains this. Selecting a file never creates a new draft or saves unsaved item details. Existing drafts without photo fields remain supported. Public Explore and item pages continue to use mock data. This increment does not implement availability, publishing, identity verification or rentals.

19 November layout refinement: on saved drafts, the photo editor is part of step 3, after pickup details and before Save private draft. Successful details saves return to My Listings with a confirmation instead of leaving the owner on the edit page. New drafts also return to My Listings after creation; choose Edit draft there to add photos. Uploads retain their own immediate-save behavior and cannot submit the details form.

The PRD requires at least one current photo to publish and compression for uploads. Five photos follows the existing proposed technical limit in DB_DESIGN/SYSTEM_DESIGN, not a newly approved publishing policy. Technical limits here: JPEG/PNG/WebP source files up to 10 MiB, browser compression to JPEG within 1600 px and 5 MiB, at most five ready/pending slots and twenty retained upload reservations per draft. Removed reservations still count toward the latter until safe cleanup. Large camera images over 40 megapixels are rejected by browser preparation. These are development defaults to review with real-device testing.

## Cloudinary setup (development only)

1. Create a Cloudinary account. Use a separate development product environment where available; do not reuse production assets or credentials.
2. Open that environment's **Settings → API Keys**. Find the cloud name, API key and API secret.
3. Fill the existing entries in `.env.local` (never paste credentials into chat or commit the file):

   ```dotenv
   ENABLE_CLOUDINARY=true
   CLOUDINARY_CLOUD_NAME=your_development_cloud_name
   CLOUDINARY_API_KEY=your_development_api_key
   CLOUDINARY_API_SECRET=your_development_api_secret
   ```

4. Restart `npm run dev`. A restart is also necessary after the listing schema change, since Mongoose caches models within the running process.
5. Sign in using an eligible development account, create/save a private draft, and open its edit page. Add one small test image first.

No unsigned upload preset is needed: the server signs each upload with a fixed generated asset ID, authenticated delivery type, supported formats, an incoming limiting/quality transformation and overwrite disabled. The cloud name and API key accompany the signed upload; the API secret stays on the server. Never enable an unrestricted unsigned preset to make this work. Cloudinary documentation: [signed uploads](https://cloudinary.com/documentation/upload_images), [upload parameters and private delivery](https://cloudinary.com/documentation/image_upload_api_reference).

## Boundaries and consistency

- `POST /api/v1/me/listings/:id/photos` reserves a bounded pending slot with an expected listing version, then returns signed upload fields. A browser upload goes directly to Cloudinary. Failed/interrupted uploads remain visible as unfinished reservations with retry-confirmation/removal controls.
- `PATCH` at the same route accepts `{photoId, action: complete|cover|remove, expectedVersion}`. Completion retrieves the generated asset through the server SDK and verifies its exact public ID, image/authenticated types, format, dimensions and byte count. Arbitrary URLs, client asset metadata and foreign asset IDs are rejected. The first ready photo is the cover. Removing the cover naturally promotes the next ready photo.
- `GET /api/v1/me/listings/:id/photos/:photoId` checks the current active owner and ready-photo membership, then streams a time-limited authenticated Cloudinary download with private/no-store headers. The DTO contains only this application URL, not a public Cloudinary asset URL. Next's shared image optimization is bypassed intentionally.
- Photo records remain embedded on the owner's draft. Reservations and changes use atomic owner/status/version filters; the five-slot limit is enforced in the reservation query. Text edits preserve photos. The UI shares the resulting version across both editors and disables overlapping writes. A foreign-tab conflict requires reloading rather than overwriting.
- Photo mutations return the DTO from their atomic update, not a subsequent draft reread. A later edit in another tab therefore cannot be adopted as the local form's expected version while its text fields remain stale.
- Mutation routes reuse strict JSON/body-size and configured-origin checks. Each service independently checks session, account status and ownership. Provider/database details are not returned to the client.

## Cleanup and operational limits

Cloudinary upload signatures remain usable for roughly one hour. Removed/unfinished records are retained for 65 minutes so delayed uploads cannot recreate an asset after early deletion. On a subsequent upload authorization for the same draft, cleanup first atomically claims an expired non-ready photo as removed and increments the listing version. Only a successful claim allows provider deletion, fencing off any in-flight confirmation. Its reference is removed only after successful deletion or an explicit not-found response, using another version-checked update. Failed deletions retain the removed reference for retry. Concurrent edits cause a conflict instead of deleting a photo that won confirmation. Cleanup versions participate in the same optimistic concurrency checks as other changes. Ready photos are never swept. This cleanup cannot publish a draft or grant rental capabilities.

This is opportunistic cleanup, not a scheduled worker: abandoned drafts need an operator sweep/scheduler before external rollout. There is no automatic orphan-deletion service or account-wide rate limiter in this increment. Cloudinary may accept a file before server-side finalization rejects it; browser size checks are not a provider quota guarantee. Rejected/unfinished assets remain private and tracked for cleanup. Add account-wide upload abuse controls and provider reconciliation before inviting untrusted users. Test cross-resource upload attempts as part of that rollout review; signatures do not cryptographically bind the Upload API's resource-type path.

## Validation and acceptance

Implementation checks on 18 November: lint, TypeScript and the isolated photo regression passed, as did the Webpack production build. Render checks covered configured/disabled editor states and legacy drafts without photos. The attempted separate production HTTP smoke check of the photo routes was not executed because automatic approval review was unavailable due to a usage limit. Cloudinary credentials remain unset and disabled; no live upload, mobile browser acceptance or live Atlas concurrency result is claimed.

`node scripts/check-listing-photos.mjs` runs isolated tests of the real services, validation and routes with mocked persistence/Cloudinary, plus inspections of real repository query boundaries. It covers signed-out/other-owner rejection, invalid/oversized input, provider-disabled behavior, fixed signed IDs, server asset checks, stale versions, cover/removal, slot limits, expired reservations, deferred cleanup and failure retention, private delivery, foreign origins and JSON body limits. It is not a live MongoDB concurrency test or a browser upload test.

The concurrency regressions also interleave a text edit immediately after a photo commit and exercise both winners of an expiry/confirmation race. They check the committed response version, claim-before-delete ordering, rejection of the losing operation, and owner/status/version/expiry predicates on the real repository queries. Provider and database operations remain mocked in these tests.

Before marking complete, configure development Cloudinary and manually verify: new/existing draft upload; previews after refresh/sign-out/sign-in; cover selection; cover/last-photo removal; interrupted upload recovery; unsupported/oversized files; five-photo limit; two-tab conflicts; text edits after photo changes; signed-out and second-account denial of the image route; photo exclusion from public discovery; mobile image orientation/compression and readable controls. Inspect the actual Cloudinary asset type and confirm its unsigned delivery URL fails. Confirm cleanup after expiry with both a missing asset and a failed provider deletion. Run lint, TypeScript and production build alongside these checks.
