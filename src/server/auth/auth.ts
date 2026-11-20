import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { username } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { authConfig, authEnabled } from "./config";

function createAuth() {
  const env = authConfig();
  // Library-owned auth collections are isolated from future Mongoose business models.
  const client = new MongoClient(env.MONGODB_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 });
  const database = client.db(env.MONGODB_DB);
  async function sendEmail(to: string, url: string, kind: "verify" | "reset") {
    if (!env.emailAvailable) throw new Error("Email delivery is not configured.");
    const link = new URL(url);
    if (link.origin !== new URL(env.BETTER_AUTH_URL).origin) throw new Error("Invalid authentication email origin.");
    let response: Response;
    try { response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.AUTH_EMAIL_FROM, to: [to], subject: kind === "verify" ? "Verify your Rentigo email" : "Reset your Rentigo password", text: `Use this link to ${kind === "verify" ? "verify your email" : "reset your password"}:\n${url}\n\nIf you did not request this, ignore this email.` }),
      signal: AbortSignal.timeout(10000),
    }); } catch {
      throw new APIError("SERVICE_UNAVAILABLE", { code: "EMAIL_DELIVERY_UNAVAILABLE", message: "Email delivery is temporarily unavailable. Please try again later." });
    }
    if (!response.ok) {
      const failure = await response.json().catch(() => null);
      const testRecipientRestricted = response.status === 403 && typeof failure?.message === "string" && /only send testing emails to your own email address/i.test(failure.message);
      const localTestSender = ["localhost", "127.0.0.1"].includes(new URL(env.BETTER_AUTH_URL).hostname) && env.AUTH_EMAIL_FROM?.includes("onboarding@resend.dev");
      // Whitelisted diagnostics only: never return provider payloads, email addresses or links.
      throw new APIError("SERVICE_UNAVAILABLE", {
        code: testRecipientRestricted && localTestSender ? "EMAIL_TEST_RECIPIENT_RESTRICTED" : "EMAIL_DELIVERY_UNAVAILABLE",
        message: testRecipientRestricted && localTestSender ? "The development sender can email only the Resend account address. Use that address or configure a verified sending domain." : "Email delivery is temporarily unavailable. Please try again later.",
      });
    }
  }
  return betterAuth({
    appName: "Rentigo", basePath: "/api/auth", baseURL: env.BETTER_AUTH_URL, secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
    database: mongodbAdapter(database, { client }),
    emailAndPassword: { enabled: true, autoSignIn: false, requireEmailVerification: env.verificationRequired, minPasswordLength: 12, maxPasswordLength: 128, revokeSessionsOnPasswordReset: true, sendResetPassword: env.emailAvailable ? async ({ user, url }) => sendEmail(user.email, url, "reset") : undefined },
    emailVerification: { sendOnSignUp: env.verificationRequired, sendOnSignIn: env.verificationRequired, autoSignInAfterVerification: false, expiresIn: 3600, sendVerificationEmail: env.emailAvailable ? async ({ user, url }) => sendEmail(user.email, url, "verify") : undefined },
    socialProviders: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } } : {},
    account: { accountLinking: { enabled: false } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    user: { additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
      accountStatus: { type: "string", defaultValue: "active", input: false },
      identityStatus: { type: "string", defaultValue: "unverified", input: false },
      eligibilityStatus: { type: "string", defaultValue: "pending", input: false },
    } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    advanced: { ipAddress: { ipAddressHeaders: [] } },
    logger: { disabled: true },
    plugins: [username({ minUsernameLength: 3, maxUsernameLength: 30 })],
  });
}
type Auth = ReturnType<typeof createAuth>;
const globalAuth = globalThis as typeof globalThis & { rentigoAuth?: Auth };
export function getAuth() {
  if (!authEnabled()) throw new Error("Authentication is disabled.");
  return globalAuth.rentigoAuth ??= createAuth();
}
