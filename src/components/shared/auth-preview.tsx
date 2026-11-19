import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { AuthForm } from "./auth-form";
import { authEnabled, authConfig } from "@/server/auth/config";
export function AuthScreen({ mode, token, verificationResult, invalidResetLink = false }: { mode: "login" | "signup" | "forgot" | "reset" | "verify"; token?: string; verificationResult?: "returned" | "invalid"; invalidResetLink?: boolean }) {
  let enabled = false; let google = false; let verificationRequired = true; let emailAvailable = false;
  if (authEnabled()) { try { const env = authConfig(); enabled = true; verificationRequired = env.verificationRequired; emailAvailable = env.emailAvailable; google = !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET; } catch { /* Remain unavailable without exposing configuration. */ } }
  const title = { login: "Welcome back.", signup: "Make yourself at home.", forgot: "Reset your password.", reset: "Choose a new password.", verify: "Verify your email." }[mode];
  return <Container><div className="page-heading"><p className="eyebrow">Your Rentigo account</p><h1>{title}</h1></div><div className="page-content"><Card className="auth-card">{verificationResult && <p role="status" className="auth-feedback">{verificationResult === "invalid" ? "This verification link is invalid or expired. Use Verify your email below to request another." : "You’ve returned from email verification. Sign in to continue; we’ll check your account’s verification status."}</p>}{mode === "reset" && invalidResetLink ? <section><p role="alert">This password-reset link is missing, invalid or expired. Request a new link to choose your password.</p><Link className="button button-primary" href="/forgot-password">Request a new reset link</Link></section> : <AuthForm key={mode} mode={mode} token={token} enabled={enabled} google={google} verificationRequired={verificationRequired} emailAvailable={emailAvailable}/>}</Card></div></Container>;
}
export function AuthPreview({ signup = false }: { signup?: boolean }) { return <AuthScreen mode={signup ? "signup" : "login"}/>; }
