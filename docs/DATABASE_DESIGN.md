# Database design — proposed, not instantiated

No Mongoose schemas, collections, seed writes or indexes are created by this scaffold. The following maps the existing SYSTEM_DESIGN to future Mongoose work; it does not settle pending product policies.

| Collection | Purpose / planned constraints |
| --- | --- |
| users | Display name, auth subject, roles, community approval and distinct verification states; unique provider identity |
| invitations | Hashed token, expiry, approving actor and use tracking; exact invitation policy pending |
| categories | Maintained rental taxonomy; initial allowed categories require approval |
| listings | Owner, title, category, photo asset references, condition, integer-paise prices, approximate area/GeoJSON, status |
| listingPrivateDetails | Exact pickup details; participant/operator access only |
| listingCalendars | Owner date blocks and per-item reservation coordination |
| bookings | Parties, dates, immutable terms, underlying stage, additional issue/overdue flags, version and confirmations |
| bookingEvents | Append-only actor, timestamp, transition and reason |
| conversations | Participants and listing/booking association |
| messages | Conversation, sender, body, timestamp |
| reports | Booking, reporter, reason, restricted evidence and review history |
| paymentRecords | Future simulated/provider operations with unique operation keys; no money operations now |

Money uses integer paise and INR; timestamps use UTC and display in Asia/Kolkata. Public listing DTOs exclude exact addresses, provider identities, private evidence and private messages. Do not persist raw card data or identity document copies.

Proposed indexes: listing approximate point `2dsphere`, listing visibility/category, messages conversation/createdAt, bookings participant/stage and listing/date interval, unique operation keys. Review actual query shapes before creating indexes. Availability cannot rely only on an ordinary unique index over start/end timestamps.

Reservation acceptance needs a transaction coordinating the item's calendar, overlap checks, booking write and immutable terms. Confirm the chosen Atlas tier's behavior and test simultaneous acceptance. Half-open intervals are proposed in SYSTEM_DESIGN; turnaround, day rounding, hold expiry and payment recovery policies remain unapproved.

Connection utility is lazy, bounded and disabled by default. Use an approved development database first, with least-privilege credentials and reviewed network access. Production data, index migrations and actual repository implementations are outside this scaffold.
