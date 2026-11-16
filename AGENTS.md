# Rentigo development instructions

- Read all docs before changing scope. `docs/PRD.md` is the functional source of truth. Preserve existing approved documentation.
- Current deliverable is scaffold only. No donations, buying, real payments, production connections, or deployment without authorization.
- User-requested stack: Next.js App Router, strict TypeScript, Tailwind, Mongoose/Atlas, Cloudinary, Zod; eventual Netlify hosting.
- Keep components reusable. Pages orchestrate UI; server services own use cases; repositories own database access; models define persistence.
- Keep credentials server-only. Validate environment lazily and redact secrets. Never connect providers during build or module import.
- Preview data and unimplemented actions must be visibly labelled. A route group never provides authorization.
- Require session, role, object ownership/participant checks and server input validation before implementing real operations.
- Money is integer paise; currency INR; storage timestamps UTC; display Asia/Kolkata. Do not decide unresolved pricing, deposit or cancellation rules.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` after changes; verify relevant navigation.
- Do not add empty files to populate folders. Add tests for real rules and security boundaries as they are implemented.
