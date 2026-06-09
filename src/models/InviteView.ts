import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const InviteViewSchema = new Schema(
  {
    inviteId:    { type: Schema.Types.ObjectId, ref: "Invite", required: true, index: true },
    day:         { type: String, required: true },
    visitorHash: { type: String, required: true },
    device:      { type: String, enum: ["mobile", "tablet", "desktop", "bot"] },
    browser:     { type: String },
    os:          { type: String },
    country:     { type: String },
    city:        { type: String },
    source:      { type: String, enum: ["whatsapp", "instagram", "facebook", "google", "direct", "other"] },
    guestLinkId: { type: Schema.Types.ObjectId, ref: "GuestLink", default: null },
    ts:          { type: Date, default: Date.now },
  },
  { timestamps: false },
);

InviteViewSchema.index({ inviteId: 1, day: 1 });
InviteViewSchema.index({ visitorHash: 1, inviteId: 1, day: 1 });
// TTL: raw events expire after 60 days; aggregates in AnalyticsDaily persist
InviteViewSchema.index({ ts: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

export type InviteViewDoc = InferSchemaType<typeof InviteViewSchema>;

export const InviteView: Model<InviteViewDoc> =
  (models.InviteView as Model<InviteViewDoc>) ?? model<InviteViewDoc>("InviteView", InviteViewSchema);
