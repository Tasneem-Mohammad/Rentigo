import "server-only";
import { z } from "zod";
// For future database-backed routes; mock item slugs are deliberately not ObjectIds.
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid record identifier.");
