"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
export function AccountMenu({ enabled }: { enabled: boolean }) {
  const pathname = usePathname(); const router = useRouter();
  const [signedIn, setSignedIn] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/api/auth/get-session", { cache: "no-store", signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => setSignedIn(!!data?.user)).catch(() => { /* No session is assumed after an error. */ });
    return () => controller.abort();
  }, [enabled, pathname]);
  async function signOut() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); if (!response.ok) throw new Error(); setSignedIn(false); router.replace("/login"); router.refresh(); }
    catch { setError("Sign-out failed. Try again."); } finally { setBusy(false); }
  }
  return <div className="account-menu">{signedIn ? <><Link href="/profile">Account</Link><button type="button" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign out"}</button></> : <Link href="/signup">Join Rentigo</Link>}{error && <span role="status">{error}</span>}</div>;
}
