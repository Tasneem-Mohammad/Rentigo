# Local Rental Platform Product Requirements Document

Version 0.1 | 14 November 2026 | For founder review

## 1 Product overview

Build a mobile-friendly web platform that helps people in Vijayawada rent useful items from people nearby. Owners earn extra income from belongings they are not using. Renters get temporary access without buying the item.

The initial audience is the founder's neighbourhood, with the intention to expand to the general public in Vijayawada. Owners can list different kinds of items, organised into categories. Buying and donation are outside this version.

The experience must stay simple: short listings, nearby discovery, direct conversation, owner approval, and clear pickup and return steps. The platform will charge no platform fee initially. Renters still pay rental charges and a refundable deposit.

**Review objective:** agree on the product scope and user journey before design and implementation. The working product name, visual identity, and launch date remain undecided.

## 2 Confirmed product decisions

- Rental only; no purchasing or donations.
- Launch location: Vijayawada, India.
- Start with local neighbourhood users and grow toward a wider local audience.
- Support multiple item categories rather than restricting the entire platform to two or three items.
- Keep required listing details minimal. Users can discuss additional details before collecting.
- Owners manually accept or decline every rental request.
- Owners set an approximate item value, daily rental price, and refundable deposit. Amounts can vary by item.
- Save any negotiated amounts as final booking terms before acceptance and payment.
- The platform should coordinate rental charges, deposits, owner payouts, and refunds through an appropriate payment provider.
- Defer detailed payment implementation until after the first prototype.
- No platform fee initially.

## 3 Product principles

**Easy to list.** Ask only for information needed to discover the item, understand its basic condition, and request a rental.

**Nearby and available.** Prioritise relevant items close to the renter that are available on their selected dates.

**Clear agreement.** Both people must see the same item, dates, price, deposit, and return deadline before confirming a booking.

**Balanced protection.** Neither party should control the deposit outcome alone. Verification and deposits reduce risk but do not guarantee honest behaviour or return.

**Automate routine steps.** Use reminders and confirmations for normal rentals. Contested cases need an exception process; the product must not claim to be dispute-free.

## 4 Users and responsibilities

One account can act as both owner and renter.

| Role | Main responsibilities |
| --- | --- |
| Owner | List an item accurately, set terms, accept requests, hand over the item, receive its return, and report issues with evidence. |
| Renter | Find an item, agree to terms, arrange pickup, use it as agreed, and return it on time. |
| Platform operator | Maintain listings and accounts, handle reports, oversee booking exceptions, and coordinate the later payment service. |

**Unresolved operational requirement:** the founder does not want to personally arbitrate disputes. A person or external service must still be assigned to review contested cases before real-money launch. Automated rules alone cannot reliably establish damage, non-return, or a refused return.

## 5 Delivery phases

### Phase A Working prototype

Build and test discovery, listings, messaging, rental requests, owner approval, booking records, pickup and return confirmation, and issue reporting. Show rental prices and deposits, but simulate payment, payout, and refund states. Every simulated money action must be clearly labelled. Do not collect real funds.

This phase validates usability and the complete journey. It is not a public service ready to manage paid rentals.

### Phase B Pilot with real payments

Connect a suitable payment provider, implement collection and settlement, finalise refund and cancellation rules, assign exception handling, and test payment failures and disputed returns. Begin with a controlled neighbourhood pilot.

Payment capability is a retained requirement, not an optional feature dropped from the product. Provider selection and detailed money handling are intentionally deferred.

### Later improvements

Consider broader geographic coverage, advanced trust checks, travel-time estimates, favourites, extensions, richer reviews, and additional languages after the pilot provides evidence of demand.

## 6 Minimum listing information

| Field | Requirement |
| --- | --- |
| Item name | Required short title. |
| Category | Required selection from a maintained list. |
| Current photos | At least one required; encourage several views. |
| Basic condition | Required simple choice such as working well or has issues. Require a short explanation when issues are selected. |
| Daily rental price | Required amount in INR. |
| Approximate current value | Required owner estimate, not an independently verified valuation. |
| Refundable deposit | Required owner-set amount, including an explicit zero if later permitted by policy. |
| Pickup area | Required approximate location for nearby discovery. |
| Availability | Simple available dates or unavailable-date controls. |
| Short description | Optional details such as model, age, dimensions, or included accessories. |

Do not require lengthy product histories, purchase receipts, videos, or exhaustive specifications for ordinary listings. Display condition as owner-reported. Users can discuss details through messaging and arrange a video call separately; built-in video calling is outside the MVP.

Suggested browsing categories, subject to review: home and kitchen, tools, outdoor and leisure, events, and other. Category support does not mean every item is permitted. The pilot needs a simple allowed and prohibited item policy. Mobility aids such as walkers need a separate decision on safety, maintenance, and eligibility before inclusion.

