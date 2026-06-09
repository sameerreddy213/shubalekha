import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const AnalyticsDailySchema = new Schema(
  {
    inviteId:       { type: Schema.Types.ObjectId, ref: "Invite", required: true, index: true },
    day:            { type: String, required: true },
    views:          { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    rsvpYes:        { type: Number, default: 0 },
    rsvpNo:         { type: Number, default: 0 },
    rsvpMaybe:      { type: Number, default: 0 },
    byDevice:       { type: Map, of: Number, default: {} },
    byBrowser:      { type: Map, of: Number, default: {} },
    byCountry:      { type: Map, of: Number, default: {} },
    byCity:         { type: Map, of: Number, default: {} },
    bySource:       { type: Map, of: Number, default: {} },
  },
  { timestamps: true },
);

AnalyticsDailySchema.index({ inviteId: 1, day: 1 }, { unique: true });

export type AnalyticsDailyDoc = InferSchemaType<typeof AnalyticsDailySchema>;

export const AnalyticsDaily: Model<AnalyticsDailyDoc> =
  (models.AnalyticsDaily as Model<AnalyticsDailyDoc>) ??
  model<AnalyticsDailyDoc>("AnalyticsDaily", AnalyticsDailySchema);
