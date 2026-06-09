import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SectionOverrideSchema = new Schema(
  {
    type:    { type: String, required: true },
    enabled: { type: Boolean, default: true },
    order:   { type: Number, default: 0 },
  },
  { _id: false },
);

const InviteSchema = new Schema(
  {
    ownerId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    collaborators: {
      type: [{
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        role:   { type: String, enum: ["editor", "viewer"] },
      }],
      default: [],
    },

    templateId:      { type: Schema.Types.ObjectId, ref: "Template", required: true, index: true },
    templateVersion: { type: Number, required: true },
    variantKey:      { type: String, default: "default" },

    slug:   { type: String, lowercase: true, trim: true, match: /^[a-z0-9-]{3,63}$/, default: null },
    status: { type: String, enum: ["draft", "published", "expired", "archived"],
              default: "draft", index: true },

    content:          { type: Schema.Types.Mixed, default: {} },
    sectionOverrides: { type: [SectionOverrideSchema], default: [] },
    themeOverrides:   { palette: Schema.Types.Mixed, fonts: Schema.Types.Mixed },

    music: {
      url:     { type: String },
      title:   { type: String },
      enabled: { type: Boolean, default: false },
    },

    eventDate:     { type: Date, index: true },
    timezone:      { type: String, default: "Asia/Kolkata" },
    publishedAt:   { type: Date },
    expiresAt:     { type: Date, index: true },
    slugReleaseAt: { type: Date, index: true },

    rsvpEnabled:      { type: Boolean, default: true },
    guestbookEnabled: { type: Boolean, default: true },
    perEventRsvp:     { type: Boolean, default: false },
    giftEnabled:      { type: Boolean, default: false },

    ogVersion: { type: Number, default: 1 },
    seo: {
      title:       { type: String },
      description: { type: String },
      ogImageUrl:  { type: String },
    },

    stats: {
      views:          { type: Number, default: 0 },
      uniqueVisitors: { type: Number, default: 0 },
      rsvpYes:        { type: Number, default: 0 },
      rsvpNo:         { type: Number, default: 0 },
      rsvpMaybe:      { type: Number, default: 0 },
    },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Partial-unique index: slug is unique only while published or expired (not for drafts/null)
InviteSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $type: "string" },
      status: { $in: ["published", "expired"] },
    },
  },
);
InviteSchema.index({ ownerId: 1, status: 1, updatedAt: -1 });

export type InviteDoc = InferSchemaType<typeof InviteSchema>;

export const Invite: Model<InviteDoc> =
  (models.Invite as Model<InviteDoc>) ?? model<InviteDoc>("Invite", InviteSchema);
