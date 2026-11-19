import "server-only";
import { Listing } from "@/models/listing";
import { connectDatabase } from "@/lib/mongodb";
import type { DraftFields } from "@/server/validation/draft-listing";
import { draftDto } from "./draft-dto";
export async function createDraft(ownerId: string, fields: DraftFields) {
  await connectDatabase();
  return draftDto((await Listing.create({ ...fields, ownerId, status: "draft" })).toObject());
}
export async function listDrafts(ownerId: string) {
  await connectDatabase();
  return (await Listing.find({ ownerId, status: "draft" }).sort({ updatedAt: -1, _id: -1 }).limit(100).lean()).map(draftDto);
}
export async function findDraft(ownerId: string, id: string) {
  await connectDatabase();
  const record = await Listing.findOne({ _id: id, ownerId, status: "draft" }).lean();
  return record ? draftDto(record) : null;
}
export async function updateDraft(ownerId: string, id: string, version: number, fields: DraftFields) {
  await connectDatabase();
  const record = await Listing.findOneAndUpdate({ _id: id, ownerId, status: "draft", version }, { $set: fields, $inc: { version: 1 } }, { returnDocument: "after", runValidators: true }).lean();
  return record ? draftDto(record) : null;
}
