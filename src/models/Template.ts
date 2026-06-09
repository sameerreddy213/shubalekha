import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import {
  SECTION_TYPES, FIELD_TYPES, TEMPLATE_CATEGORIES,
} from "@/types/invite";

const FieldOptionSchema = new Schema(
  { label: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false },
);

const FieldDefSchema = new Schema(
  {
    key:         { type: String, required: true },
    label:       { type: String, required: true },
    type:        { type: String, enum: FIELD_TYPES, required: true },
    required:    { type: Boolean, default: false },
    default:     { type: Schema.Types.Mixed },
    placeholder: { type: String },
    maxLength:   { type: Number },
    options:     { type: [FieldOptionSchema], default: [] },
    group:       { type: String },
    help:        { type: String },
  },
  { _id: false },
);

const SectionDefSchema = new Schema(
  {
    type:             { type: String, enum: SECTION_TYPES, required: true },
    enabledByDefault: { type: Boolean, default: true },
    optional:         { type: Boolean, default: false },
    fields:           { type: [FieldDefSchema], default: [] },
    repeatable:       { type: Boolean, default: false },
    maxItems:         { type: Number },
  },
  { _id: false },
);

const ThemePaletteSchema = new Schema(
  {
    bg: String, surface: String, primary: String,
    accent: String, text: String, muted: String,
  },
  { _id: false },
);

const ThemeFontsSchema = new Schema(
  { display: String, body: String, script: String },
  { _id: false },
);

const ThemeTokensSchema = new Schema(
  {
    palette:         { type: ThemePaletteSchema },
    fonts:           { type: ThemeFontsSchema },
    customizable:    { type: Schema.Types.Mixed },
    animationPreset: { type: String, default: "reveal-soft" },
  },
  { _id: false },
);

const TemplateVariantSchema = new Schema(
  {
    key:          { type: String, required: true },
    name:         { type: String, required: true },
    theme:        { type: ThemeTokensSchema },
    previewImage: { type: String, default: "" },
  },
  { _id: false },
);

const TemplateSchema = new Schema(
  {
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true,
                   match: /^[a-z0-9-]+$/ },
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 500 },
    category:    { type: String, required: true, index: true, enum: TEMPLATE_CATEGORIES },
    tags:        { type: [String], default: [] },
    status:      { type: String, enum: ["draft", "published"], default: "draft", index: true },
    featured:    { type: Boolean, default: false, index: true },
    order:       { type: Number, default: 0 },
    sections:    { type: [SectionDefSchema], required: true, default: [] },
    variants:    { type: [TemplateVariantSchema], required: true, default: [] },
    defaultVariantKey: { type: String, default: "default" },
    previewImage:{ type: String },
    demoSlug:    { type: String },
    createdBy:   { type: Schema.Types.ObjectId, ref: "User" },
    version:     { type: Number, default: 1 },
  },
  { timestamps: true },
);

TemplateSchema.index({ status: 1, featured: -1, order: 1 });

export type TemplateDoc = InferSchemaType<typeof TemplateSchema>;

export const Template: Model<TemplateDoc> =
  (models.Template as Model<TemplateDoc>) ?? model<TemplateDoc>("Template", TemplateSchema);
