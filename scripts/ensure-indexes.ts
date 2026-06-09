/**
 * Build/verify MongoDB indexes for all registered models.
 *   npm run ensure-indexes
 * As collections are added in later phases, export them from src/models and they
 * will be synced here automatically.
 */
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import * as models from "@/models";

async function main() {
  await dbConnect();

  const modelList = Object.values(models).filter(
    (m) => typeof m === "function" && "syncIndexes" in m,
  ) as mongoose.Model<unknown>[];

  for (const model of modelList) {
    await model.syncIndexes();
    console.log(`✓ indexes synced: ${model.modelName}`);
  }

  await mongoose.disconnect();
  console.log(`Done (${modelList.length} models).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
