import "server-only";

// Prototype mode is an explicit testing exception, never a real verification claim.
export function prototypePublishingEnabled() {
  if (process.env.ENABLE_PROTOTYPE_PUBLISHING !== "true") return false;
  try {
    const url = new URL(process.env.BETTER_AUTH_URL ?? "");
    return url.protocol === "https:" || (process.env.NODE_ENV === "development" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  }
  catch { return false; }
}
