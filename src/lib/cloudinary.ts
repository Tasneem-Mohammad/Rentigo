import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "@/config/env";

// Configuration only. Signing/upload authorization is deliberately not exposed.
export function getCloudinary() {
  const env = getServerEnv();
  if (env.ENABLE_CLOUDINARY !== "true") throw new Error("Cloudinary access is disabled.");
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
}
