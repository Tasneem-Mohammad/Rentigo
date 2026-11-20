import { getAuth } from "@/server/auth/auth";
import { authEnabled } from "@/server/auth/config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const unavailable = () => Response.json({ error: { code: "AUTH_UNAVAILABLE", message: "Account access is not available yet. Please try later." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!authEnabled()) return unavailable();
  let stage = "initialization";
  try {
    const auth = getAuth();
    stage = "session-check";
    if (request.method === "POST" && new URL(request.url).pathname.replace(/\/+$/, "") === "/api/auth/sign-up/email") {
      const session = await auth.api.getSession({ headers: request.headers });
      if (session) return Response.json({ error: { code: "ALREADY_SIGNED_IN", message: "You’re already signed in. Use your existing account." } }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    stage = "request-handler";
    const response = await auth.handler(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    // Allowlisted categories only: never log raw errors, messages, URIs, headers or bodies.
    const name = error instanceof Error ? error.name : "Unknown";
    const category = ["MongoParseError", "MongoServerSelectionError", "MongoNetworkError", "MongoServerError", "TypeError", "APIError"].includes(name) ? name : "UnexpectedError";
    console.error("[Rentigo auth unavailable]", { stage, category });
    return unavailable();
  }
}
export const GET = handle;
export const POST = handle;
