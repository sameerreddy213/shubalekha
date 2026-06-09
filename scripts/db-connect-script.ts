/**
 * Lightweight Mongoose connect for CLI scripts.
 * Does NOT import "server-only" — safe to use with tsx.
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

export async function scriptDbConnect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set in .env");
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB ?? "shubalekha",
    serverSelectionTimeoutMS: 10_000,
  });
}
