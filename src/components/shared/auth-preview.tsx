import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PreviewNotice } from "./states";
export function AuthPreview({ signup = false }: { signup?: boolean }) {
  return <Container><div className="page-heading"><p className="eyebrow">A neighbourhood of possibilities</p><h1>{signup ? "Make yourself at home." : "Welcome back."}</h1></div><div className="page-content"><Card className="auth-card"><PreviewNotice>Sign-in provider and invitation flow are undecided. Fields and submission are disabled.</PreviewNotice><div className="form-stack">{signup && <Input disabled id="name" label="Display name" placeholder="Your name"/>}<Input disabled id="email" label="Email address" type="email" placeholder="you@example.com"/><Button disabled>{signup ? "Join Rentigo — coming later" : "Sign in — coming later"}</Button></div><Link className="text-link" href={signup ? "/login" : "/signup"}>{signup ? "Already have an account? Sign in" : "New here? Preview signup"}</Link></Card></div></Container>;
}
