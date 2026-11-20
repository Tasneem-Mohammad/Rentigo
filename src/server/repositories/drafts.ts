import "server-only";
import { Listing } from "@/models/listing";
import { connectDatabase } from "@/lib/mongodb";
import type { DraftFields } from "@/server/validation/draft-listing";
import type { ClientSession } from "mongoose";
import { draftName } from "@/lib/draft-name";
import { draftDto } from "./draft-dto";
import { prototypePublishingEnabled } from "@/server/prototype-publishing";
export async function createDraft(ownerId: string, fields: DraftFields) {
  return ownerWrite(ownerId, async session => {
    await uniqueName(ownerId, fields.title, fields.category, session);
    return draftDto((await Listing.create([{ ...fields, ownerId, status: "draft" }], { session }))[0].toObject());
  });
}
export async function listDrafts(ownerId: string) {
  await connectDatabase();
  return (await Listing.find({ ownerId, status: { $in: ["draft", "active"] } }).sort({ updatedAt: -1, _id: -1 }).limit(100).lean()).map(draftDto);
}
export async function findDraft(ownerId: string, id: string) {
  await connectDatabase();
  const record = await Listing.findOne({ _id: id, ownerId, status: "draft" }).lean();
  return record ? draftDto(record) : null;
}
export class DuplicateDraftError extends Error {}
async function ownerWrite<T>(ownerId: string, work: (session: ClientSession) => Promise<T>): Promise<T> {
  const connection = await connectDatabase();
  // All name-changing writes serialize on the same owner record across processes.
  for (let attempt = 0; ; attempt++) {
    const session = await connection.startSession();
    try {
      return await session.withTransaction(async () => {
        await connection.connection.collection<{ _id: string; revision: number }>("draftOwnerLocks").updateOne({ _id: ownerId }, { $inc: { revision: 1 } }, { upsert: true, session });
        return work(session);
      });
    } catch (error) {
      // Two first writes can race while creating the owner lock's unique _id.
      if (attempt < 2 && (error as { code?: number }).code === 11000) continue;
      throw error;
    } finally { await session.endSession(); }
  }
}
async function uniqueName(ownerId: string, title: string, category: DraftFields["category"], session: ClientSession, excluding?: string) {
  const records = await Listing.find({ ownerId, category, status: { $in: ["draft", "active"] }, ...(excluding ? { _id: { $ne: excluding } } : {}) }).select("title").session(session).lean();
  if (records.some(record => draftName(record.title) === draftName(title))) throw new DuplicateDraftError("You already have an item with this name in this category. Edit the existing item or use a distinct name.");
}
export async function updateDraft(ownerId: string, id: string, version: number, fields: DraftFields) {
  return ownerWrite(ownerId, async session => {
    const existing = await Listing.findOne({ _id: id, ownerId, status: "draft", version }).session(session).lean();
    if (!existing) return null;
    if (draftName(existing.title) !== draftName(fields.title) || existing.category !== fields.category) await uniqueName(ownerId, fields.title, fields.category, session, id);
    const record = await Listing.findOneAndUpdate({ _id: id, ownerId, status: "draft", version }, { $set: fields, $inc: { version: 1 } }, { session, returnDocument: "after", runValidators: true }).lean();
    return record ? draftDto(record) : null;
  });
}
export async function deleteDraft(ownerId: string, id: string, version: number) {
  return ownerWrite(ownerId, async session => {
    const record = await Listing.findOneAndDelete({ _id: id, ownerId, status: "draft", version }, { session }).lean();
    if (!record) return false;
    const connection = await connectDatabase();
    if (record.photos?.length) await connection.connection.collection("draftPhotoCleanup").insertMany(record.photos.map(photo => ({ publicId: photo.publicId, notBefore: new Date(Math.max(Date.now(), photo.expiresAt.getTime())) })), { session });
    return true;
  });
}

export async function publishPrototype(ownerId: string, id: string, version: number) {
  if (!prototypePublishingEnabled()) return null;
  return ownerWrite(ownerId, async session => {
    const existing = await Listing.findOne({ _id: id, ownerId, status: "draft", version }).session(session).lean();
    if (!existing) return null;
    await uniqueName(ownerId, existing.title, existing.category, session, id);
    const record = await Listing.findOneAndUpdate({ _id: id, ownerId, status: "draft", version }, { $set: { status: "active", prototypePublished: true }, $inc: { version: 1 } }, { session, returnDocument: "after", runValidators: true }).lean();
    return record ? draftDto(record) : null;
  });
}

export async function withdrawPrototype(ownerId: string, id: string, version: number) {
  // Withdrawal is always allowed, including after the prototype flag is disabled.
  return ownerWrite(ownerId, async session => {
    const record = await Listing.findOneAndUpdate({ _id: id, ownerId, status: "active", prototypePublished: true, version }, { $set: { status: "draft", prototypePublished: false }, $inc: { version: 1 } }, { session, returnDocument: "after", runValidators: true }).lean();
    return record ? draftDto(record) : null;
  });
}
