import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * User — owner accounts + admins (see docs/03-Database-Design.md §3.1).
 * Maps to the `users` collection, shared with the Auth.js MongoDB adapter.
 * `plan` is reserved (always "free" in v1) so billing tiers can be added later
 * without a migration. `collaborators` is reserved for the v2 co-host feature.
 */
const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    name: { type: String, trim: true, maxlength: 120 },
    image: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
    plan: { type: String, enum: ["free"], default: "free" },
    emailVerified: { type: Date, default: null },
    lastLoginAt: { type: Date },
    disabledAt: { type: Date, default: null },
    disabledReason: { type: String, maxlength: 300 },
    /** Hashed password — only set for credential-based admin accounts */
    passwordHash: { type: String, select: false },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) ?? model<UserDoc>("User", UserSchema);
