"use client";
import { availabilityError, displayAvailabilityDate } from "@/lib/listing-availability";
import { Input } from "@/components/ui/input";
export function ListingAvailability({ from, until, onChange, specificDates, onSpecificDates }: { from: string | null; until: string | null; onChange: (from: string | null, until: string | null) => void; specificDates: boolean; onSpecificDates: (value: boolean) => void }) {
  const error = availabilityError(from, until);
  return <section className="listing-availability" aria-labelledby="availability-heading">
    <div className="availability-heading"><h2 id="availability-heading"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="1"/><path d="M8 2v6m8-6v6M4 11h16m-11 4h2m2 0h2m-6 3h2"/></svg>Item availability</h2><button type="button" onClick={() => onChange(null, null)} disabled={!from && !until}>↺ Clear dates</button></div>
    <p>Renters will choose their pickup and return dates later. Tell us whether your item is usually available or offered for a limited period.</p>
    <fieldset className="condition-picker"><legend>When is it available?</legend><label className="condition-choice"><input type="radio" name="availabilityMode" checked={!specificDates} onChange={() => { onSpecificDates(false); onChange(null, null); }}/><span>Usually available</span></label><label className="condition-choice"><input type="radio" name="availabilityMode" checked={specificDates} onChange={() => onSpecificDates(true)}/><span>Only on specific dates</span></label></fieldset>
    <div className="availability-date-grid" hidden={!specificDates}>
      <Input id="available-from" name="availableFrom" label="Available from" type="date" value={from ?? ""} onChange={event => onChange(event.target.value || null, until)} aria-invalid={!!error} aria-describedby="availability-summary"/>
      <Input id="available-until" name="availableUntil" label="Available until" type="date" value={until ?? ""} min={from ?? undefined} onChange={event => onChange(from, event.target.value || null)} aria-invalid={!!error} aria-describedby="availability-summary"/>
    </div>
    <p id="availability-summary" role="status" className={`availability-summary${error ? " is-error" : ""}`}>{error || (from && until ? <><span aria-hidden="true">● </span><strong>Selected window: </strong>{displayAvailabilityDate(from)} – {displayAvailabilityDate(until)}</> : specificDates ? "Choose both dates before publishing, or select Usually available." : "Usually available. Rental requests will still need owner approval.")}</p>
    <p className="availability-note">For example, offering it for a month lets a renter request a week within that period. Renters will choose their own pickup and return dates when rental requests are available. These dates do not confirm a booking.</p>
  </section>;
}
