// Run explicitly: node --env-file=.env.local scripts/cleanup-deleted-draft-photos.mjs
// Dry-run by default. Add --apply to remove only due assets in the development queue.
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";
const apply = process.argv.includes("--apply");
if (!/dev|test/i.test(process.env.MONGODB_DB ?? "") || !["localhost", "127.0.0.1"].includes(new URL(process.env.BETTER_AUTH_URL).hostname)) throw new Error("Development configuration required.");
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
try {
  await client.connect();
  const queue = client.db(process.env.MONGODB_DB).collection("draftPhotoCleanup");
  const due = await queue.find({ notBefore: { $lte: new Date() } }).limit(100).toArray();
  let removed = 0;
  for (const asset of due) {
    if (!apply) continue;
    if (!/^rentigo\/drafts\/[a-f0-9]{24}\/[a-f0-9-]{36}$/.test(asset.publicId)) continue;
    try {
      const result = await cloudinary.uploader.destroy(asset.publicId, { type: "authenticated", resource_type: "image", invalidate: true });
      if (result.result === "ok" || result.result === "not found") { await queue.deleteOne({ _id: asset._id }); removed++; }
    } catch { /* Keep failures in the queue for a later retry. */ }
  }
  console.log(`${apply ? "Cleanup" : "Dry run"}: ${due.length} due assets, ${removed} removed. No credentials or asset URLs displayed.`);
} catch { console.error("Photo cleanup is unavailable. Check development configuration/connectivity; no private error payload displayed."); process.exitCode = 1; } finally { await client.close(); }
