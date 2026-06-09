import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Settings — platform-wide singleton (key: "global"). Kill-switches and guardrails
 * (see docs/03-Database-Design.md §3.9). Read-cached in Redis.
 */
const SettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    signupsEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maxInvitesPerUser: { type: Number, default: 50 },
    reservedSlugs: { type: [String], default: [] },
    announcement: { type: String, maxlength: 300 },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;

export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) ?? model<SettingsDoc>("Settings", SettingsSchema);
