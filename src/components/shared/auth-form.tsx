"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Mode = "login" | "signup" | "forgot" | "reset";
export function AuthForm({ mode, enabled, google, token, verificationRequired = true, emailAvailable = false }: { mode: Mode; enabled: boolean; google: boolean; token?: string; verificationRequired?: boolean; emailAvailable?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [signupSubmitted, setSignupSubmitted] = useState(false);
  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (signupSubmitted) successHeading.current?.focus(); }, [signupSubmitted]);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    let path: string;
    let body: Record<string, string>;
    if (mode === "signup") { path = "sign-up/email"; body = { name: String(values.get("name")).trim(), username: String(values.get("username")).trim().toLowerCase(), email, password, callbackURL: "/login" }; }
    else if (mode === "forgot") { path = "request-password-reset"; body = { email, redirectTo: "/reset-password" }; }
    else if (mode === "reset") { path = "reset-password"; body = { token: token ?? "", newPassword: password }; }
    else {
      const identifier = String(values.get("identifier")).trim();
      path = identifier.includes("@") ? "sign-in/email" : "sign-in/username";
      body = { [identifier.includes("@") ? "email" : "username"]: identifier, password };
    }
    try {
      const response = await fetch(`/api/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.status === 429) { setMessage("Too many attempts. Please wait a minute and try again."); return; }
      if (response.status === 503) { setMessage("Account access is temporarily unavailable. Please try later."); return; }
      if (mode === "forgot") { setMessage("If this address can receive a password-reset email, a link will be sent. Check your inbox."); return; }
      if (mode === "signup") {
        if (!verificationRequired && response.ok) { form.reset(); setSignupSubmitted(true); }
        else setMessage(verificationRequired ? "If your registration can be completed, check your email to verify your address. Then return here to sign in." : "We couldn’t create this account. Check your details, or sign in if you already have an account.");
        return;
      }
      if (!response.ok) { setMessage(mode === "reset" ? "This reset link is invalid or expired. Request a new link." : "Unable to sign in. Check your credentials and try again."); return; }
      if (mode === "reset") { setMessage("Password updated. Sign in with your new password."); return; }
      router.replace("/dashboard"); router.refresh();
    } catch { setMessage("We couldn’t reach account services. Please try again."); }
    finally { setBusy(false); }
  }
  async function googleSignIn() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/sign-in/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/login?error=google" }) });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error();
      const url = new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "accounts.google.com") throw new Error();
      window.location.assign(url.href);
    } catch { setMessage("Google sign-in is unavailable. Please try again later."); setBusy(false); }
  }
  if (signupSubmitted) return <section className="auth-success" aria-labelledby="signup-success"><span className="auth-success-mark" aria-hidden="true">✓</span><h2 id="signup-success" tabIndex={-1} ref={successHeading}>Continue with your account.</h2><p>Your registration request was received. If a new account was created, sign in with the details you chose. If you already registered this email, use your existing credentials.</p><Link href="/login" className="button button-primary">Continue to sign in <span aria-hidden="true">→</span></Link><p className="auth-success-note">Email verification is postponed for local development. Rental transactions remain unavailable.</p>{emailAvailable && <p><Link className="text-link" href="/forgot-password">Recover an existing account</Link></p>}<Link className="text-link" href="/explore">Keep browsing rentals</Link></section>;
  return <><p className="text-sm">{enabled ? "Signing in does not verify your identity or enable rental transactions." : "Account services are not configured yet. You can still browse sample rentals."}</p>{enabled && !verificationRequired && <p className="preview-notice">Local development: email verification is postponed. Rental transactions remain unavailable.</p>}{!emailAvailable && (mode === "forgot" || mode === "reset") && <p role="status">Password recovery is unavailable until email delivery is configured.</p>}<form onSubmit={submit} className="form-stack"><fieldset disabled={!enabled || busy || ((mode === "forgot" || mode === "reset") && !emailAvailable) || (mode === "reset" && !token)} className="auth-fields">
    {mode === "signup" && <><Input id="name" name="name" label="Display name" required maxLength={80} autoComplete="name"/><Input id="username" name="username" label="Username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_\.]+" hint="3–30 letters, numbers, underscores or dots." autoComplete="username"/></>}
    {(mode === "signup" || mode === "forgot") && <Input id="email" name="email" label="Email address" type="email" required maxLength={254} autoComplete="email"/>}
    {mode === "login" && <Input id="identifier" name="identifier" label="Username or email" required autoComplete="username"/>}
    {mode !== "forgot" && <Input id="password" name="password" label={mode === "reset" ? "New password" : "Password"} type="password" required minLength={mode === "login" ? 1 : 12} maxLength={128} hint={mode === "login" ? undefined : "Use 12–128 characters. A password manager is welcome."} autoComplete={mode === "login" ? "current-password" : "new-password"}/>}
    <Button type="submit">{busy ? "Please wait…" : ({ login: "Sign in", signup: "Create account", forgot: "Send reset link", reset: "Set new password" }[mode])}</Button></fieldset></form>
    {message && <p role="status" className="auth-feedback">{message}</p>}
    {(mode === "login" || mode === "signup") && <><div className="auth-divider">or</div><Button type="button" variant="secondary" disabled={!enabled || !google || busy} onClick={googleSignIn}>Continue with Google</Button>{!google && <p className="text-xs mt-2">Google sign-in is not configured yet.</p>}</>}
    <div className="auth-switch">{mode === "signup" ? <p>Already have an account? <Link href="/login">Sign in</Link></p> : mode === "login" ? <p>New to Rentigo? <Link href="/signup">Create an account</Link></p> : <p><Link href="/login">Back to sign in</Link></p>}</div><div className="auth-links">{mode === "login" && <Link href="/forgot-password">Forgot password?</Link>}<Link href="/explore">Keep browsing</Link></div></>;
}
