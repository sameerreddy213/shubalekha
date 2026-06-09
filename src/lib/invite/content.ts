import "server-only";
import type { SectionDef, InviteContent } from "@/types/invite";

/** Seed invite content with template field defaults. */
export function seedContentFromTemplate(sections: SectionDef[]): InviteContent {
  const content: InviteContent = {};
  for (const section of sections) {
    if (section.repeatable) {
      content[section.type] = [];
    } else {
      const sectionContent: Record<string, unknown> = {};
      for (const field of section.fields) {
        if (field.default !== undefined) {
          sectionContent[field.key] = field.default;
        }
      }
      content[section.type] = sectionContent;
    }
  }
  return content;
}

/** Validate that required fields are present in submitted content. Returns error map. */
export function validateContent(
  content: InviteContent,
  sections: SectionDef[],
  sectionOverrides: { type: string; enabled: boolean }[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const overrideMap = Object.fromEntries(sectionOverrides.map((o) => [o.type, o.enabled]));

  for (const section of sections) {
    const enabled = overrideMap[section.type] ?? section.enabledByDefault;
    if (!enabled) continue;
    if (section.repeatable) continue; // repeatable validation is more lenient

    const sectionContent = (content[section.type] ?? {}) as Record<string, unknown>;
    for (const field of section.fields) {
      if (!field.required) continue;
      const val = sectionContent[field.key];
      if (val === undefined || val === null || val === "") {
        errors[`${section.type}.${field.key}`] = `${field.label} is required`;
      }
    }
  }
  return errors;
}

/** Strip any content keys not declared in the template (defense against extra fields). */
export function sanitizeContent(
  content: InviteContent,
  sections: SectionDef[],
): InviteContent {
  const allowed = new Set(sections.map((s) => s.type));
  const sanitized: InviteContent = {};
  for (const [k, v] of Object.entries(content)) {
    if (allowed.has(k as never)) sanitized[k] = v;
  }
  return sanitized;
}
