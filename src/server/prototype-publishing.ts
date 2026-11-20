import "server-only";

// Explicit local opt-in. A production build can never enable this exception.
export function prototypePublishingEnabled() {
  if (process.env.NODE_ENV !== "development" || process.env.ENABLE_PROTOTYPE_PUBLISHING !== "true") return false;
  try { return ["localhost", "127.0.0.1"].includes(new URL(process.env.BETTER_AUTH_URL ?? "").hostname); }
  catch { return false; }
}
