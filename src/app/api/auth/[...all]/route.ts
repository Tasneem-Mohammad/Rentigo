import { getAuth } from "@/server/auth/auth";
import { authEnabled } from "@/server/auth/config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const unavailable = () => Response.json({ error: { code: "AUTH_UNAVAILABLE", message: "Account access is not available yet. Please try later." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!authEnabled()) return unavailable();
  try {
    const response = await getAuth().handler(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch { return unavailable(); }
}
export const GET = handle;
export const POST = handle;
