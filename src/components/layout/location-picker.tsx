"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";

function subscribe(callback: () => void) { window.addEventListener("storage", callback); return () => window.removeEventListener("storage", callback); }
function readCity() { try { const value = localStorage.getItem("rentigo-city"); return value && value.length <= 80 ? value : ""; } catch { return ""; } }

export function LocationPicker() {
  const savedCity = useSyncExternalStore(subscribe, readCity, () => "");
  const [selectedCity, setCity] = useState("");
  const city = selectedCity || savedCity;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  function save(value: string) {
    const name = value.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!name) { setMessage("Enter a city or area."); return; }
    setCity(name);
    try { localStorage.setItem("rentigo-city", name); } catch { /* Selection still works for this visit. */ }
    dialog.current?.close();
  }
  async function locate() {
    if (!navigator.geolocation) { setMessage("Location is unavailable. Enter your city below."); return; }
    setBusy(true); setMessage("");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }));
      const query = new URLSearchParams({ latitude: String(position.coords.latitude), longitude: String(position.coords.longitude), localityLanguage: "en" });
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${query}`, { signal: AbortSignal.timeout(10000), credentials: "omit" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const name = data.city || data.locality;
      if (typeof name !== "string" || !name.trim()) throw new Error();
      save(name);
    } catch { setMessage("We couldn’t detect your city. Permission may be blocked or location unavailable. Enter your city below."); }
    finally { setBusy(false); }
  }
  return <><button ref={trigger} type="button" className="header-location location-trigger" onClick={() => { setMessage(""); dialog.current?.showModal(); }} aria-label={`Choose location${city ? `, currently ${city}` : ""}`}><Icon name="pin" width="14" height="14"/><span>{city || "Choose your location"}</span><Icon name="chevron" width="14" height="14"/></button>
    <dialog ref={dialog} className="location-dialog" onClose={() => trigger.current?.focus()} aria-labelledby="location-title">
      <div className="location-dialog-heading"><h2 id="location-title">Choose your location</h2><button type="button" aria-label="Close location chooser" onClick={() => dialog.current?.close()}><Icon name="close"/></button></div>
      <p>Find your neighbourhood. Rentigo currently serves Vijayawada; rentals in other cities are not available yet.</p>
      <button type="button" className="button button-secondary" disabled={busy} onClick={locate}>{busy ? "Finding your city…" : "Use my current location"}</button>
      <p className="location-help">With your permission, your coordinates are sent to BigDataCloud to find your city. Only the city name is saved in this browser.</p>
      <form onSubmit={event => { event.preventDefault(); save(String(new FormData(event.currentTarget).get("city") ?? "")); }} className="form-stack">
        <label htmlFor="location-city">Or enter your city or area</label><input id="location-city" name="city" defaultValue={city} key={city} required maxLength={80} placeholder="For example, Vijayawada" disabled={busy}/><button type="submit" className="button button-primary" disabled={busy}>Save location</button>
      </form>{message && <p role="status">{message}</p>}
    </dialog>{city && city.toLowerCase() !== "vijayawada" && <span className="location-service-note">Serving Vijayawada only</span>}</>;
}