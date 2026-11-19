import "server-only";
import type { ListingRecord } from "@/models/listing";
import type { DraftListing } from "@/types/draft-listing";
import type { Types } from "mongoose";

export function draftDto(record: ListingRecord & { _id: Types.ObjectId }): DraftListing {
  const id = record._id.toString();
  return { id, title: record.title, category: record.category, description: record.description, condition: record.condition, conditionNote: record.conditionNote, dailyRatePaise: record.dailyRatePaise ?? null, approximateValuePaise: record.approximateValuePaise ?? null, depositPaise: record.depositPaise ?? null, areaLabel: record.areaLabel, status: "draft", version: record.version, updatedAt: record.updatedAt.toISOString(), photos: (record.photos ?? []).filter(photo => photo.state === "ready").map(photo => ({ id: photo.id, width: photo.width!, height: photo.height!, url: `/api/v1/me/listings/${id}/photos/${photo.id}` })), pendingPhotoIds: (record.photos ?? []).filter(photo => photo.state === "pending").map(photo => photo.id) };
}
