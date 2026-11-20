import "server-only";
import { authConfig } from "@/server/auth/config";
import { DraftError } from "@/server/services/drafts";
export const privateHeaders = { "Cache-Control": "private, no-store" };
export async function draftBody(request: Request) {
  if (request.headers.get("origin") !== new URL(authConfig().BETTER_AUTH_URL).origin) throw new DraftError(403, "INVALID_ORIGIN", "Please submit from Rentigo.");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DraftError(415, "INVALID_CONTENT_TYPE", "JSON is required.");
  const reader = request.body?.getReader();
  if (!reader) throw new DraftError(400, "INVALID_INPUT", "Draft details are required.");
  const chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 16384) { await reader.cancel(); throw new DraftError(413, "INPUT_TOO_LARGE", "Draft details are too long."); } chunks.push(part.value); } }
  finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new DraftError(400, "INVALID_INPUT", "Invalid JSON."); }
}
export function draftFailure(error: unknown) {
  return Response.json({ error: { code: error instanceof DraftError ? error.code : "UNAVAILABLE", message: error instanceof DraftError ? error.message : "We couldn’t access your drafts. Please try again." } }, { status: error instanceof DraftError ? error.status : 503, headers: privateHeaders });
}
