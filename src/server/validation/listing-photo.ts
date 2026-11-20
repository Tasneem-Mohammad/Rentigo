import { z } from "zod";
import { MAX_PHOTO_BYTES } from "@/constants/listing-photos";
const version = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const photoUploadRequest = z.object({ expectedVersion: version, contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), sizeBytes: z.number().int().min(1).max(MAX_PHOTO_BYTES) }).strict();
export const photoMutation = z.object({ expectedVersion: version, photoId: z.uuid(), action: z.enum(["complete", "remove", "cover"]) }).strict();
