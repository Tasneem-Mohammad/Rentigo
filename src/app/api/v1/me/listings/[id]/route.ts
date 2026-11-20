import { getOwnDraft, saveExistingDraft, deleteOwnDraft } from "@/server/services/drafts";
import { draftBody, draftFailure, privateHeaders } from "@/server/draft-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) { try { return Response.json({ data: await getOwnDraft((await context.params).id) }, { headers: privateHeaders }); } catch (error) { return draftFailure(error); } }
export async function PATCH(request: Request, context: Context) { try { return Response.json({ data: await saveExistingDraft((await context.params).id, await draftBody(request)) }, { headers: privateHeaders }); } catch (error) { return draftFailure(error); } }

export async function DELETE(request: Request, context: Context) { try { await deleteOwnDraft((await context.params).id, await draftBody(request)); return new Response(null, { status: 204, headers: privateHeaders }); } catch (error) { return draftFailure(error); } }
