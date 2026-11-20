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
  availableFrom: { type: String, default: null },
  availableUntil: { type: String, default: null },
  photos: { type: [photoSchema], default: [] },
  status: { type: String, enum: ["draft", "active"], default: "draft", required: true },
  prototypePublished: { type: Boolean, default: false },
  currency: { type: String, enum: ["INR"], default: "INR", immutable: true },
  version: { type: Number, default: 0, required: true },
  schemaVersion: { type: Number, default: 1, immutable: true },
}, { timestamps: true, versionKey: false, strict: "throw", autoIndex: false });
schema.index({ ownerId: 1, status: 1, updatedAt: -1 });
export type ListingRecord = InferSchemaType<typeof schema>;
// Next dev reloads modules while Mongoose retains compiled models. Do not reuse
// the old draft-only schema after adding publication fields during development.
const cached = mongoose.models.Listing;
if (process.env.NODE_ENV === "development" && cached && (!cached.schema.path("prototypePublished") || !cached.schema.path("status")?.options.enum?.includes("active"))) {
  mongoose.deleteModel("Listing");
}
export const Listing: Model<ListingRecord> = (mongoose.models.Listing as Model<ListingRecord> | undefined) ?? mongoose.model<ListingRecord>("Listing", schema, "listings");
