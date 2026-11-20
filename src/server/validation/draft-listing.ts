import { z } from "zod";
import { availabilityError } from "@/lib/listing-availability";
export const draftCategories = ["Home & kitchen", "Tools", "Outdoor & leisure", "Events", "Other"] as const;
const money = z.number().int().min(0).max(1_000_000_000_000).nullable().default(null);
const baseFields = z.object({
  title: z.string().trim().min(1, "Give your draft an item name.").max(120),
  category: z.enum(draftCategories),
  description: z.string().trim().max(2000).default(""),
  condition: z.enum(["working_well", "has_issues"]),
  conditionNote: z.string().trim().max(500).default(""),
  dailyRatePaise: money,
  approximateValuePaise: money,
  depositPaise: money,
  areaLabel: z.string().trim().min(1, "Enter an approximate pickup area.").max(120),
  availableFrom: z.iso.date().nullable().default(null),
  availableUntil: z.iso.date().nullable().default(null),
}).strict().refine(fields => fields.condition !== "has_issues" || fields.conditionNote.length > 0, { path: ["conditionNote"], message: "Describe the item’s issues." });
export const draftFields = baseFields.refine(fields => !availabilityError(fields.availableFrom, fields.availableUntil), { path: ["availableUntil"], message: "Choose a valid availability date range or clear both dates." });
export const draftUpdate = draftFields.safeExtend({ expectedVersion: z.number().int().min(0) }).strict();
export type DraftFields = z.infer<typeof draftFields>;
