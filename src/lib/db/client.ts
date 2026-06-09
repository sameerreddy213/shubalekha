import "server-only";
import { MongoClient } from "mongodb";
import { env } from "@/lib/env";

/**
 * Raw MongoClient promise for the Auth.js MongoDB adapter (sessions/accounts).
 * Shares the same Atlas cluster + database as Mongoose (app models).
 *
 * Returns `null` when MONGODB_URI is not configured, so the app can still boot
 * (auth simply degrades — see src/lib/auth/config.ts). Cached on globalThis to
 * survive HMR in development.
 */
const globalForMongo = globalThis as unknown as { _mongoClientPromise?: Promise<MongoClient> };

function createClientPromise(): Promise<MongoClient> | null {
  if (!env.MONGODB_URI) return null;
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(env.MONGODB_URI);
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

export const clientPromise: Promise<MongoClient> | null = createClientPromise();
