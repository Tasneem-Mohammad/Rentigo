"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerificationResend({ disabled, defaultEmail = "", expanded = false, initialCooldown = false }: { disabled: boolean; defaultEmail?: string; expanded?: boolean; initialCooldown?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(initialCooldown ? 30 : 0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || remaining) return;
    const email = String(new FormData(event.currentTarget).get("verificationEmail") ?? "").trim();
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackURL: "/login?verification=complete" }),
      });
      const result = response.ok ? null : await response.json().catch(() => null);
      const code = result?.code ?? result?.error?.code;
      if (response.status === 429) {
        const retryAfter = Number(response.headers?.get("Retry-After") ?? response.headers?.get("X-Retry-After") ?? 60);
        setRemaining(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.max(30, Math.ceil(retryAfter)) : 60);
        setMessage("Too many requests. Wait for the countdown before trying again.");
      } else if (code === "EMAIL_TEST_RECIPIENT_RESTRICTED") {
        setMessage("This development sender can email only your Resend account’s address. Use that address, or configure a verified sending domain before testing other addresses.");
      } else if (code === "EMAIL_DELIVERY_UNAVAILABLE") {
        setMessage("Email delivery is temporarily unavailable. Please try again later. Your password has not been changed.");
      } else if (["INVALID_ORIGIN", "INVALID_CALLBACK_URL", "MISSING_OR_NULL_ORIGIN"].includes(code)) {
        setMessage("Please reopen Rentigo at its configured address and try again. The verification request was blocked because the page address did not match.");
      } else if (response.status === 503) {
        setMessage("Account access is temporarily unavailable. Please try again later.");
      } else if (!response.ok) {
        setMessage("We couldn’t request a verification email. Please try again later.");
      } else {
        setRemaining(30);
        setMessage("If this account needs verification, a link will be sent. Check your inbox and spam folder. Links expire after one hour.");
      }
    } catch { setMessage("We couldn’t reach account services. Please try again."); }
    finally { setBusy(false); }
  }
  return <details className="auth-feedback verification-resend" open={expanded}><summary>Resend verification email</summary>
    <p>This link confirms your email address. It does not change your password.</p>
    <form onSubmit={resend} className="form-stack"><fieldset className="auth-fields" disabled={disabled || busy || remaining > 0}>
      <Input id="verification-email" name="verificationEmail" label="Account email address" type="email" required maxLength={254} autoComplete="email" defaultValue={defaultEmail}/>
      <Button type="submit" variant="secondary">{busy ? "Sending…" : remaining ? `Try again in ${remaining}s` : "Resend verification email"}</Button>
    </fieldset></form>
    {message && <p role="status">{message}</p>}
  </details>;
}
