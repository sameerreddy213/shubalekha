import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const GuestLinkSchema = new Schema(
  {
    inviteId:     { type: Schema.Types.ObjectId, ref: "Invite", required: true, index: true },
    token:        { type: String, required: true, unique: true },
    guestName:    { type: String, required: true, trim: true, maxlength: 120 },
    group:        { type: String, maxlength: 120 },
    maxPartySize: { type: Number, min: 1, max: 50, default: null },
    opens:        { type: Number, default: 0 },
    firstOpenedAt:{ type: Date },
    lastOpenedAt: { type: Date },
    rsvpId:       { type: Schema.Types.ObjectId, ref: "Rsvp", default: null },
    deletedAt:    { type: Date, default: null },
  },
  { timestamps: true },
);

GuestLinkSchema.index({ inviteId: 1, createdAt: -1 });

export type GuestLinkDoc = InferSchemaType<typeof GuestLinkSchema>;

export const GuestLink: Model<GuestLinkDoc> =
  (models.GuestLink as Model<GuestLinkDoc>) ?? model<GuestLinkDoc>("GuestLink", GuestLinkSchema);
