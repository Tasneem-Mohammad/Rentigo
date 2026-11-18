import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
import { authEnabled } from "./config";

export async function currentSession() {
  if (!authEnabled()) return null;
  return getAuth().api.getSession({ headers: await headers() });
}
export async function requireUser() {
  const session = await currentSession();
  if (!session) redirect("/signup");
  if (session.user.accountStatus !== "active") redirect("/account-restricted");
  return session;
}
export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/dashboard");
  return session;
}
