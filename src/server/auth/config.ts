import "server-only";
import { z } from "zod";

export function authEnabled() { return process.env.ENABLE_AUTH === "true"; }
export function authConfig() {
  const result = z.object({
    ENABLE_DATABASE: z.literal("true"),
    MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//),
    MONGODB_DB: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    AUTH_REQUIRE_EMAIL_VERIFICATION: z.enum(["true", "false"]).default("true"),
    RESEND_API_KEY: z.string().optional(),
    AUTH_EMAIL_FROM: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  }).safeParse(process.env);
  if (!result.success) throw new Error("Authentication configuration is incomplete. Check the server environment.");
  const env = result.data;
  if (!!env.GOOGLE_CLIENT_ID !== !!env.GOOGLE_CLIENT_SECRET) throw new Error("Both Google credentials are required.");
  const url = new URL(env.BETTER_AUTH_URL);
  const verificationRequired = env.AUTH_REQUIRE_EMAIL_VERIFICATION !== "false";
  if (!verificationRequired && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Skipping email verification is only allowed in local development.");
  if (verificationRequired && (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM)) throw new Error("Email configuration is required.");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Authentication requires HTTPS outside localhost.");
  return { ...env, verificationRequired, emailAvailable: !!env.RESEND_API_KEY && !!env.AUTH_EMAIL_FROM };
}
