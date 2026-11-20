"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function DeleteDraft({ id, title, version }: { id: string; title: string; version: number }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function remove() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/v1/me/listings/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedVersion: version }) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error?.message ?? "The draft could not be deleted."); }
      router.replace("/listings?deleted=1"); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please try again."); setBusy(false); }
  }
  return <div className="delete-draft">{!confirming ? <button className="delete-draft-trigger" type="button" aria-label={`Delete draft: ${title}`} onClick={() => setConfirming(true)}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg>Delete</button> : <div role="group" aria-label={`Confirm deletion of ${title}`}><p>Delete “{title}” permanently? This cannot be undone.</p><div className="draft-actions"><Button type="button" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete draft"}</Button><Button variant="secondary" type="button" disabled={busy} onClick={() => { setConfirming(false); setError(""); }}>Cancel</Button></div></div>}{error && <p role="alert">{error} Reload My Listings if the draft changed in another tab.</p>}</div>;
}
