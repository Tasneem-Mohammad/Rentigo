import "server-only";
import * as repository from "@/server/repositories/published-listings";
import { getCloudinary } from "@/lib/cloudinary";
import { DraftError } from "./drafts";

function publicListing(record: NonNullable<Awaited<ReturnType<typeof repository.findPublished>>>) {
  const id = record._id.toString();
  // Public allowlist: no account IDs, private valuation, storage IDs or upload slots.
  return { id, title: record.title, category: record.category, description: record.description, condition: record.condition, conditionNote: record.conditionNote, area: record.areaLabel, dailyRatePaise: record.dailyRatePaise!, depositPaise: record.depositPaise!, availableFrom: record.availableFrom, availableUntil: record.availableUntil, photos: record.photos.filter(photo => photo.state === "ready").map(photo => ({ id: photo.id, url: `/api/v1/listings/${id}/photos/${photo.id}`, width: photo.width!, height: photo.height! })) };
}
export async function getPublishedListing(id: string) {
  const record = await repository.findPublished(id);
  return record ? publicListing(record) : null;
}
export async function getPublishedListings() { return (await repository.listPublished()).map(publicListing); }
export async function readPublishedPhoto(id: string, photoId: string) {
  const record = await repository.findPublished(id);
  const photo = record?.photos.find(photo => photo.id === photoId && photo.state === "ready");
  if (!photo?.format) throw new DraftError(404, "NOT_FOUND", "Photo not found.");
  const url = getCloudinary().utils.private_download_url(photo.publicId, photo.format, { resource_type: "image", type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 60, attachment: false });
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new DraftError(503, "PHOTO_UNAVAILABLE", "Photo temporarily unavailable.");
  return new Response(response.body, { headers: { "Content-Type": photo.format === "jpg" ? "image/jpeg" : `image/${photo.format}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" } });
}
