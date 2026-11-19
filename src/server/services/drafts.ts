import "server-only";
import { currentSession } from "@/server/auth/session";
import * as repository from "@/server/repositories/drafts";
import { draftFields, draftUpdate } from "@/server/validation/draft-listing";
export class DraftError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export async function draftOwner() {
  const session = await currentSession();
  if (!session) throw new DraftError(401, "AUTH_REQUIRED", "Please sign in to manage your drafts.");
  if (session.user.accountStatus !== "active") throw new DraftError(403, "ACCOUNT_RESTRICTED", "Your account cannot manage drafts.");
  return session.user.id;
}
function checkId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new DraftError(404, "NOT_FOUND", "Draft not found.");
}
export async function getOwnDrafts() { return repository.listDrafts(await draftOwner()); }
export async function getOwnDraft(id: string) {
  const owner = await draftOwner(); checkId(id);
  const draft = await repository.findDraft(owner, id);
  if (!draft) throw new DraftError(404, "NOT_FOUND", "Draft not found.");
  return draft;
}
export async function saveNewDraft(input: unknown) {
  const owner = await draftOwner();
  const parsed = draftFields.safeParse(input);
  if (!parsed.success) throw new DraftError(400, "INVALID_INPUT", "Choose a category and condition, enter an item name and pickup area, and describe any issues. Check field lengths and nonnegative prices.");
  return repository.createDraft(owner, parsed.data);
}
export async function saveExistingDraft(id: string, input: unknown) {
  const owner = await draftOwner(); checkId(id);
  const parsed = draftUpdate.safeParse(input);
  if (!parsed.success) throw new DraftError(400, "INVALID_INPUT", "Enter a pickup area and check your required draft fields and prices, then try again.");
  const { expectedVersion, ...fields } = parsed.data;
  const updated = await repository.updateDraft(owner, id, expectedVersion, fields);
  if (updated) return updated;
  if (!(await repository.findDraft(owner, id))) throw new DraftError(404, "NOT_FOUND", "Draft not found.");
  throw new DraftError(409, "VERSION_CONFLICT", "This draft changed in another tab. Reload the latest version before saving again.");
}
