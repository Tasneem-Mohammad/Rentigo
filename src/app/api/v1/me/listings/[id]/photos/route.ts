import { authorizePhoto, changePhoto } from "@/server/services/listing-photos";
import { draftBody, draftFailure, privateHeaders } from "@/server/draft-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  try { return Response.json({ data: await authorizePhoto((await context.params).id, await draftBody(request)) }, { status: 201, headers: privateHeaders }); }
  catch (error) { return draftFailure(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { return Response.json({ data: await changePhoto((await context.params).id, await draftBody(request)) }, { headers: privateHeaders }); }
  catch (error) { return draftFailure(error); }
}
