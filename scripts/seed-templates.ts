/**
 * Seed launch templates into MongoDB.
 *   npm run seed-templates
 * Safe to re-run — upserts by slug, never duplicates.
 *
 * Uses mongoose directly (bypasses "server-only" barrel imports).
 */
import mongoose, { Schema, model, models } from "mongoose";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// ── Minimal Template model (enough for seeding) ───────────────────────────
const TemplateSchema = new Schema({}, { strict: false });
const Template = (models["Template"] as mongoose.Model<mongoose.Document>) ?? model("Template", TemplateSchema);

// ── DB connect ────────────────────────────────────────────────────────────
async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set in .env");
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB ?? "shubalekha",
    serverSelectionTimeoutMS: 10_000,
  });
}

// ── Palette / font helpers ────────────────────────────────────────────────
function palette(bg: string, surface: string, primary: string, accent: string, text: string, muted: string) {
  return { bg, surface, primary, accent, text, muted };
}
function fonts(display: string, body: string, script?: string) {
  return { display, body, ...(script ? { script } : {}) };
}

// ── Section schemas (self-contained, no imports) ──────────────────────────
function weddingSections() {
  return [
    { type: "hero",         key: "hero",         label: "Hero",          fields: [
      { key: "brideName",   type: "text",        label: "Bride name",    required: true  },
      { key: "groomName",   type: "text",        label: "Groom name",    required: true  },
      { key: "tagline",     type: "text",        label: "Tagline",       required: false },
      { key: "heroImage",   type: "image",       label: "Hero photo",    required: false },
    ]},
    { type: "event_details", key: "ceremony", label: "Ceremony details", fields: [
      { key: "date",        type: "date",        label: "Date",          required: true  },
      { key: "time",        type: "text",        label: "Time",          required: true  },
      { key: "venue",       type: "text",        label: "Venue name",    required: true  },
      { key: "address",     type: "longtext",    label: "Address",       required: true  },
      { key: "mapsUrl",     type: "url",         label: "Google Maps URL", required: false },
    ]},
    { type: "event_details", key: "reception", label: "Reception details", fields: [
      { key: "date",        type: "date",        label: "Date",          required: false },
      { key: "time",        type: "text",        label: "Time",          required: false },
      { key: "venue",       type: "text",        label: "Venue name",    required: false },
      { key: "address",     type: "longtext",    label: "Address",       required: false },
    ]},
    { type: "rsvp",         key: "rsvp",         label: "RSVP",          fields: [
      { key: "deadline",    type: "date",        label: "RSVP deadline", required: false },
      { key: "message",     type: "longtext",    label: "Custom message",required: false },
    ]},
    { type: "gallery",      key: "gallery",      label: "Photo gallery", fields: [
      { key: "images",      type: "image",       label: "Photos",        required: false },
    ]},
  ];
}

function engagementSections() {
  return [
    { type: "hero", key: "hero", label: "Hero", fields: [
      { key: "personOneName", type: "text",  label: "Person one name", required: true  },
      { key: "personTwoName", type: "text",  label: "Person two name", required: true  },
      { key: "tagline",       type: "text",  label: "Tagline",         required: false },
      { key: "heroImage",     type: "image", label: "Hero photo",      required: false },
    ]},
    { type: "event_details", key: "event", label: "Event details", fields: [
      { key: "date",    type: "date",     label: "Date",     required: true  },
      { key: "time",    type: "text",     label: "Time",     required: true  },
      { key: "venue",   type: "text",     label: "Venue",    required: true  },
      { key: "address", type: "longtext", label: "Address",  required: true  },
    ]},
    { type: "rsvp", key: "rsvp", label: "RSVP", fields: [
      { key: "deadline", type: "date",     label: "RSVP deadline", required: false },
    ]},
  ];
}

function birthdaySections() {
  return [
    { type: "hero", key: "hero", label: "Hero", fields: [
      { key: "name",      type: "text",  label: "Whose birthday",  required: true  },
      { key: "age",       type: "text",  label: "Age (optional)",  required: false },
      { key: "tagline",   type: "text",  label: "Tagline",         required: false },
      { key: "heroImage", type: "image", label: "Photo",           required: false },
    ]},
    { type: "event_details", key: "party", label: "Party details", fields: [
      { key: "date",    type: "date",     label: "Date",    required: true  },
      { key: "time",    type: "text",     label: "Time",    required: true  },
      { key: "venue",   type: "text",     label: "Venue",   required: true  },
      { key: "address", type: "longtext", label: "Address", required: true  },
    ]},
    { type: "rsvp", key: "rsvp", label: "RSVP", fields: [
      { key: "deadline", type: "date", label: "RSVP deadline", required: false },
    ]},
  ];
}

