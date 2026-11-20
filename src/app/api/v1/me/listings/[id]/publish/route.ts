import { publishListing, withdrawListing } from "@/server/services/publishing";
import { draftBody, draftFailure, privateHeaders } from "@/server/draft-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json({ data: await publishListing((await context.params).id, await draftBody(request)) }, { headers: privateHeaders }); }
  catch (error) { return draftFailure(error); }
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json({ data: await withdrawListing((await context.params).id, await draftBody(request)) }, { headers: privateHeaders }); }
  catch (error) { return draftFailure(error); }
}
