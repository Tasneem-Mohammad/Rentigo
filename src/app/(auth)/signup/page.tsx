import { AuthPreview } from "@/components/shared/auth-preview";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/auth";
import { authConfig, authEnabled } from "@/server/auth/config";
export default async function SignupPage() {
  let destination: string | undefined;
  try {
    if (authEnabled()) {
      const session = await getAuth().api.getSession({ headers: await headers() });
      if (session) destination = session.user.accountStatus !== "active" ? "/account-restricted" : authConfig().verificationRequired && !session.user.emailVerified ? "/verify-email" : "/dashboard";
    }
  } catch { /* The form will display unavailable configuration without exposing errors. */ }
  if (destination) redirect(destination);
  return <AuthPreview signup/>;
}
