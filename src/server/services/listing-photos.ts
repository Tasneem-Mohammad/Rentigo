import "server-only";
import { randomUUID } from "node:crypto";
import { getCloudinary } from "@/lib/cloudinary";
import { MAX_LISTING_PHOTOS, MAX_PHOTO_BYTES, PHOTO_FORMATS, PHOTO_RESERVATION_MS } from "@/constants/listing-photos";
import { photoMutation, photoUploadRequest } from "@/server/validation/listing-photo";
import * as repository from "@/server/repositories/listing-photos";
import { DraftError, draftOwner } from "./drafts";

function provider() {
  try { return getCloudinary(); }
  catch { throw new DraftError(503, "PHOTOS_UNAVAILABLE", "Photo uploads are not configured yet. Your draft can still be saved."); }
}
async function owned(id: string) {
  const owner = await draftOwner();
  if (!/^[a-f\d]{24}$/i.test(id)) throw new DraftError(404, "NOT_FOUND", "Draft not found.");
  const draft = await repository.photoDraft(owner, id);
  if (!draft) throw new DraftError(404, "NOT_FOUND", "Draft not found.");
  return { owner, draft };
}
function conflict() { return new DraftError(409, "VERSION_CONFLICT", "This draft changed. Reload its latest version before changing photos."); }

export async function authorizePhoto(id: string, input: unknown) {
  const parsed = photoUploadRequest.safeParse(input);
  if (!parsed.success) throw new DraftError(400, "INVALID_PHOTO", "Choose a JPEG, PNG or WebP image up to 5 MB.");
  const { owner, draft } = await owned(id);
  if (draft.version !== parsed.data.expectedVersion) throw conflict();
  const cloud = provider();
  const now = new Date();
  let version = draft.version;
  // Retain tombstones until signatures can no longer recreate an already deleted asset.
  for (const photo of draft.photos ?? []) {
    if (photo.state !== "ready" && photo.expiresAt <= now) {
      const claimed = await repository.claimExpiredPhoto(owner, id, version, photo.id, now);
      if (!claimed) throw conflict();
      version = claimed.version;
      try {
        const result = await cloud.uploader.destroy(photo.publicId, { resource_type: "image", type: "authenticated", invalidate: true });
        if (result.result === "ok" || result.result === "not found") {
          const forgotten = await repository.forgetExpiredPhoto(owner, id, version, photo.id, now);
          if (!forgotten) throw conflict();
          version = forgotten.version;
        }
      } catch (error) {
        if (error instanceof DraftError) throw error;
        // Keep the removed reference for cleanup retry after a provider failure.
      }
    }
  }
  const photoId = randomUUID();
  const publicId = `rentigo/drafts/${id}/${photoId}`;
  const photo: repository.PhotoRecord = { id: photoId, publicId, state: "pending", expiresAt: new Date(Date.now() + PHOTO_RESERVATION_MS) };
  const updated = await repository.reservePhoto(owner, id, version, photo);
  if (!updated) {
    const latest = await repository.photoDraft(owner, id);
    if (latest?.version !== version) throw conflict();
    throw new DraftError(409, "PHOTO_LIMIT", `Keep up to ${MAX_LISTING_PHOTOS} photos. Cancel interrupted uploads or wait for upload reservations to expire before retrying.`);
  }
  const params = { timestamp: Math.floor(Date.now() / 1000), public_id: publicId, type: "authenticated", overwrite: false, allowed_formats: PHOTO_FORMATS.join(","), transformation: "c_limit,h_1600,w_1600/q_auto:good" };
  const config = cloud.config();
  return { version: updated.version, photoId, upload: { url: `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`, fields: { ...params, overwrite: "false", api_key: config.api_key!, signature: cloud.utils.api_sign_request(params, config.api_secret!) } } };
}

export async function changePhoto(id: string, input: unknown) {
  const parsed = photoMutation.safeParse(input);
  if (!parsed.success) throw new DraftError(400, "INVALID_INPUT", "Invalid photo action.");
  const { owner, draft } = await owned(id);
  const { expectedVersion, photoId, action } = parsed.data;
  if (draft.version !== expectedVersion) throw conflict();
  const photos: repository.PhotoRecord[] = [...(draft.photos ?? [])];
  const index = photos.findIndex(photo => photo.id === photoId && photo.state !== "removed");
  if (index < 0) throw new DraftError(404, "NOT_FOUND", "Photo not found.");
  const photo = photos[index];
  if (action === "complete") {
    if (photo.state !== "pending" || photo.expiresAt.getTime() <= Date.now()) throw new DraftError(400, "UPLOAD_EXPIRED", "This upload reservation expired. Remove it and try again.");
    let asset;
    try { asset = await provider().api.resource(photo.publicId, { resource_type: "image", type: "authenticated" }); }
    catch (error) { if (error instanceof DraftError) throw error; throw new DraftError(503, "UPLOAD_NOT_READY", "We couldn’t confirm the upload. Retry confirmation or remove it."); }
    if (asset.public_id !== photo.publicId || asset.resource_type !== "image" || asset.type !== "authenticated" || !PHOTO_FORMATS.includes(asset.format) || !Number.isSafeInteger(asset.bytes) || asset.bytes < 1 || asset.bytes > MAX_PHOTO_BYTES || !Number.isSafeInteger(asset.width) || !Number.isSafeInteger(asset.height) || asset.width < 1 || asset.height < 1 || asset.width > 1600 || asset.height > 1600) {
      throw new DraftError(400, "INVALID_PHOTO", "This upload is not a supported image up to 5 MB. Remove it and choose another photo.");
    }
    photos[index] = { ...photo, state: "ready", format: asset.format, width: asset.width, height: asset.height, bytes: asset.bytes };
  } else if (action === "cover") {
    if (photo.state !== "ready") throw new DraftError(400, "INVALID_PHOTO", "Finish uploading before choosing a cover.");
    photos.splice(index, 1); photos.unshift(photo);
  } else { photos[index] = { ...photo, state: "removed" }; }
  const updated = await repository.replacePhotos(owner, id, expectedVersion, photos);
  if (!updated) throw conflict();
  return updated;
}

export async function readPhoto(id: string, photoId: string) {
  const { draft } = await owned(id);
  const photo = (draft.photos ?? []).find(photo => photo.id === photoId && photo.state === "ready");
  if (!photo?.format) throw new DraftError(404, "NOT_FOUND", "Photo not found.");
  const cloud = provider();
  const url = cloud.utils.private_download_url(photo.publicId, photo.format, { resource_type: "image", type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 60, attachment: false });
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new DraftError(503, "PHOTO_UNAVAILABLE", "The photo is temporarily unavailable.");
  return new Response(response.body, { headers: { "Content-Type": photo.format === "jpg" ? "image/jpeg" : `image/${photo.format}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" } });
}
