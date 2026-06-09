import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const GuestbookSchema = new Schema(
  {
    inviteId:    { type: Schema.Types.ObjectId, ref: "Invite", required: true, index: true },
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    message:     { type: String, required: true, trim: true, maxlength: 600 },
    guestLinkId: { type: Schema.Types.ObjectId, ref: "GuestLink", default: null },
    hidden:      { type: Boolean, default: false, index: true },
    ipHash:      { type: String },
    deletedAt:   { type: Date, default: null },
  },
  { timestamps: true },
);

GuestbookSchema.index({ inviteId: 1, hidden: 1, createdAt: -1 });

export type GuestbookDoc = InferSchemaType<typeof GuestbookSchema>;

export const Guestbook: Model<GuestbookDoc> =
  (models.Guestbook as Model<GuestbookDoc>) ?? model<GuestbookDoc>("Guestbook", GuestbookSchema);
