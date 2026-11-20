import "server-only";
import { Listing, type ListingRecord } from "@/models/listing";
import { connectDatabase } from "@/lib/mongodb";
import { MAX_LISTING_PHOTOS, MAX_PHOTO_RESERVATIONS } from "@/constants/listing-photos";
import { draftDto } from "./draft-dto";
export type PhotoRecord = Pick<ListingRecord["photos"][number], "id" | "publicId" | "state" | "expiresAt" | "format" | "width" | "height" | "bytes">;
export async function photoDraft(ownerId: string, id: string) {
  await connectDatabase();
  return Listing.findOne({ _id: id, ownerId, status: "draft" }).lean();
}
export async function reservePhoto(ownerId: string, id: string, version: number, photo: PhotoRecord) {
  await connectDatabase();
  return Listing.findOneAndUpdate({ _id: id, ownerId, status: "draft", version,
    $expr: { $and: [
      { $lt: [{ $size: { $ifNull: ["$photos", []] } }, MAX_PHOTO_RESERVATIONS] },
      { $lt: [{ $size: { $filter: { input: { $ifNull: ["$photos", []] }, as: "p", cond: { $ne: ["$$p.state", "removed"] } } } }, MAX_LISTING_PHOTOS] },
    ] },
  }, { $push: { photos: photo }, $inc: { version: 1 } }, { returnDocument: "after", runValidators: true }).lean();
}
export async function replacePhotos(ownerId: string, id: string, version: number, photos: PhotoRecord[]) {
  await connectDatabase();
  const record = await Listing.findOneAndUpdate({ _id: id, ownerId, status: "draft", version }, { $set: { photos }, $inc: { version: 1 } }, { returnDocument: "after", runValidators: true }).lean();
  return record ? draftDto(record) : null;
}
export async function claimExpiredPhoto(ownerId: string, id: string, version: number, photoId: string, now: Date) {
  await connectDatabase();
  // Fence off confirmations before any irreversible provider deletion.
  return Listing.findOneAndUpdate({ _id: id, ownerId, status: "draft", version,
    photos: { $elemMatch: { id: photoId, state: { $in: ["pending", "removed"] }, expiresAt: { $lte: now } } },
  }, { $set: { "photos.$.state": "removed" }, $inc: { version: 1 } }, { returnDocument: "after", runValidators: true }).lean();
}
export async function forgetExpiredPhoto(ownerId: string, id: string, version: number, photoId: string, now: Date) {
  await connectDatabase();
  return Listing.findOneAndUpdate({ _id: id, ownerId, status: "draft", version,
    photos: { $elemMatch: { id: photoId, state: "removed", expiresAt: { $lte: now } } },
  }, { $pull: { photos: { id: photoId, state: "removed", expiresAt: { $lte: now } } }, $inc: { version: 1 } }, { returnDocument: "after", runValidators: true }).lean();
}
