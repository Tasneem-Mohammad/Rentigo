"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VerificationResend } from "./verification-resend";
import { EmailVerificationStatus } from "./email-verification-status";

type Mode = "login" | "signup" | "forgot" | "reset" | "verify";
export function AuthForm({ mode, enabled, google, token, verificationRequired = true, emailAvailable = false }: { mode: Mode; enabled: boolean; google: boolean; token?: string; verificationRequired?: boolean; emailAvailable?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [signupSubmitted, setSignupSubmitted] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (signupSubmitted) successHeading.current?.focus(); }, [signupSubmitted]);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setNeedsVerification(false);
    const form = event.currentTarget;
    const values = new FormData(form);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    let path: string;
    let body: Record<string, string>;
    if (mode === "signup") { path = "sign-up/email"; body = { name: String(values.get("name")).trim(), username: String(values.get("username")).trim().toLowerCase(), email, password, callbackURL: "/login?verification=complete" }; }
    else if (mode === "forgot") { path = "request-password-reset"; body = { email, redirectTo: "/reset-password" }; }
    else if (mode === "reset") { path = "reset-password"; body = { token: token ?? "", newPassword: password }; }
    else {
      const identifier = String(values.get("identifier")).trim();
      path = identifier.includes("@") ? "sign-in/email" : "sign-in/username";
      body = { [identifier.includes("@") ? "email" : "username"]: identifier, password, callbackURL: "/login?verification=complete" };
    }
    try {
      const response = await fetch(`/api/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.status === 429) { setMessage("Too many attempts. Please wait a minute and try again."); return; }
      if (response.status === 503) {
        const data = await response.json().catch(() => null);
        const code = data?.code ?? data?.error?.code;
        if (code === "EMAIL_TEST_RECIPIENT_RESTRICTED" || code === "EMAIL_DELIVERY_UNAVAILABLE") {
          if (mode === "login") {
            const identifier = String(values.get("identifier") ?? "").trim();
            setVerificationEmail(identifier.includes("@") ? identifier : ""); setNeedsVerification(true);
          }
          setMessage(code === "EMAIL_TEST_RECIPIENT_RESTRICTED" ? "The development sender can email only your Resend account’s address. Use that address or configure a verified sending domain." : "We couldn’t deliver the email. Please try again later; your password has not been changed.");
        } else setMessage("Account access is temporarily unavailable. Please try later.");
        return;
      }
      if (mode === "forgot") { setMessage("If this address can receive a password-reset email, a link will be sent. Check your inbox."); return; }
      if (mode === "signup") {
        const data = await response.json().catch(() => null);
        const code = data?.code ?? data?.error?.code;
        if (response.status === 409) {
          if (data?.error?.code === "ALREADY_SIGNED_IN") { router.replace("/dashboard"); router.refresh(); return; }
        }
        if (!response.ok && code === "USERNAME_IS_ALREADY_TAKEN") { setMessage("That username is already taken. Please choose another username."); return; }
        if (!response.ok && ["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"].includes(code)) { setMessage("An account with this email already exists. Sign in or use Forgot password to recover it."); return; }
        if (!response.ok) { setMessage("Registration failed. Check your details, including your username, or sign in if you already have an account."); return; }
        setVerificationEmail(email); form.reset(); setSignupSubmitted(true);
        return;
      }
      if (mode === "login" && response.status === 403) {
        const data = await response.json().catch(() => null);
        if (data?.code === "EMAIL_NOT_VERIFIED") {
          const identifier = String(values.get("identifier") ?? "").trim();
          setVerificationEmail(identifier.includes("@") ? identifier : ""); setNeedsVerification(true);
          setMessage("Verify your email before signing in. Check your inbox and spam folder, or request another verification link below.");
          return;
        }
      }
      if (!response.ok) { setMessage(mode === "reset" ? "This reset link is invalid or expired. Request a new link." : "Unable to sign in. Check your credentials and try again."); return; }
      if (mode === "reset") { setMessage("Password updated. Sign in with your new password."); return; }
      const sessionResponse = await fetch("/api/v1/me", { cache: "no-store", credentials: "same-origin" });
      if (sessionResponse.status === 403) { router.replace("/account-restricted"); router.refresh(); return; }
      if (!sessionResponse.ok) { setMessage("We couldn’t confirm your sign-in session. Please reload and try again. If your email still needs verification, use Verify your email below."); return; }
      const sessionResult = await sessionResponse.json();
      if (!sessionResult.data?.id) { setMessage("We couldn’t confirm your sign-in session. Please try again."); return; }
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
  if (mode === "verify") return <section className="email-verification-step"><EmailVerificationStatus state="pending"/><p>Open the Rentigo email titled “Verify your Rentigo email” and click the verification link. You won’t be asked to choose a new password.</p><p>Can’t find it? Check spam, or request another email below.</p><VerificationResend disabled={!enabled || !emailAvailable} expanded/><Link className="text-link" href="/login">Back to sign in</Link></section>;
  if (signupSubmitted) return <section className="auth-success" aria-labelledby="signup-success">{verificationRequired && <EmailVerificationStatus state="pending"/>}<h2 id="signup-success" tabIndex={-1} ref={successHeading}>{verificationRequired ? "Check your inbox." : "Continue with your account."}</h2><p>{verificationRequired ? "Your registration request was received. If a new account was created, we’ve requested a verification email. Open “Verify your Rentigo email” and click the link, then come back to sign in. Check your spam folder too." : "Your registration request was received. If a new account was created, sign in with the details you chose."}</p><p>If you already registered this email, use your existing account. Your password has not been changed.</p>{verificationRequired && <VerificationResend disabled={!enabled || !emailAvailable} defaultEmail={verificationEmail} expanded initialCooldown/>}<Link href="/login" className="button button-primary">Continue to sign in <span aria-hidden="true">→</span></Link>{!verificationRequired && <p className="auth-success-note">Email verification is postponed for local development. Rental transactions remain unavailable.</p>}<Link className="text-link" href="/explore">Keep browsing rentals</Link></section>;
  return <><p className="text-sm">{enabled ? "Signing in does not verify your identity or enable rental transactions." : "Account services are not configured yet. You can still browse sample rentals."}</p>{enabled && !verificationRequired && <p className="preview-notice">Local development: email verification is postponed. Rental transactions remain unavailable.</p>}{!emailAvailable && (mode === "forgot" || mode === "reset") && <p role="status">Password recovery is unavailable until email delivery is configured.</p>}<form onSubmit={submit} className="form-stack"><fieldset disabled={!enabled || busy || ((mode === "forgot" || mode === "reset") && !emailAvailable) || (mode === "reset" && !token)} className="auth-fields">
    {mode === "signup" && <><Input id="name" name="name" label="Display name" required maxLength={80} autoComplete="name"/><Input id="username" name="username" label="Username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_\.]+" hint="3–30 letters, numbers, underscores or dots." autoComplete="username"/></>}
    {(mode === "signup" || mode === "forgot") && <Input id="email" name="email" label="Email address" type="email" required maxLength={254} autoComplete="email" hint={mode === "signup" && verificationRequired ? "We’ll send a verification link after signup. You won’t need to change your password." : mode === "forgot" ? "We’ll send a link to choose a new password." : undefined}/>}
    {mode === "login" && <Input id="identifier" name="identifier" label="Username or email" required autoComplete="username"/>}
    {mode !== "forgot" && <Input id="password" name="password" label={mode === "reset" ? "New password" : "Password"} type="password" required minLength={mode === "login" ? 1 : 12} maxLength={128} hint={mode === "login" ? undefined : "Use 12–128 characters. A password manager is welcome."} autoComplete={mode === "login" ? "current-password" : "new-password"}/>}
    <Button type="submit">{busy ? "Please wait…" : ({ login: "Sign in", signup: "Create account", forgot: "Send reset link", reset: "Set new password" }[mode])}</Button></fieldset></form>
    {message && <p role="status" className="auth-feedback">{message}</p>}
    {needsVerification && <section className="email-verification-step"><EmailVerificationStatus state="unverified"/><VerificationResend key={verificationEmail} disabled={!enabled || !emailAvailable || busy} defaultEmail={verificationEmail} expanded initialCooldown/></section>}
    {(mode === "login" || mode === "signup") && <><div className="auth-divider">or</div><Button type="button" variant="secondary" disabled={!enabled || !google || busy} onClick={googleSignIn}>Continue with Google</Button>{!google && <p className="text-xs mt-2">Google sign-in is not configured yet.</p>}</>}
    <div className="auth-switch">{mode === "signup" ? <p>Already have an account? <Link href="/login">Sign in</Link></p> : mode === "login" ? <p>New to Rentigo? <Link href="/signup">Create an account</Link></p> : <p><Link href="/login">Back to sign in</Link></p>}</div><div className="auth-links">{mode === "login" && <><Link href="/forgot-password">Forgot password?</Link>{verificationRequired && <Link href="/verify-email">Verify your email</Link>}</>}<Link href="/explore">Keep browsing</Link></div></>;
}
