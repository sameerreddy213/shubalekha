/** Shared types for the schema-driven invite/template engine. */

export const SECTION_TYPES = [
  "hero", "blessings", "invitationText", "welcomeMessage", "eventDetails",
  "timeline", "countdown", "familyMembers", "venueMap", "thingsToKnow",
  "ourStory", "gallery", "wishes", "rsvp", "contactCards", "qrCode",
  "socialShare", "addToCalendar", "music", "liveStream", "gift", "closing",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const FIELD_TYPES = [
  "text", "longtext", "richtext", "date", "time", "datetime",
  "image", "gallery", "url", "mapUrl", "phone", "email",
  "color", "select", "list", "audio", "boolean",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const TEMPLATE_CATEGORIES = [
  "hindu", "south-indian", "muslim", "christian", "sikh",
  "engagement", "reception", "housewarming", "birthday",
  "baby-shower", "anniversary", "naming", "corporate",
  "save-the-date", "other",
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  default?: unknown;
  placeholder?: string;
  maxLength?: number;
  options?: FieldOption[];
  group?: string;
  help?: string;
}

export interface SectionDef {
  type: SectionType;
  enabledByDefault: boolean;
  optional: boolean;
  fields: FieldDef[];
  repeatable?: boolean;
  maxItems?: number;
}

export interface ThemePalette {
  bg: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
}

export interface ThemeFonts {
  display: string;
  body: string;
  script?: string;
}

export interface ThemeTokens {
  palette: ThemePalette;
  fonts: ThemeFonts;
  customizable?: { palette?: boolean; fonts?: boolean };
  animationPreset: string;
}

export interface TemplateVariant {
  key: string;
  name: string;
  theme: ThemeTokens;
  previewImage: string;
}

export type InviteStatus = "draft" | "published" | "expired" | "archived";
export type RsvpStatus = "attending" | "not_attending" | "maybe";
export type MealPref = "veg" | "non_veg" | "vegan" | "jain" | "none";

/** content[sectionType] shape stored in Invite.content */
export type InviteContent = Record<string, unknown>;

export interface SectionOverride {
  type: SectionType;
  enabled: boolean;
  order: number;
}
