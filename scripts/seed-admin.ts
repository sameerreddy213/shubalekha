/**
 * Seed the admin user.
 *   npm run seed-admin
 * Safe to re-run — upserts by email.
 *
 * Credentials:
 *   email:    admin@shubalekha.com
 *   password: password   (change this in production!)
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// ── Minimal User model (bypasses server-only barrel) ─────────────────────
const UserSchema = new mongoose.Schema({}, { strict: false });
const User =
  (mongoose.models["User"] as mongoose.Model<mongoose.Document>) ??
  mongoose.model("User", UserSchema);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  console.log("Connecting to MongoDB…");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB ?? "shubalekha" });

  const email       = "admin@shubalekha.com";
  const plainPass   = "password";
  const passwordHash = await bcrypt.hash(plainPass, 12);

  const result = await User.updateOne(
    { email },
    {
      $set: {
        email,
        name:          "Shubalekha Admin",
        role:          "admin",
        status:        "active",
        plan:          "free",
        emailVerified: new Date(),
        passwordHash,
      },
    },
    { upsert: true },
  );

  if (result.upsertedCount) {
    console.log(`✓ Admin user created  →  ${email}`);
  } else {
    console.log(`✓ Admin user updated  →  ${email}`);
  }

  console.log("\nCredentials:");
  console.log(`  Email   : ${email}`);
  console.log(`  Password: ${plainPass}`);
  console.log("\n⚠  Change the password before going to production!");

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
