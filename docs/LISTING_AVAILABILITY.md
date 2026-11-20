# Private draft availability — 19 November 2026

## Delivered increment

Step 3 includes the supplied Stitch export's warm neutral availability panel, calendar icon, two date inputs, clear action and selected-range summary. Date inputs stack on narrow screens. Existing typography, header, three-step flow, photo editor, required pickup area and save-to-My-Listings navigation remain intact.

Reference: user-supplied `stitch_rentigo_editorial_design_refinement (2).zip` containing `code.html`, `screen.png`, and `DESIGN.md`. It contains one desktop screenshot and responsive HTML, not a separate mobile screenshot. The export is a visual reference, not functional authorization. Its publication action, fake ratings/verified badge, escrow guarantee, continuous-lending/default-on-demand behavior, minimum rental term and day-count calculation are intentionally excluded. No new booking or publishing behavior is introduced.

## Behavior and persistence

- `availableFrom` and `availableUntil` are nullable ISO calendar dates (`YYYY-MM-DD`) stored on the existing listing. Calendar dates are not timestamps; no implicit timezone conversion or billing-day calculation occurs.
- A draft may leave both dates unset. This means availability has not been specified, not always available or bookable on demand.
- When supplied, both dates must be real dates and the end cannot precede the start. Same-date windows are accepted as date data; rental duration/pricing semantics remain undecided. No new past-date cutoff is imposed.
- Clear dates resets both values locally; Save private draft persists the clear. Selecting dates alone does not write anything. Back/Continue retains the selection.
- Existing owner/session checks, strict validation and atomic version checks apply to these fields on both create and update. Existing records read as null/null. No migration, production connection or real booking is performed.
- Public discovery still uses mocks. These fields do not reserve an item, prevent double booking, publish it, or grant identity/transaction eligibility. Those checks belong to later approved increments.

## Review and test

The draft-journey regression covers invalid/leap dates, partial/reversed ranges, same-day windows, legacy defaults, client save blocking, request payload and clear-to-null. Existing photo/ownership/conflict regressions are retained. Database persistence and responsive browser acceptance remain manual checks, not claims based on mocks.

Implementation checks passed: the draft-journey and photo regressions, lint, TypeScript, `git diff --check`, and the Webpack production build. No live database writes or browser acceptance test were performed for this increment. Project status records implementation separately from acceptance.

Restart the development server before testing, because Mongoose caches the listing schema in a running process. Open an existing draft, continue to step 3, set both dates, save and reopen. Check retained dates, Clear dates plus save/reopen, a reversed/partial range, mobile date inputs, unchanged photos/pickup/prices, and a competing-tab stale save. Do not mark the milestone accepted until this live review passes.
