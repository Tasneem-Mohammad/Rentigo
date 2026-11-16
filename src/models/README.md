# Persistence model boundary

Future Mongoose schemas belong here. No schemas are registered and no collections or indexes are created by the scaffold. See docs/DATABASE_DESIGN.md for proposed collections and pending policy decisions. Model access belongs in server/repositories, never browser components. Reuse registered models during development reloads. Keep public listing and private pickup details in separate collections and DTOs.
