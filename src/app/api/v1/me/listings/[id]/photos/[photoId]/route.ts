import { readPhoto } from "@/server/services/listing-photos";
import { draftFailure } from "@/server/draft-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try { const { id, photoId } = await context.params; return await readPhoto(id, photoId); }
  catch (error) { return draftFailure(error); }
}
