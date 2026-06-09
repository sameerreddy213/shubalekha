import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const RsvpSchema = new Schema(
  {
    inviteId:    { type: Schema.Types.ObjectId, ref: "Invite", required: true, index: true },
    guestLinkId: { type: Schema.Types.ObjectId, ref: "GuestLink", default: null },
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    email:       { type: String, lowercase: true, trim: true,
                   match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, default: null },
    phone:       { type: String, trim: true, match: /^[0-9+\-\s()]{6,20}$/, default: null },
    status:      { type: String, enum: ["attending", "not_attending", "maybe"], required: true },
    partySize:   { type: Number, min: 1, max: 50, default: 1 },
    meal:        { type: String, enum: ["veg", "non_veg", "vegan", "jain", "none"], default: "none" },
    message:     { type: String, maxlength: 500 },
    events: {
      type: [{
        eventKey: { type: String },
        status:   { type: String, enum: ["attending", "not_attending", "maybe"] },
      }],
      default: [],
    },
    dedupeKey: { type: String, required: true },
    editToken: { type: String, required: true, index: true },
    source:    { type: String, default: "direct" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// dedupe: one RSVP per (invite × fingerprint)
RsvpSchema.index({ inviteId: 1, dedupeKey: 1 }, { unique: true });
RsvpSchema.index({ guestLinkId: 1 });

export type RsvpDoc = InferSchemaType<typeof RsvpSchema>;

export const Rsvp: Model<RsvpDoc> =
  (models.Rsvp as Model<RsvpDoc>) ?? model<RsvpDoc>("Rsvp", RsvpSchema);
