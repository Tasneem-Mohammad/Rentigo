"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function WithdrawListing({ id, version }: { id: string; version: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function withdraw() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/v1/me/listings/${id}/publish`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedVersion: version }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not withdraw this listing.");
      router.replace(`/listings/${id}/edit`); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please try again."); setBusy(false); }
  }
  return <div><Button type="button" variant="secondary" disabled={busy} onClick={withdraw}>{busy ? "Withdrawing…" : "Unpublish and edit"}</Button>{error && <p role="alert">{error}</p>}</div>;
}
