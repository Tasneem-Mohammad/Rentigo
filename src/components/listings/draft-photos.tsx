"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_LISTING_PHOTOS } from "@/constants/listing-photos";
import { prepareListingPhoto } from "@/lib/prepare-listing-photo";
import type { DraftListing } from "@/types/draft-listing";

type Authorization = { version: number; photoId: string; upload: { url: string; fields: Record<string, string | number> } };
export function DraftPhotos({ draft, version, enabled, disabled: externallyDisabled, onBusy, onVersion, onConflict }: { draft: DraftListing; version: number; enabled: boolean; disabled: boolean; onBusy: (value: boolean) => void; onVersion: (value: number) => void; onConflict: () => void }) {
  const disabled = externallyDisabled || !enabled;
  const [photos, setPhotos] = useState(draft.photos ?? []);
  const [pending, setPending] = useState(draft.pendingPhotoIds ?? []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const path = `/api/v1/me/listings/${draft.id}/photos`;
  function working(value: boolean) { setBusy(value); onBusy(value); }
  async function request(method: string, body: unknown) {
    const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) {
      if (result.error?.code === "VERSION_CONFLICT") onConflict();
      throw new Error(result.error?.message ?? "Photo changes could not be saved. Please try again.");
    }
    return result.data;
  }
  function accept(updated: DraftListing) { setPhotos(updated.photos); setPending(updated.pendingPhotoIds); onVersion(updated.version); }
  async function mutate(photoId: string, action: "complete" | "cover" | "remove") {
    if (busy || disabled) return;
    working(true); setMessage("");
    try { accept(await request("PATCH", { photoId, action, expectedVersion: version })); setMessage(action === "remove" ? "Photo removed from your draft." : action === "cover" ? "Cover photo updated." : "Photo added to your draft."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "We couldn’t update this photo."); }
    finally { working(false); }
  }
  async function upload(file: File) {
    if (busy || disabled) return;
    working(true); setMessage("Preparing your photo…"); setProgress(0);
    try {
      const blob = await prepareListingPhoto(file);
      const authorization: Authorization = await request("POST", { contentType: blob.type, sizeBytes: blob.size, expectedVersion: version });
      onVersion(authorization.version); setPending(previous => [...previous, authorization.photoId]);
      const form = new FormData();
      for (const [name, value] of Object.entries(authorization.upload.fields)) form.set(name, String(value));
      form.set("file", blob, "listing-photo.jpg");
      setMessage("Uploading your photo…");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", authorization.upload.url); xhr.timeout = 120000;
        xhr.upload.onprogress = event => { if (event.lengthComputable) setProgress(Math.round(event.loaded * 100 / event.total)); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("The upload failed. Remove the unfinished upload below and try again."));
        xhr.onerror = xhr.ontimeout = () => reject(new Error("The upload was interrupted. Retry confirmation below if it reached Cloudinary, or remove it and try again."));
        xhr.send(form);
      });
      setMessage("Confirming your photo…");
      accept(await request("PATCH", { photoId: authorization.photoId, action: "complete", expectedVersion: authorization.version }));
      setMessage("Photo added. It stays private with your draft.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "We couldn’t upload this photo. Please try another image."); }
    finally { working(false); }
  }
  return <section className="draft-photos" aria-labelledby="draft-photos-heading">
    <div className="photo-section-heading"><div><p className="editorial-eyebrow">A closer look</p><h2 id="draft-photos-heading">Your item, in pictures.</h2></div><span>{photos.length} / {MAX_LISTING_PHOTOS} photos</span></div>
    <p>Show the item clearly, including any wear. JPEG, PNG or WebP up to 10 MB; we compress photos before uploading. Photos save separately from the details above and remain private.</p>
    {!enabled && <p role="status" className="journey-note">Photo uploads need Cloudinary configuration. You can keep saving your draft details while it’s being set up.</p>}
    {!photos.length && <p className="photo-empty">Start with a clear view of the whole item. You can add detail photos next.</p>}
    <ol className="draft-photo-grid">{photos.map((photo, index) => <li key={photo.id}>
      {/* Owner-authenticated, no-store delivery must bypass Next's shared image cache. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} width={photo.width} height={photo.height} alt={`${draft.title}, photo ${index + 1}`} loading="lazy"/>
      <div className="photo-controls"><span>{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</span>{index > 0 && <button type="button" disabled={disabled || busy} onClick={() => mutate(photo.id, "cover")}>Make cover</button>}<button type="button" disabled={disabled || busy} onClick={() => mutate(photo.id, "remove")} aria-label={`Remove photo ${index + 1}`}>Remove</button></div>
    </li>)}</ol>
    <div className="photo-upload-field"><label htmlFor="listing-photo">Upload an item photo</label><p id="photo-upload-hint">Choose an image from your phone or computer. JPEG, PNG or WebP · up to 10 MB.</p><input id="listing-photo" type="file" aria-describedby="photo-upload-hint" aria-label="Choose an item photo to upload" accept="image/jpeg,image/png,image/webp" disabled={disabled || busy || photos.length + pending.length >= MAX_LISTING_PHOTOS} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void upload(file); }}/></div>
    {busy && <progress max={100} value={progress} aria-label="Photo upload progress"/>}
    {message && <p role="status" className="auth-feedback">{message}</p>}
    {pending.length > 0 && <div className="photo-pending"><h3>Unfinished uploads</h3><p>Confirm an upload that finished, or remove it to free a photo slot.</p>{pending.map((id, index) => <div className="photo-pending-row" key={id}><span>Upload {index + 1}</span><Button type="button" variant="secondary" disabled={disabled || busy} onClick={() => mutate(id, "complete")}>Retry confirmation</Button><Button type="button" variant="secondary" disabled={disabled || busy} onClick={() => mutate(id, "remove")}>Remove</Button></div>)}</div>}
  </section>;
}
