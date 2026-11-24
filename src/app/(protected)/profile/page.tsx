import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/auth/session";
import { EmailVerificationStatus } from "@/components/shared/email-verification-status";
export default async function ProfilePage() {
  const { user } = await requireUser();
  return <Container><div className="page-heading"><p className="eyebrow">Your account</p><h1>A familiar face, nearby.</h1></div><div className="page-content"><Card className="profile-card"><h2>{user.name}</h2><dl className="profile-details"><div className="definition-row"><dt>Email</dt><dd>{user.email}</dd></div><div className="definition-row"><dt>Email verification</dt><dd><EmailVerificationStatus state={user.emailVerified ? "verified" : "unverified"}/></dd></div><div className="definition-row"><dt>Identity verification</dt><dd>{user.identityStatus}</dd></div><div className="definition-row"><dt>Transaction eligibility</dt><dd>{user.eligibilityStatus}</dd></div></dl><p className="text-sm mt-5">Email confirmation is not identity verification. Prototype publishing may be enabled for testing. Identity verification and real rental transactions remain unavailable. Profile editing will be added separately.</p></Card></div></Container>;
}
