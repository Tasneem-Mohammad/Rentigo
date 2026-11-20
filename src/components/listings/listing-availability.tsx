"use client";
import { availabilityError, displayAvailabilityDate } from "@/lib/listing-availability";
import { Input } from "@/components/ui/input";
export function ListingAvailability({ from, until, onChange }: { from: string | null; until: string | null; onChange: (from: string | null, until: string | null) => void }) {
  const error = availabilityError(from, until);
  return <section className="listing-availability" aria-labelledby="availability-heading">
    <div className="availability-heading"><h2 id="availability-heading"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="1"/><path d="M8 2v6m8-6v6M4 11h16m-11 4h2m2 0h2m-6 3h2"/></svg>Item availability</h2><button type="button" onClick={() => onChange(null, null)} disabled={!from && !until}>↺ Clear dates</button></div>
    <p>Choose when your item can be rented by neighbours.</p>
    <div className="availability-date-grid">
      <Input id="available-from" name="availableFrom" label="Available from" type="date" value={from ?? ""} onChange={event => onChange(event.target.value || null, until)} aria-invalid={!!error} aria-describedby="availability-summary"/>
      <Input id="available-until" name="availableUntil" label="Available until" type="date" value={until ?? ""} min={from ?? undefined} onChange={event => onChange(from, event.target.value || null)} aria-invalid={!!error} aria-describedby="availability-summary"/>
    </div>
    <p id="availability-summary" role="status" className={`availability-summary${error ? " is-error" : ""}`}>{error || (from && until ? <><span aria-hidden="true">● </span><strong>Selected window: </strong>{displayAvailabilityDate(from)} – {displayAvailabilityDate(until)}</> : "No dates set. You can add them before publishing.")}</p>
    <p className="availability-note">These are your item’s availability dates, not a confirmed booking. Saving keeps the listing private.</p>
  </section>;
}
