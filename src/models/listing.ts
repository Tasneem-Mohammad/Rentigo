import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const photoSchema = new Schema({
  id: { type: String, required: true },
  publicId: { type: String, required: true },
  state: { type: String, enum: ["pending", "ready", "removed"], required: true },
  expiresAt: { type: Date, required: true },
  format: { type: String, enum: ["jpg", "png", "webp"] },
  width: Number, height: Number, bytes: Number,
}, { _id: false, strict: "throw" });
const schema = new Schema({
  ownerId: { type: String, required: true, immutable: true },
  title: { type: String, required: true, maxlength: 120 },
  category: { type: String, required: true, enum: ["Home & kitchen", "Tools", "Outdoor & leisure", "Events", "Other"] },
  description: { type: String, default: "", maxlength: 2000 },
  condition: { type: String, enum: ["working_well", "has_issues"], required: true },
  conditionNote: { type: String, default: "", maxlength: 500 },
  dailyRatePaise: { type: Number, default: null, min: 0 },
  approximateValuePaise: { type: Number, default: null, min: 0 },
  depositPaise: { type: Number, default: null, min: 0 },
  areaLabel: { type: String, required: true, maxlength: 120 },
  photos: { type: [photoSchema], default: [] },
  status: { type: String, enum: ["draft"], default: "draft", required: true },
  currency: { type: String, enum: ["INR"], default: "INR", immutable: true },
  version: { type: Number, default: 0, required: true },
  schemaVersion: { type: Number, default: 1, immutable: true },
}, { timestamps: true, versionKey: false, strict: "throw", autoIndex: false });
schema.index({ ownerId: 1, status: 1, updatedAt: -1 });
export type ListingRecord = InferSchemaType<typeof schema>;
export const Listing: Model<ListingRecord> = (mongoose.models.Listing as Model<ListingRecord> | undefined) ?? mongoose.model<ListingRecord>("Listing", schema, "listings");
