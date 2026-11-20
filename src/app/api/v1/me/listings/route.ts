import { getOwnDrafts, saveNewDraft } from "@/server/services/drafts";
import { draftBody, draftFailure, privateHeaders } from "@/server/draft-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { try { return Response.json({ data: await getOwnDrafts() }, { headers: privateHeaders }); } catch (error) { return draftFailure(error); } }
export async function POST(request: Request) { try { return Response.json({ data: await saveNewDraft(await draftBody(request)) }, { status: 201, headers: privateHeaders }); } catch (error) { return draftFailure(error); } }
