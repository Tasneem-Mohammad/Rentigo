import { currentSession } from "@/server/auth/session";
export const dynamic = "force-dynamic";
export async function GET() {
  const options = { headers: { "Cache-Control": "no-store" } };
  try {
    const session = await currentSession();
    if (!session) return Response.json({ error: { code: "AUTH_REQUIRED", message: "Please sign in." } }, { ...options, status: 401 });
    const { id, name, email, emailVerified, role, accountStatus, identityStatus, eligibilityStatus } = session.user;
    if (accountStatus !== "active") return Response.json({ error: { code: "ACCOUNT_RESTRICTED", message: "Account access is restricted." } }, { ...options, status: 403 });
    return Response.json({ data: { id, displayName: name, email, emailVerified, roles: [role], accountStatus, identityStatus, eligibilityStatus, capabilities: { canPublish: false, canBook: false } } }, options);
  } catch { return Response.json({ error: { code: "AUTH_UNAVAILABLE", message: "Account services are temporarily unavailable." } }, { ...options, status: 503 }); }
}