## 7 Core functional requirements

### Accounts

Allow browsing without signing in. Require an account before listing, messaging, or requesting a rental. Proposed pilot baseline: invite-only neighbourhood membership with manual approval and a display name. The sign-in provider remains undecided. Phone verification is not a confirmed requirement and does not establish reliability. Keep contact verification, identity checks, community approval, and completed-rental history separate. Evaluate identity verification before opening to the general public.

### Search and discovery

Accept device location with permission or a manually entered area. Support keyword search, category browsing, date selection, and a distance filter. When dates are selected, show only items available for that period. Sort relevant results by nearest approximate distance by default.

Each result shows a photo, item name, daily price, approximate area, and approximate distance when available. Show a clear empty state with options to widen distance or change dates. Do not expose exact home addresses on public listings.

### Item details and conversation

Show photos, condition, short description, owner profile, availability, daily price, deposit, and approximate area. Provide a message action and a rental request action. Keep conversations linked to the item or booking. Do not require a video call.

### Requests and owner approval

The renter selects pickup and return dates and sees the proposed total before requesting. The owner can accept, decline, or propose revised terms. Any revision requires the renter's agreement; price or date changes must not silently alter an accepted booking.

Store the final agreed terms with the booking. Later listing edits must not change them. Acceptance reserves the selected period; overlapping accepted bookings are blocked. In the real-payment phase, reservation expiry when payment is incomplete must follow a defined timeout.

### Pickup

Reveal the exact pickup location to the accepted renter. Let the renter inspect the item before confirming pickup. Record confirmation from both parties and timestamps. Offer optional handover photos and a short condition note.

If the item materially differs from its description or does not work, allow the renter to stop before pickup confirmation and report the reason. Refund handling follows the later approved policy; do not promise an automatic outcome while that policy remains undecided.

### Return

Display the agreed return deadline and send reminders. Both parties can confirm the return and record condition. If only one person confirms, keep the booking pending rather than automatically completing it. Allow the other party to respond or report an issue.

An owner must not be able to delay a deposit indefinitely by ignoring a return confirmation. The response window and escalation rule must be defined before real payments are enabled.

### Reports and administration

Provide an issue action for non-return, damage, item mismatch, refused return, and inappropriate behaviour. Accept a short explanation and optional evidence. Keep reports private from public listing visitors.

Provide an operator view of listings, users, bookings, and reports. Permit hiding listings and restricting accounts, with a recorded reason. A disputed booking stays visible to the affected users, with a clear pending status and next step.

## 8 Booking journey and statuses

Normal journey: browse â†’ message if needed â†’ request â†’ owner accepts â†’ payment â†’ pickup â†’ return â†’ settlement â†’ completed.

| Status | Meaning |
| --- | --- |
| Requested | Waiting for owner response. |
| Awaiting renter agreement | Owner has proposed changed terms. |
| Payment pending | Terms accepted; payment not confirmed. Simulated in Phase A. |
| Booked | Required payment confirmed and rental period reserved. |
| In use | Both parties confirmed pickup. |
| Return pending | Return confirmation or inspection is incomplete. |
| Settlement pending | Return resolved; payout or refund is processing. Simulated in Phase A. |
| Completed | Return and required settlement are finished. |
| Declined or cancelled | Booking did not proceed, with reason and any financial outcome recorded. |

Overdue and issue reported should be visible flags on the booking rather than replacements that erase its underlying stage. Payment failures must never appear as successful bookings. Repeated taps must not create duplicate confirmations or payment requests.

## 9 Payments and deposits overview

The intended model is platform-coordinated payments through a payment provider. The deposit is not an unrestricted payment to the owner. Do not assume the platform can hold money in its own account or freeze a user's bank balance. The supported collection and deposit mechanism will depend on the later provider arrangement.

Illustrative amounts, not fixed platform pricing:

| Component | One day | Two days |
| --- | ---: | ---: |
| Approximate item value | â‚¹2,000 | â‚¹2,000 |
| Rental charge at â‚¹200 per day | â‚¹200 | â‚¹400 |
| Refundable deposit | â‚¹1,800 | â‚¹1,800 |
| Total upfront | â‚¹2,000 | â‚¹2,200 |
| Deposit returned with no deductions | â‚¹1,800 | â‚¹1,800 |

The deposit is separate from rental earnings. Do not calculate it automatically as item value minus rent unless that rule is explicitly chosen later. An owner-set deposit may leave some item value uncovered.

At booking, show rental duration, rental subtotal, deposit, zero platform fee, and total upfront separately. Any future payment-processing charges must be disclosed before payment. Day-counting and partial-day rules must be agreed before implementation.

