import "server-only";
import { Listing } from "@/models/listing";
import { connectDatabase } from "@/lib/mongodb";
import { prototypePublishingEnabled } from "@/server/prototype-publishing";

export async function findPublished(id: string) {
  if (!prototypePublishingEnabled() || !/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDatabase();
  return Listing.findOne({ _id: id, status: "active", prototypePublished: true }).lean();
}
export async function listPublished() {
  if (!prototypePublishingEnabled()) return [];
  await connectDatabase();
  return Listing.find({ status: "active", prototypePublished: true }).sort({ updatedAt: -1, _id: -1 }).limit(100).lean();
}
