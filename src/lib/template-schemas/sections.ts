/**
 * Reusable section definition builders for the schema-driven template engine.
 * Every template is assembled from these blocks.
 */
import type { SectionDef, FieldDef, SectionType } from "@/types/invite";

// ── Field builders ────────────────────────────────────────────────────────────

export function textField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "text", ...opts };
}
export function longtextField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "longtext", ...opts };
}
export function richtextField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "richtext", ...opts };
}
export function dateField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "date", ...opts };
}
export function timeField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "time", ...opts };
}
export function datetimeField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "datetime", ...opts };
}
export function imageField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "image", ...opts };
}
export function galleryField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "gallery", ...opts };
}
export function urlField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "url", ...opts };
}
export function mapUrlField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "mapUrl", ...opts };
}
export function audioField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "audio", ...opts };
}
export function booleanField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "boolean", ...opts };
}
export function listField(key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef {
  return { key, label, type: "list", ...opts };
}

// ── Section builders ──────────────────────────────────────────────────────────

function section(
  type: SectionType,
  fields: FieldDef[],
  opts: Partial<Omit<SectionDef, "type" | "fields">> = {},
): SectionDef {
  // key defaults to type so every section has a unique-within-template identifier
  return { type, key: type, enabledByDefault: true, optional: false, fields, ...opts };
}

export const heroSection = (): SectionDef =>
  section("hero", [
    textField("groomName", "Groom / Person 1 name", { required: true, placeholder: "Aarav" }),
    textField("brideName", "Bride / Person 2 name", { required: true, placeholder: "Meera" }),
    textField("tagline", "Tagline", { placeholder: "Together with their families…" }),
    imageField("heroImage", "Hero / Cover photo"),
  ]);

export const blessingsSection = (): SectionDef =>
  section(
    "blessings",
    [
      longtextField("verse", "Blessing verse", {
        placeholder: "Enter a prayer, shlokas, or blessings for the couple…",
      }),
      textField("source", "Source / Scripture", { placeholder: "Rigveda 10.85" }),
    ],
    { optional: true },
  );

export const invitationTextSection = (): SectionDef =>
  section("invitationText", [
    richtextField("body", "Invitation text", {
      required: true,
      placeholder: "Together with their families, we joyfully invite you…",
    }),
  ]);

export const welcomeMessageSection = (): SectionDef =>
  section(
    "welcomeMessage",
    [
      textField("title", "Section heading", { placeholder: "A warm welcome" }),
      longtextField("body", "Welcome message", {
        placeholder: "We are delighted to celebrate this special occasion with you…",
      }),
      textField("hostNames", "Host names", { placeholder: "The Sharma & Patel Families" }),
    ],
    { optional: true },
  );

export const eventDetailsSection = (): SectionDef =>
  section("eventDetails", [
    textField("eventName", "Ceremony name", { required: true, placeholder: "Wedding Ceremony" }),
    dateField("date", "Date", { required: true }),
    timeField("time", "Time", { required: true }),
    textField("venue", "Venue name", { required: true, placeholder: "The Grand Ballroom" }),
    textField("address", "Address", { placeholder: "123 MG Road, Bengaluru" }),
    textField("dresscode", "Dress code", { placeholder: "Traditional / Smart Casual" }),
  ]);

export const timelineSection = (): SectionDef =>
  section(
    "timeline",
    [
      textField("title", "Section title", { placeholder: "Schedule of events" }),
      listField("events", "Events", {
        help: "One event per line: Time — Event name (e.g. 6:00 PM — Jaimala ceremony)",
      }),
    ],
    { optional: true },
  );

export const countdownSection = (): SectionDef =>
  section(
    "countdown",
    [datetimeField("targetDate", "Target date and time", { required: true })],
    { optional: true },
  );

export const familyMembersSection = (): SectionDef =>
  section(
    "familyMembers",
    [
      textField("groomFamilyTitle", "Groom's family heading", { placeholder: "Groom's family" }),
      textField("groomFamily", "Groom's family members", {
        placeholder: "Son of Mr. Ramesh & Mrs. Sunita Sharma",
      }),
      textField("brideFamilyTitle", "Bride's family heading", { placeholder: "Bride's family" }),
      textField("brideFamily", "Bride's family members", {
        placeholder: "Daughter of Mr. Vijay & Mrs. Kavitha Patel",
      }),
    ],
    { optional: true },
  );

export const venueMapSection = (): SectionDef =>
  section(
    "venueMap",
    [
      textField("venueName", "Venue name", { required: true }),
      textField("address", "Full address", { required: true }),
      mapUrlField("mapUrl", "Google Maps link"),
      longtextField("directions", "Getting there", {
        placeholder: "Take the metro to MG Road station, exit Gate 2…",
      }),
    ],
    { optional: true },
  );

export const thingsToKnowSection = (): SectionDef =>
  section(
    "thingsToKnow",
    [
      textField("title", "Section heading", { placeholder: "Good to know" }),
      listField("items", "Items", {
        help: "One tip per line: e.g. 'Parking available on-site'",
      }),
    ],
    { optional: true },
  );

export const ourStorySection = (): SectionDef =>
  section(
    "ourStory",
    [
      textField("title", "Section title", { placeholder: "How we met" }),
      richtextField("story", "Your story", {
        placeholder: "Write about how you met, your journey together…",
        maxLength: 2000,
      }),
      imageField("storyImage", "Story photo (optional)"),
    ],
    { optional: true },
  );

export const gallerySection = (): SectionDef =>
  section(
    "gallery",
    [
      textField("title", "Gallery title", { placeholder: "Our moments" }),
      galleryField("images", "Photos", { help: "Upload up to 20 photos" }),
    ],
    { optional: true },
  );

export const wishesSection = (): SectionDef =>
  section(
    "wishes",
    [
      textField("title", "Section heading", { placeholder: "Leave a wish" }),
      booleanField("enabled", "Enable guestbook / wishes wall", { default: true }),
    ],
    { optional: true },
  );

export const rsvpSection = (): SectionDef =>
  section("rsvp", [
    textField("title", "Section heading", { placeholder: "Will you join us?" }),
    dateField("deadline", "RSVP deadline"),
    longtextField("note", "Note to guests", {
      placeholder: "Kindly respond by the 10th. For queries, contact…",
    }),
  ]);

export const contactCardsSection = (): SectionDef =>
  section(
    "contactCards",
    [
      textField("title", "Section title", { placeholder: "Get in touch" }),
      textField("contact1Name", "Contact 1 — name"),
      textField("contact1Role", "Contact 1 — role", { placeholder: "Event coordinator" }),
      textField("contact1Phone", "Contact 1 — phone"),
      textField("contact2Name", "Contact 2 — name"),
      textField("contact2Role", "Contact 2 — role"),
      textField("contact2Phone", "Contact 2 — phone"),
    ],
    { optional: true },
  );

export const socialShareSection = (): SectionDef =>
  section(
    "socialShare",
    [textField("hashtag", "Wedding hashtag", { placeholder: "#AaravWedsMeera" })],
    { optional: true },
  );

export const addToCalendarSection = (): SectionDef =>
  section(
    "addToCalendar",
    [longtextField("note", "Calendar note", { placeholder: "Save the date!" })],
    { optional: true },
  );

export const musicSection = (): SectionDef =>
  section(
    "music",
    [
      audioField("audioUrl", "Background music (audio URL or upload)"),
      textField("trackName", "Track name", { placeholder: "Tera Ban Jaunga" }),
      booleanField("autoplay", "Autoplay (muted until user interacts)", { default: false }),
    ],
    { optional: true },
  );

export const liveStreamSection = (): SectionDef =>
  section(
    "liveStream",
    [
      urlField("streamUrl", "Live stream URL"),
      longtextField("note", "Note for viewers", {
        placeholder: "Watch the ceremony live from anywhere in the world.",
      }),
    ],
    { optional: true },
  );

export const giftSection = (): SectionDef =>
  section(
    "gift",
    [
      urlField("registryUrl", "Gift registry URL"),
      longtextField("note", "Gift message", {
        placeholder: "Your presence is our greatest gift. If you wish to contribute…",
      }),
    ],
    { optional: true },
  );

export const closingSection = (): SectionDef =>
  section("closing", [
    longtextField("message", "Closing message", {
      placeholder: "We look forward to celebrating this joyous occasion with you.",
    }),
    textField("signature", "Signature", { placeholder: "With love, Aarav & Meera" }),
    imageField("closingImage", "Closing photo (optional)"),
  ]);

// ── Preset section lists ──────────────────────────────────────────────────────

/** Full Indian wedding: all sections in natural order */
export function weddingSections(): SectionDef[] {
  return [
    heroSection(),
    blessingsSection(),
    invitationTextSection(),
    familyMembersSection(),
    eventDetailsSection(),
    timelineSection(),
    countdownSection(),
    venueMapSection(),
    thingsToKnowSection(),
    ourStorySection(),
    gallerySection(),
    musicSection(),
    rsvpSection(),
    wishesSection(),
    contactCardsSection(),
    socialShareSection(),
    addToCalendarSection(),
    liveStreamSection(),
    closingSection(),
  ];
}

/** Engagement / reception: lighter set */
export function engagementSections(): SectionDef[] {
  return [
    heroSection(),
    invitationTextSection(),
    eventDetailsSection(),
    countdownSection(),
    venueMapSection(),
    gallerySection(),
    rsvpSection(),
    wishesSection(),
    socialShareSection(),
    addToCalendarSection(),
    closingSection(),
  ];
}

/** Birthday / celebration: fun set */
export function birthdaySections(): SectionDef[] {
  return [
    heroSection(),
    invitationTextSection(),
    eventDetailsSection(),
    countdownSection(),
    venueMapSection(),
    thingsToKnowSection(),
    gallerySection(),
    rsvpSection(),
    wishesSection(),
    musicSection(),
    socialShareSection(),
    addToCalendarSection(),
    closingSection(),
  ];
}

/** Save the date: minimal */
export function saveTheDateSections(): SectionDef[] {
  return [
    heroSection(),
    invitationTextSection(),
    eventDetailsSection(),
    countdownSection(),
    socialShareSection(),
    addToCalendarSection(),
    closingSection(),
  ];
}

/** Corporate / neutral: functional */
export function corporateSections(): SectionDef[] {
  return [
    heroSection(),
    invitationTextSection(),
    eventDetailsSection(),
    venueMapSection(),
    thingsToKnowSection(),
    rsvpSection(),
    contactCardsSection(),
    addToCalendarSection(),
    closingSection(),
  ];
}
