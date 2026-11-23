import "server-only";
import { z } from "zod";
import { currentSession } from "@/server/auth/session";
import { prototypePublishingEnabled } from "@/server/prototype-publishing";
import * as repository from "@/server/repositories/drafts";
import { draftFields } from "@/server/validation/draft-listing";
import { DraftError, draftOwner, getOwnDraft } from "./drafts";

function expectedVersion(input: unknown) {
  const parsed = z.object({ expectedVersion: z.number().int().min(0) }).strict().safeParse(input);
  if (!parsed.success) throw new DraftError(400, "INVALID_INPUT", "Reload your listing before continuing.");
  return parsed.data.expectedVersion;
}
export async function publishListing(id: string, input: unknown) {
  const version = expectedVersion(input);
  const draft = await getOwnDraft(id);
  if (draft.version !== version) throw new DraftError(409, "VERSION_CONFLICT", "Your listing changed. Reload before publishing.");
  const fields = { title: draft.title, category: draft.category, description: draft.description, condition: draft.condition, conditionNote: draft.conditionNote, dailyRatePaise: draft.dailyRatePaise, approximateValuePaise: draft.approximateValuePaise, depositPaise: draft.depositPaise, areaLabel: draft.areaLabel, availableFrom: draft.availableFrom, availableUntil: draft.availableUntil };
  const missing: string[] = [];
  if (!draftFields.safeParse(fields).success) missing.push("valid item details and pickup area");
  if (!draft.photos.length || draft.pendingPhotoIds.length) missing.push("at least one completed photo and no unfinished uploads");
  if (draft.dailyRatePaise === null || draft.depositPaise === null || draft.approximateValuePaise === null) missing.push("rental price, deposit and estimated value");
  if (missing.length) throw new DraftError(400, "LISTING_INCOMPLETE", `Your changes are saved privately. Add ${missing.join("; ")} before publishing.`);
  if (draft.depositPaise === 0) throw new DraftError(400, "ZERO_DEPOSIT_NOT_APPROVED", "Your changes are saved privately. Publishing with a zero deposit is not enabled until the deposit policy is approved.");
  const session = await currentSession();
  if (!session?.user.emailVerified) throw new DraftError(403, "EMAIL_NOT_VERIFIED", "Your changes are saved privately. Verify your email before publishing.");
  if (!prototypePublishingEnabled()) throw new DraftError(403, "PUBLISHING_NOT_READY", "Your details are saved privately. Prototype publishing is available only in explicitly enabled local development. Identity and eligibility checks remain required before public launch.");
  if (session.user.accountStatus !== "active") throw new DraftError(403, "ACCOUNT_RESTRICTED", "Your account cannot publish listings.");
  try {
    const result = await repository.publishPrototype(session.user.id, id, version);
    if (!result) throw new DraftError(409, "VERSION_CONFLICT", "Your listing changed. Reload before publishing.");
    return { id: result.id, status: result.status };
  } catch (error) {
    if (error instanceof repository.DuplicateDraftError) throw new DraftError(409, "DUPLICATE_DRAFT", error.message);
    throw error;
  }
}
export async function withdrawListing(id: string, input: unknown) {
  const owner = await draftOwner();
  if (!/^[a-f\d]{24}$/i.test(id)) throw new DraftError(404, "NOT_FOUND", "Listing not found.");
  const result = await repository.withdrawPrototype(owner, id, expectedVersion(input));
  if (!result) throw new DraftError(409, "VERSION_CONFLICT", "Listing unavailable or changed. Reload My Listings.");
  return { id: result.id, status: result.status };
}
