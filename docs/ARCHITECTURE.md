# Scaffold architecture

## Confirmed inputs

The PRD requires rental-only local discovery in Vijayawada, owner approval, final agreed booking terms, messaging, bilateral pickup/return confirmations, issue reporting and administration. Real payment integration is deferred, not removed. The user explicitly requests a scaffold only and the listed technology stack.

Missing source files: DESIGN_BRIEF.md and IMPLEMENTATION_PLAN.md. AGENTS.md did not exist and was created for this scaffold. Existing PRD.md and SYSTEM_DESIGN.md were preserved. Their unresolved decisions remain unresolved.

## Implemented foundation

One Next.js App Router application with strict TypeScript and Tailwind v4. Public pages consume mock display DTOs. Server-only environment and provider utilities exist but are never invoked by preview routes. No API handlers, schemas, collections, jobs, uploads or auth library are implemented. Dependencies are pinned with a lockfile.

Boundary flow for future work: UI -> server service -> repository -> Mongoose model -> Atlas. HTTP handlers validate the request, session and origin before services. Server components may call services directly. Services enforce actor permissions and business invariants; repositories perform persistence only. Do not expose model documents directly to clients.

Service interfaces cover users, listings, categories, search, messaging, rental requests, bookings, reports and administration. Auth has a separate session-provider contract. Interfaces are proposed seams, not commitments to final method signatures or implemented behavior. Mutation APIs await approved input schemas and consistency rules.

## Proposed decisions

- Mongoose supersedes SYSTEM_DESIGN's official-driver-only proposal because of the latest explicit user request.
- Local SVG illustrations replace remote product photos in the scaffold; they are labelled illustrative.
- Terracotta/ivory and locally bundled DM Serif Display/Manrope implement the requested visual direction; no missing design brief is claimed to have been followed.
- Lazy server environment validation permits offline UI work with integrations disabled. Provider utilities validate only when used and never print secrets.
- Cache a bounded MongoDB connection promise across warm instances; clear a failed promise to permit retries. Index creation is intentionally disabled until schemas/index migrations are approved.
- Keep exact pickup details and report evidence separate from public listing data. Never use public listing URLs for private evidence.

## Future security and consistency

Before real data, implement secure sessions, operator/participant checks, origin protection, input validation, durable abuse controls and secret-safe logs. Authentication provider and pilot membership details need confirmation. The protected route group is not a security boundary.

Booking acceptance must coordinate availability and reservation writes atomically and retry conflicts. Snapshot final terms independently of listing edits. Require both pickup and return confirmations; preserve an event history. Detailed mutation logic is intentionally absent. Do not add per-process locks or timers for durable state.

Netlify remains eventual hosting; nothing is deployed. Approve development Atlas and Cloudinary resources before enabling them. Payment/provider adapters, webhooks, scheduling, backups and quota monitoring belong to later phases.
