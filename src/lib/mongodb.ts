import "server-only";
import mongoose from "mongoose";
import { getServerEnv } from "@/config/env";

declare global {
  var rentigoMongoPromise: Promise<typeof mongoose> | undefined;
}

// Lazy connection: importing this module never opens a socket.
export async function connectDatabase() {
  const env = getServerEnv();
  if (env.ENABLE_DATABASE !== "true" || !env.MONGODB_URI) throw new Error("Database access is disabled.");
  if (!globalThis.rentigoMongoPromise) {
    globalThis.rentigoMongoPromise = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
    }).catch(error => {
      globalThis.rentigoMongoPromise = undefined;
      throw error;
    });
  }
  return globalThis.rentigoMongoPromise;
}
