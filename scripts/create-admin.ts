/**
 * Promote an existing user to admin.
 *   npm run create-admin -- you@example.com
 * The user must have signed in at least once (so their account exists).
 */
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/models";

async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) {
    console.error("Usage: npm run create-admin -- <email>");
    process.exit(1);
  }

  await dbConnect();
  const res = await User.updateOne({ email }, { $set: { role: "admin", status: "active" } });

  if (res.matchedCount === 0) {
    console.error(`✗ No user found with email "${email}". Ask them to sign in once first.`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${email} is now an admin.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
