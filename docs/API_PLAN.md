# API plan — proposed, no endpoints implemented

Pages render mock data today. Add HTTP handlers only when a client needs them; server components should call services directly. The following resource families describe future scope, not a published API contract.

| Boundary | Future operations | Required access |
| --- | --- | --- |
| Authentication | Chosen library's session flow | Provider and invitation decisions first |
| Listings / categories | Public discovery/details, owner create/edit | Public reads; approved member ownership on writes |
| Search | Keyword, category, date and nearby filters | Public; approximate location only |
| Upload authorization | Short-lived constrained image signatures | Authorized listing owner; validate type/size/count |
| Rental requests | Request, decline, revise terms, accept agreed terms | Relevant member; owner/renter action checks |
| Bookings | Private details, bilateral pickup/return confirmations | Participants; operators where justified |
| Conversations / messages | Participant reads and sends | Session and membership in conversation |
| Reports | Submit issue, private evidence, review state | Participants; reviewer actions require operator role |
| Administration | Listings/users/bookings/reports; restrictions with reason | Operator only; recorded action history |

Handlers must validate with Zod, enforce actor/object permissions, check mutation origin, reject unsupported fields, paginate lists and map known errors to safe messages. Never return database exceptions or provider payloads. Use version checks and idempotency for transitions. Public failures must not disclose private record existence.

No fake auth session, booking write, upload URL or successful payment response is provided. Payment routes and signed/idempotent provider webhooks require a later approved adapter and policies. Do not treat browser redirects as payment confirmation. No unnecessary health endpoint is created.
