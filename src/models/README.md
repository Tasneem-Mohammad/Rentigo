# Persistence model boundary

Mongoose business schemas belong here. `listing.ts` now defines private draft records; see docs/DRAFT_LISTINGS.md. Model access belongs in server/repositories, never browser components. Reuse registered models during development reloads. Automatic index creation remains disabled. Keep public listing and private pickup details in separate collections and DTOs. Auth collections remain owned by Better Auth's adapter.
