import "server-only";
import mongoose from "mongoose";
import { env, requireEnv } from "@/lib/env";

/**
 * Serverless-safe Mongoose connection (see docs/02-System-Architecture.md §5.1).
 * Caches the connection on globalThis so hot lambda invocations / HMR reuse a single
 * pool instead of opening a new connection per request.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { _mongoose?: MongooseCache };

const cache: MongooseCache = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cache;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const uri = requireEnv("MONGODB_URI");
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(uri, {
      dbName: env.MONGODB_DB,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
