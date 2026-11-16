import "server-only";
import { z } from "zod";

const optionalSecret = z.preprocess(value => value === "" ? undefined : value, z.string().min(1).optional());
const schema = z.object({
  ENABLE_DATABASE: z.enum(["true", "false"]).default("false"),
  MONGODB_URI: optionalSecret,
  MONGODB_DB: z.string().min(1).default("rentigo_development"),
  ENABLE_CLOUDINARY: z.enum(["true", "false"]).default("false"),
  CLOUDINARY_CLOUD_NAME: optionalSecret,
  CLOUDINARY_API_KEY: optionalSecret,
  CLOUDINARY_API_SECRET: optionalSecret,
}).superRefine((env, ctx) => {
  if (env.ENABLE_DATABASE === "true" && !env.MONGODB_URI?.match(/^mongodb(\+srv)?:\/\//)) {
    ctx.addIssue({ code: "custom", path: ["MONGODB_URI"], message: "A MongoDB URI is required when enabled." });
  }
  if (env.ENABLE_CLOUDINARY === "true") {
    for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const) {
      if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "Required when Cloudinary is enabled." });
    }
  }
});

export function getServerEnv() {
  const result = schema.safeParse({
    ENABLE_DATABASE: process.env.ENABLE_DATABASE,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    ENABLE_CLOUDINARY: process.env.ENABLE_CLOUDINARY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  });
  if (!result.success) {
    // Report field names only; never echo supplied secrets or connection strings.
    throw new Error(`Invalid server environment: ${[...new Set(result.error.issues.map(issue => issue.path.join(".")))].join(", ")}`);
  }
  return result.data;
}
