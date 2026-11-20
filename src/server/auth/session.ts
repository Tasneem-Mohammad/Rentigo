import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
import { authConfig, authEnabled } from "./config";

async function rawSession() {
  if (!authEnabled()) return null;
  return getAuth().api.getSession({ headers: await headers() });
}
export async function currentSession() {
  const session = await rawSession();
  // Sessions created during the development bypass cannot retain private access.
  if (session && authConfig().verificationRequired && !session.user.emailVerified) return null;
  return session;
}
export async function requireUser() {
  const session = await rawSession();
  if (!session) redirect("/login");
  if (session.user.accountStatus !== "active") redirect("/account-restricted");
  if (authConfig().verificationRequired && !session.user.emailVerified) redirect("/verify-email");
  return session;
}
export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/dashboard");
  return session;
}