function saveTheDateSections() {
  return [
    { type: "hero", key: "hero", label: "Hero", fields: [
      { key: "personOneName", type: "text",  label: "Name one",  required: true },
      { key: "personTwoName", type: "text",  label: "Name two",  required: true },
      { key: "heroImage",     type: "image", label: "Photo",     required: false },
    ]},
    { type: "event_details", key: "event", label: "Date & location", fields: [
      { key: "date",     type: "date", label: "The date",     required: true  },
      { key: "location", type: "text", label: "City/location",required: false },
    ]},
  ];
}

function corporateSections() {
  return [
    { type: "hero", key: "hero", label: "Hero", fields: [
      { key: "eventName",  type: "text",     label: "Event name",   required: true  },
      { key: "organiser",  type: "text",     label: "Organiser",    required: false },
      { key: "tagline",    type: "text",     label: "Tagline",      required: false },
      { key: "heroImage",  type: "image",    label: "Banner image", required: false },
    ]},
    { type: "event_details", key: "event", label: "Event details", fields: [
      { key: "date",    type: "date",     label: "Date",    required: true  },
      { key: "time",    type: "text",     label: "Time",    required: true  },
      { key: "venue",   type: "text",     label: "Venue",   required: true  },
      { key: "address", type: "longtext", label: "Address", required: true  },
      { key: "agenda",  type: "longtext", label: "Agenda",  required: false },
    ]},
    { type: "rsvp", key: "rsvp", label: "RSVP", fields: [
      { key: "deadline", type: "date", label: "RSVP deadline", required: false },
    ]},
  ];
}

