import "server-only";
import { Listing, type ListingRecord } from "@/models/listing";
import { connectDatabase } from "@/lib/mongodb";
import type { DraftFields } from "@/server/validation/draft-listing";
import type { DraftListing } from "@/types/draft-listing";
import type { Types } from "mongoose";
function dto(record: ListingRecord & { _id: Types.ObjectId }): DraftListing {
  return { id: record._id.toString(), title: record.title, category: record.category, description: record.description, condition: record.condition, conditionNote: record.conditionNote, dailyRatePaise: record.dailyRatePaise ?? null, approximateValuePaise: record.approximateValuePaise ?? null, depositPaise: record.depositPaise ?? null, areaLabel: record.areaLabel, status: "draft", version: record.version, updatedAt: record.updatedAt.toISOString() };
}
export async function createDraft(ownerId: string, fields: DraftFields) {
  await connectDatabase();
  return dto((await Listing.create({ ...fields, ownerId, status: "draft" })).toObject());
}
export async function listDrafts(ownerId: string) {
  await connectDatabase();
  return (await Listing.find({ ownerId, status: "draft" }).sort({ updatedAt: -1, _id: -1 }).limit(100).lean()).map(dto);
}
export async function findDraft(ownerId: string, id: string) {
  await connectDatabase();
  const record = await Listing.findOne({ _id: id, ownerId, status: "draft" }).lean();
  return record ? dto(record) : null;
}
export async function updateDraft(ownerId: string, id: string, version: number, fields: DraftFields) {
  await connectDatabase();
  const record = await Listing.findOneAndUpdate({ _id: id, ownerId, status: "draft", version }, { $set: fields, $inc: { version: 1 } }, { returnDocument: "after", runValidators: true }).lean();
  return record ? dto(record) : null;
}
