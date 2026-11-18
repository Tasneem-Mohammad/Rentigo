import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { AuthForm } from "./auth-form";
import { authEnabled, authConfig } from "@/server/auth/config";
export function AuthScreen({ mode, token }: { mode: "login" | "signup" | "forgot" | "reset"; token?: string }) {
  let enabled = false; let google = false; let verificationRequired = true; let emailAvailable = false;
  if (authEnabled()) { try { const env = authConfig(); enabled = true; verificationRequired = env.verificationRequired; emailAvailable = env.emailAvailable; google = !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET; } catch { /* Remain unavailable without exposing configuration. */ } }
  const title = { login: "Welcome back.", signup: "Make yourself at home.", forgot: "A way back in.", reset: "A fresh start." }[mode];
  return <Container><div className="page-heading"><p className="eyebrow">Your Rentigo account</p><h1>{title}</h1></div><div className="page-content"><Card className="auth-card"><AuthForm key={mode} mode={mode} token={token} enabled={enabled} google={google} verificationRequired={verificationRequired} emailAvailable={emailAvailable}/></Card></div></Container>;
}
export function AuthPreview({ signup = false }: { signup?: boolean }) { return <AuthScreen mode={signup ? "signup" : "login"}/>; }