// ── Template definitions ──────────────────────────────────────────────────
const templates = [
  {
    slug: "hindu-classic-marigold",
    name: "Hindu Wedding — Classic Marigold",
    description: "A celebration of tradition. Rich saffron and deep crimson with gold accents, hand-lettered flourishes, and the warmth of a thousand marigolds.",
    category: "hindu", tags: ["wedding","traditional","hindi","bengali","marathi","punjabi"],
    featured: true, order: 1, sections: weddingSections(), defaultVariantKey: "saffron",
    variants: [{
      key: "saffron", name: "Saffron & Crimson",
      theme: { palette: palette("#FFF8EE","#FFF0D6","#C0392B","#E67E22","#1A0A00","#7D5921"), fonts: fonts("Fraunces","Inter","Dancing Script"), customizable: { palette: true, fonts: false }, animationPreset: "reveal-soft" },
      previewImage: "",
    },{
      key: "turmeric", name: "Turmeric & Jade",
      theme: { palette: palette("#FFFFF0","#F5F0D0","#1A6B4A","#D4AC0D","#0D1B0E","#4A7C59"), fonts: fonts("Fraunces","Inter","Dancing Script"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "hindu-modern-noir",
    name: "Hindu Wedding — Modern Noir",
    description: "Contemporary minimalism meets sacred ritual. Ink-black canvas, champagne gold typography, and restrained geometry for the design-forward couple.",
    category: "hindu", tags: ["wedding","modern","minimal","luxury"],
    featured: false, order: 2, sections: weddingSections(), defaultVariantKey: "noir",
    variants: [{
      key: "noir", name: "Ink & Champagne",
      theme: { palette: palette("#0E0E0E","#1A1A1A","#D4AF37","#F5ECD7","#FAFAFA","#888888"), fonts: fonts("Fraunces","Inter"), customizable: { palette: false, fonts: false }, animationPreset: "cinematic" },
      previewImage: "",
    }],
  },
  {
    slug: "south-indian-kanjivaram",
    name: "South Indian Wedding — Kanjivaram",
    description: "The grandeur of a Kanjivaram silk saree, translated into pixels. Deep zari purple, woven gold borders, and the timeless beauty of temple art.",
    category: "south-indian", tags: ["wedding","tamil","telugu","kannada","silk","traditional"],
    featured: true, order: 3, sections: weddingSections(), defaultVariantKey: "purple-gold",
    variants: [{
      key: "purple-gold", name: "Zari Purple & Gold",
      theme: { palette: palette("#F8F4FF","#EDE5FF","#5B2D8E","#B8860B","#120826","#7B5EA7"), fonts: fonts("Fraunces","Inter","Noto Serif"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    },{
      key: "red-gold", name: "Temple Red & Gold",
      theme: { palette: palette("#FFF5F5","#FFE8E8","#8B0000","#D4AF37","#1A0000","#8B4513"), fonts: fonts("Fraunces","Inter","Noto Serif"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "south-indian-ivory-bloom",
    name: "South Indian Wedding — Ivory Bloom",
    description: "Jasmine garlands and fresh turmeric. Soft ivory, forest green, and the quiet confidence of a Kerala or Tamilian ceremony.",
    category: "south-indian", tags: ["wedding","kerala","tamil","minimal","floral"],
    featured: false, order: 4, sections: weddingSections(), defaultVariantKey: "ivory-green",
    variants: [{
      key: "ivory-green", name: "Ivory & Forest Green",
      theme: { palette: palette("#FDFAF5","#F5EDD9","#1A5C3A","#D4AC0D","#1A1208","#5C8B6E"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "muslim-emerald-garden",
    name: "Nikah — Emerald Garden",
    description: "The serenity of a garden in paradise. Deep emerald, warm ivory, and rose gold accents inspired by the intricate geometry of Islamic architecture.",
    category: "muslim", tags: ["nikah","muslim","islamic","traditional","urdu"],
    featured: true, order: 5, sections: weddingSections(), defaultVariantKey: "emerald",
    variants: [{
      key: "emerald", name: "Emerald & Rose Gold",
      theme: { palette: palette("#F2FAF5","#E0F5EA","#0D5C3A","#B76E79","#071A0E","#4A8B6A"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "muslim-midnight-crescent",
    name: "Nikah — Midnight Crescent",
    description: "Midnight blue like the sky above the Kaaba. Silver stars, white calligraphy, and the quiet elegance of a moonlit celebration.",
    category: "muslim", tags: ["nikah","muslim","islamic","dark","luxury"],
    featured: false, order: 6, sections: weddingSections(), defaultVariantKey: "midnight",
    variants: [{
      key: "midnight", name: "Midnight Blue & Silver",
      theme: { palette: palette("#F5F7FF","#E8EDFF","#0A1C5A","#C0C0C0","#050D2A","#4A5580"), fonts: fonts("Fraunces","Inter"), customizable: { palette: false }, animationPreset: "cinematic" },
      previewImage: "",
    }],
  },
  {
    slug: "christian-chapel-white",
    name: "Christian Wedding — Chapel White",
    description: "Pure white roses, warm candlelight. The simplicity of a chapel wedding: ivory, forest green, and the grace of a vow.",
    category: "christian", tags: ["wedding","christian","goa","kerala","church","floral"],
    featured: true, order: 7, sections: weddingSections(), defaultVariantKey: "chapel",
    variants: [{
      key: "chapel", name: "Ivory & Forest Green",
      theme: { palette: palette("#FDFCFA","#F5F0E8","#2C5F2E","#8B6914","#1A1208","#6B7C6B"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "christian-coastal",
    name: "Christian Wedding — Coastal Blue",
    description: "For the Goan beach wedding or Kerala backwater ceremony. Calm sky blue, white, and a hint of sand and sea breeze.",
    category: "christian", tags: ["wedding","christian","goa","beach","coastal","summer"],
    featured: false, order: 8, sections: weddingSections(), defaultVariantKey: "coastal",
    variants: [{
      key: "coastal", name: "Sky Blue & White",
      theme: { palette: palette("#F0F8FF","#E0F0FF","#1B6CA8","#D4AC0D","#0A2A4A","#5A8FAA"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "sikh-golden-amritsar",
    name: "Anand Karaj — Golden Amritsar",
    description: "The golden radiance of the Harmandir Sahib. Royal blue, deep gold, and the joyful spirit of a Punjabi celebration.",
    category: "sikh", tags: ["anand-karaj","sikh","punjabi","golden","traditional"],
    featured: true, order: 9, sections: weddingSections(), defaultVariantKey: "golden",
    variants: [{
      key: "golden", name: "Royal Blue & Gold",
      theme: { palette: palette("#FFFBF0","#FFF3D0","#1A3A6B","#D4AF37","#0A1428","#5A7AAA"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "engagement-rose-minimal",
    name: "Engagement — Rose Minimal",
    description: "A ring, a promise, a moment. Dusty rose, warm slate, and delicate gold for the ring ceremony or roka.",
    category: "engagement", tags: ["engagement","ring-ceremony","roka","minimal","rose"],
    featured: true, order: 10, sections: engagementSections(), defaultVariantKey: "rose",
    variants: [{
      key: "rose", name: "Dusty Rose & Slate",
      theme: { palette: palette("#FFF5F7","#FFE8EE","#C2185B","#D4AF37","#2A0A14","#A0607A"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "engagement-modern-abstract",
    name: "Engagement — Modern Abstract",
    description: "Bold geometry, curated palette. For the couple who appreciates contemporary art and does not want anything predictable.",
    category: "engagement", tags: ["engagement","modern","abstract","minimal","bold"],
    featured: false, order: 11, sections: engagementSections(), defaultVariantKey: "indigo",
    variants: [{
      key: "indigo", name: "Indigo & Terracotta",
      theme: { palette: palette("#F5F5FF","#EBEBFF","#2D2B8F","#C4622D","#0A0A2A","#7070C0"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "cinematic" },
      previewImage: "",
    }],
  },
  {
    slug: "birthday-celebration-bold",
    name: "Birthday — Celebration Bold",
    description: "For the birthday that deserves a grand entrance. Vibrant coral, deep navy, and gold for milestone celebrations.",
    category: "birthday", tags: ["birthday","milestone","celebration","adult","bold"],
    featured: true, order: 12, sections: birthdaySections(), defaultVariantKey: "coral",
    variants: [{
      key: "coral", name: "Coral & Navy",
      theme: { palette: palette("#FFF5F2","#FFE8E0","#0D2B5E","#FF6B47","#080F1F","#3D6B9E"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "playful" },
      previewImage: "",
    }],
  },
  {
    slug: "birthday-pastel-garden",
    name: "Birthday — Pastel Garden",
    description: "Soft and joyful. For kids' parties, baby's first birthday, or anyone who loves mint, lavender, and soft pink together.",
    category: "birthday", tags: ["birthday","kids","pastel","first-birthday","playful"],
    featured: false, order: 13, sections: birthdaySections(), defaultVariantKey: "pastel",
    variants: [{
      key: "pastel", name: "Mint, Lavender & Blush",
      theme: { palette: palette("#F5FFFE","#E8FFF9","#7B5EA7","#FF8FAB","#1A0A2E","#8B88C0"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "playful" },
      previewImage: "",
    }],
  },
  {
    slug: "save-the-date-minimal",
    name: "Save the Date — Minimal",
    description: "Just the essentials, beautifully composed. Charcoal, off-white, and a single accent colour for a teaser that leaves them wanting more.",
    category: "save-the-date", tags: ["save-the-date","minimal","elegant","clean"],
    featured: true, order: 14, sections: saveTheDateSections(), defaultVariantKey: "charcoal",
    variants: [{
      key: "charcoal", name: "Charcoal & Saffron",
      theme: { palette: palette("#FAFAFA","#F0F0F0","#1F1F1F","#E07B00","#0A0A0A","#888888"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "save-the-date-botanical",
    name: "Save the Date — Botanical",
    description: "Forest leaves and wild blooms. For the outdoor or nature-loving celebration, in deep green, cream, and blush.",
    category: "save-the-date", tags: ["save-the-date","botanical","nature","outdoor","floral"],
    featured: false, order: 15, sections: saveTheDateSections(), defaultVariantKey: "botanical",
    variants: [{
      key: "botanical", name: "Forest & Blush",
      theme: { palette: palette("#F5FAF5","#E8F5E8","#1A4A1A","#E8A598","#071407","#5A8A5A"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "anniversary-silver",
    name: "Anniversary — Silver Edition",
    description: "Twenty-five years of love deserves something timeless. Silver, slate, and warm white with editorial typography.",
    category: "anniversary", tags: ["anniversary","silver","25th","elegant","mature"],
    featured: false, order: 16, sections: engagementSections(), defaultVariantKey: "silver",
    variants: [{
      key: "silver", name: "Silver & Slate",
      theme: { palette: palette("#F8F9FA","#EEEFF2","#3D4A5C","#9DA8B7","#1A1F28","#6A7A8C"), fonts: fonts("Fraunces","Inter"), customizable: { palette: false }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "baby-shower-soft-bloom",
    name: "Baby Shower — Soft Bloom",
    description: "Cloud blue and soft blush for the newest arrival. Gentle, warm, and full of anticipation.",
    category: "baby-shower", tags: ["baby-shower","new-baby","pastel","soft","floral"],
    featured: false, order: 17, sections: engagementSections(), defaultVariantKey: "bloom",
    variants: [{
      key: "bloom", name: "Cloud & Blush",
      theme: { palette: palette("#F5F9FF","#E8F2FF","#4A7EC0","#F5A0B0","#0A1428","#7AACCF"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "playful" },
      previewImage: "",
    }],
  },
  {
    slug: "housewarming-warm-welcome",
    name: "Housewarming — Warm Welcome",
    description: "A home is where the heart is. Terracotta, sage, and warm linen for griha pravesh and housewarming celebrations.",
    category: "housewarming", tags: ["housewarming","griha-pravesh","home","warm","terracotta"],
    featured: false, order: 18, sections: engagementSections(), defaultVariantKey: "terracotta",
    variants: [{
      key: "terracotta", name: "Terracotta & Sage",
      theme: { palette: palette("#FDF8F5","#F5EDE5","#B45309","#4A7C59","#2A1A0A","#A0785A"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "mehendi-henna-garden",
    name: "Mehendi — Henna Garden",
    description: "Intricate henna patterns, saffron-lit evenings, and the scent of jasmine. A vibrant template for the mehendi ceremony.",
    category: "hindu", tags: ["mehendi","henna","pre-wedding","fun","vibrant"],
    featured: false, order: 19, sections: engagementSections(), defaultVariantKey: "henna",
    variants: [{
      key: "henna", name: "Saffron & Deep Green",
      theme: { palette: palette("#FFFAEE","#FFF0CC","#0D5C3A","#E07B00","#0A1E0D","#5C8B6A"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "playful" },
      previewImage: "",
    }],
  },
  {
    slug: "sangeet-neon-bollywood",
    name: "Sangeet — Neon Bollywood",
    description: "Lights, camera, dhol. Electric pink, midnight black, and gold sequins for the sangeet night.",
    category: "hindu", tags: ["sangeet","pre-wedding","party","dance","bollywood","neon"],
    featured: false, order: 20, sections: engagementSections(), defaultVariantKey: "neon",
    variants: [{
      key: "neon", name: "Electric Pink & Midnight",
      theme: { palette: palette("#FFF0FA","#FFD6F5","#0A0A14","#FF1A8C","#050508","#CC44AA"), fonts: fonts("Fraunces","Inter"), customizable: { palette: false }, animationPreset: "cinematic" },
      previewImage: "",
    }],
  },
  {
    slug: "corporate-slate",
    name: "Corporate Event — Slate & White",
    description: "Professional and polished. For product launches, conferences, and corporate gatherings that should feel premium.",
    category: "corporate", tags: ["corporate","event","professional","launch","conference"],
    featured: false, order: 21, sections: corporateSections(), defaultVariantKey: "slate",
    variants: [{
      key: "slate", name: "Slate & Cobalt",
      theme: { palette: palette("#F8FAFC","#EEF2F7","#1E3A5F","#2563EB","#0A1520","#5A7A9A"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "reveal-soft" },
      previewImage: "",
    }],
  },
  {
    slug: "festival-diwali-glow",
    name: "Festival — Diwali Glow",
    description: "The festival of lights, captured in an invitation. Deep crimson, burnished gold, and the warmth of a thousand diyas.",
    category: "other", tags: ["festival","diwali","celebration","lights","gold","crimson"],
    featured: false, order: 22, sections: engagementSections(), defaultVariantKey: "diwali",
    variants: [{
      key: "diwali", name: "Crimson & Gold",
      theme: { palette: palette("#FFF5F0","#FFE8D6","#8B0000","#D4AF37","#1A0000","#AA4444"), fonts: fonts("Fraunces","Inter"), customizable: { palette: true }, animationPreset: "cinematic" },
      previewImage: "",
    }],
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("Connecting to MongoDB…");
  await connect();

  let created = 0;
  let updated = 0;

  for (const tpl of templates) {
    const result = await Template.updateOne(
      { slug: tpl.slug },
      { $set: { ...tpl, status: "published", version: 1 } },
      { upsert: true },
    );
    if (result.upsertedCount) { console.log(`  + created  ${tpl.slug}`); created++; }
    else                      { console.log(`  ~ updated  ${tpl.slug}`); updated++; }
  }

  console.log(`\nDone — ${created} created, ${updated} updated (${templates.length} total).`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