Retain these future capabilities: collection, owner payout, deposit refund, cancellation refund, payment failure recovery, and evidence-based handling of proposed deductions. No unilateral deposit forfeiture or automatic damage charge based solely on one person's claim.

## 10 Minimum screens

1. Home and search results with categories and location.
2. Item details with a rental cost summary.
3. Sign in and profile.
4. Create and edit listing.
5. Item conversation.
6. Request and agreed terms review.
7. Owner request inbox and listing management.
8. My rentals and booking details with pickup and return actions.
9. Report an issue.
10. Basic operator dashboard.

Payment, refund, and payout states appear within the booking journey. A separate wallet is not required for the prototype.

## 11 Usability and privacy requirements

Design for mobile browsers first. Use readable text, clear buttons, short forms, and labelled fields. Do not communicate booking status by colour alone. Compress uploaded images and show loading, error, and empty states.

Request location permission only when useful, with manual entry as an alternative. Restrict exact addresses, messages, and report evidence to the relevant people and authorised operators. Do not publish identity documents or payment details. Use a payment provider for sensitive payment collection in Phase B.

Brand name, colours, and language support are open design decisions. English and Telugu support should be considered for the intended audience, without treating both as confirmed launch scope.

## 12 Prototype acceptance criteria

- An owner can publish an ordinary listing without completing a long specification form.
- A renter can search using manual location without granting GPS permission.
- Category, dates, and distance affect results; unavailable items cannot be booked for those dates.
- Public pages do not expose the owner's exact pickup address.
- An owner can manually accept or decline each request.
- Both parties see and accept the same final terms; listing edits do not alter existing bookings.
- Accepted bookings cannot overlap for the same item and dates.
- The cost summary separates rent and deposit and calculates the displayed total correctly.
- Pickup and return confirmations are recorded for both parties; one-sided confirmation does not silently close a booking.
- A renter can report an item mismatch before confirming pickup.
- Either party can report a problem and see that it is pending review.
- Prototype payments, refunds, and payouts are visibly simulated and never collect money.

## 13 Pilot learning and success measures

Measure published listings, search-to-request conversion, owner acceptance, completed rentals, cancellations, overdue returns, reports per completed rental, and repeat rentals. Also ask users whether pickup distance and listing information were sufficient.

No numerical targets are committed yet. Before the pilot, set a participant limit, test period, and thresholds for expanding or pausing. Discovery and completed rentals matter more than registrations alone.

## 14 Decisions needed for the next step

**Before interface design**

- Choose a working name or permit a placeholder.
- Confirm initial categories and whether mobility aids are excluded from the pilot.
- Confirm the short listing form and mobile-first screen list.
- Choose initial language support and visual direction.

**Before real-money launch**

- Assign report and dispute review to a person or service.
- Select the payment provider and supported deposit mechanism.
- Agree payout timing, inspection windows, and refund timelines.
- Define rental day calculation, cancellations, no-shows, overdue returns, damage assessment, and failed payments.
- Decide verification requirements, permitted items, and pilot boundaries.
- Finalise user terms, privacy handling, and any protection claims to match the actual service.

## 15 Technical baseline

Use a single Next.js and Node.js application with TypeScript, managed MongoDB Atlas, and Cloudinary image storage. Deploy the prototype to Netlify Free rather than Render. This avoids the specific Render wake-up model, but does not guarantee zero cold starts. Stay within free quotas; real payment and identity-provider charges remain outside that guarantee. See SYSTEM_DESIGN.md for the architecture, constraints, and pending decisions.

## 16 Review outcome

Approval of this document would authorise moving to screen flows and a working prototype with simulated money movement. It would not mean that the unresolved payment and exception policies have been approved or that public launch is ready.

Reviewer notes:

- Scope changes:
- Missing features:
- Features to remove:
- Decisions confirmed:
- Questions for the next discussion:

## 17 Listing draft entry flow — confirmed 17 November 2026

Listing creation begins with a visual category selection, followed by item details and then rental details. Use the existing category options with small representative illustrations; selecting a category is required before continuing. Item name, category and owner-reported condition are required even to save a private draft. If the condition is “has issues”, require a short explanation. Existing incomplete drafts must be completed to this baseline when next saved; do not delete them or publish them automatically.

Drafts can still omit prices, approximate value and deposit until a later edit. On 19 November 2026, the user confirmed that an approximate pickup area is required even to save a private draft. Collect a neighbourhood/area label, not the exact home address. Existing drafts remain readable and must supply the pickup area on their next details save. Publishing continues to require all fields specified in section 6, including photos and availability. The refundable deposit and estimated current value remain separate owner-entered amounts, as confirmed by the user; no automatic deposit formula is introduced. A saved draft is private and cannot receive rental requests.
