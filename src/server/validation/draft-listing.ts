import { z } from "zod";
export const draftCategories = ["Home & kitchen", "Tools", "Outdoor & leisure", "Events", "Other"] as const;
const money = z.number().int().min(0).max(1_000_000_000_000).nullable().default(null);
export const draftFields = z.object({
  title: z.string().trim().min(1, "Give your draft an item name.").max(120),
  category: z.enum(draftCategories),
  description: z.string().trim().max(2000).default(""),
  condition: z.enum(["working_well", "has_issues"]),
  conditionNote: z.string().trim().max(500).default(""),
  dailyRatePaise: money,
  approximateValuePaise: money,
  depositPaise: money,
  areaLabel: z.string().trim().max(120).default(""),
}).strict().refine(fields => fields.condition !== "has_issues" || fields.conditionNote.length > 0, { path: ["conditionNote"], message: "Describe the item’s issues." });
export const draftUpdate = draftFields.safeExtend({ expectedVersion: z.number().int().min(0) }).strict();
export type DraftFields = z.infer<typeof draftFields>;
