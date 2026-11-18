"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryPicker } from "./category-picker";
import type { DraftListing } from "@/types/draft-listing";

function rupees(value?: number | null) { return value == null ? "" : (value / 100).toFixed(2); }
function paise(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error("Enter prices as nonnegative rupees, with at most two decimal places.");
  const [whole, fraction = ""] = text.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result > 1_000_000_000_000) throw new Error("This amount is too large to save.");
  return result;
}
export function DraftForm({ draft }: { draft?: DraftListing }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(draft?.category ? 1 : 0);
  const [category, setCategory] = useState(draft?.category ?? "");
  function changeStep(value: number) { setStep(value); setMessage(""); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }); }
  function next() {
    if (step === 0) { if (category) changeStep(1); return; }
    const fields = formRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-item-details] input, [data-item-details] textarea');
    if (fields) for (const field of fields) { if (!field.reportValidity()) return; }
    if (!condition) { setMessage("Choose the item’s condition before continuing."); return; }
    changeStep(2);
  }
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [version, setVersion] = useState(draft?.version ?? 0);
  const [condition, setCondition] = useState(draft?.condition ?? "");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; if (step < 2) { next(); return; }
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (!(submitter instanceof HTMLButtonElement) || submitter.name !== "draftAction" || submitter.value !== "save") return;
    const form = new FormData(event.currentTarget);
    setMessage(""); setBusy(true);
    try {
      const body = { title: String(form.get("title") ?? ""), category, description: String(form.get("description") ?? ""), condition, conditionNote: String(form.get("conditionNote") ?? ""), dailyRatePaise: paise(form.get("rate")), approximateValuePaise: paise(form.get("value")), depositPaise: paise(form.get("deposit")), areaLabel: String(form.get("areaLabel") ?? ""), ...(draft ? { expectedVersion: version } : {}) };
      const response = await fetch(`/api/v1/me/listings${draft ? `/${draft.id}` : ""}`, { method: draft ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) { if (response.status === 409) setConflict(true); throw new Error(result.error?.message ?? "Your draft could not be saved. Please try again."); }
      if (!draft) { router.replace(`/listings/${result.data.id}/edit?saved=1`); router.refresh(); return; }
      setVersion(result.data.version); setMessage("Draft saved. Only you can see it."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "We couldn’t save this draft. Your changes are still in the form."); }
    finally { setBusy(false); }
  }
  return <div className="listing-journey">
    <ol className="journey-progress" aria-label="Listing steps">{["Category", "Your item", "Rental details"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}><span>{index < step ? "✓" : index + 1}</span>{label}</li>)}</ol>
    <div className="journey-intro"><p className="editorial-eyebrow">Step {step + 1} of 3 · Private draft</p><h2 ref={heading} tabIndex={-1}>{["What kind of thing will you share?", "Tell us a little about your item.", "A few details, on your terms."][step]}</h2><p>{["Choose a category to get started. We’ll take it one step at a time.", "A name and an honest condition help tell its story.", "Add what you know now, or come back later. Nothing is published when you save."][step]}</p></div>
    <form ref={formRef} onSubmit={save} className="draft-form" noValidate><fieldset disabled={busy || conflict} className="auth-fields">
      <section hidden={step !== 0}><CategoryPicker value={category} onChange={setCategory}/></section>
      <section hidden={step !== 1} data-item-details className="journey-fields">
        <div className="selected-category"><span>{category}</span><button type="button" onClick={() => changeStep(0)}>Change category</button></div>
        <Input id="title" name="title" label="What’s the item called?" required maxLength={120} defaultValue={draft?.title} placeholder="For example, a cordless drill" hint="Required · A short, clear name is all you need."/>
        <fieldset className="condition-picker"><legend>What condition is it in? <span>Required · Owner-reported</span></legend>{[["working_well", "Working well", "Ready to use, with normal signs of wear."], ["has_issues", "Has some issues", "Let the renter know what needs attention."]].map(([value, label, description]) => <label key={value} className={`condition-choice ${condition === value ? "is-selected" : ""}`}><input type="radio" name="conditionChoice" value={value} checked={condition === value} onChange={() => setCondition(value)}/><span><strong>{label}</strong><span>{description}</span></span></label>)}</fieldset>
        <div hidden={condition !== "has_issues"}><Input id="conditionNote" name="conditionNote" label="What should a renter know?" required={condition === "has_issues"} disabled={condition !== "has_issues"} maxLength={500} defaultValue={draft?.conditionNote} hint="Describe the issues so there are no surprises."/></div>
        <div className="field"><label htmlFor="description">Anything else to share? (optional)</label><textarea id="description" name="description" rows={4} maxLength={2000} defaultValue={draft?.description} placeholder="A model, included accessories, or a detail that makes it useful."/></div>
      </section>
      <section hidden={step !== 2} className="journey-fields">
        <div className="journey-note">Your category, item name and condition are required. The details below can wait until you’re ready.</div>
        <div className="draft-field-grid"><Input id="rate" name="rate" label="Daily rental price (INR, optional)" type="number" min="0" step="0.01" defaultValue={rupees(draft?.dailyRatePaise)}/><Input id="deposit" name="deposit" label="Refundable deposit (INR, optional)" type="number" min="0" step="0.01" defaultValue={rupees(draft?.depositPaise)} hint="An amount you choose, separate from rental earnings."/></div>
        <Input id="value" name="value" label="Approximate current value (INR, optional)" type="number" min="0" step="0.01" defaultValue={rupees(draft?.approximateValuePaise)} hint="Your estimate of the item’s value. This does not automatically set the deposit."/>
        <Input id="areaLabel" name="areaLabel" label="Approximate pickup area (optional)" maxLength={120} defaultValue={draft?.areaLabel} placeholder="For example, Patamata" hint="A neighbourhood is enough. Don’t enter your exact home address."/>
        <p className="journey-note">Photos and availability come in a later step of development. Saving keeps this item private; it does not publish it.</p>
      </section>
      <div className="draft-actions journey-actions">{step > 0 ? <Button type="button" variant="secondary" onClick={() => changeStep(step - 1)}>← Back</Button> : <Link className="text-link" href="/listings">Back to My Listings</Link>}{step < 2 ? <Button key="continue" type="button" disabled={step === 0 && !category} onClick={event => { event.preventDefault(); next(); }}>Continue →</Button> : <Button key="save" type="submit" name="draftAction" value="save">{busy ? "Saving…" : "Save private draft"}</Button>}</div>
    </fieldset>{message && <p role="status" className="auth-feedback">{message}</p>}{conflict && <Button type="button" variant="secondary" onClick={() => window.location.reload()}>Discard unsaved changes and load latest draft</Button>}</form>
  </div>;
}
