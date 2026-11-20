import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "@/config/env";

export function cloudinaryEnabled() {
  try { return getServerEnv().ENABLE_CLOUDINARY === "true"; }
  catch { return false; }
}

// Lazy, server-only configuration; uploads are authorized by the listing service.
export function getCloudinary() {
  const env = getServerEnv();
  if (env.ENABLE_CLOUDINARY !== "true") throw new Error("Cloudinary access is disabled.");
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
}
