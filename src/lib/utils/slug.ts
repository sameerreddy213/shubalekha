import { isReservedSlug } from "@/config/reserved-slugs";

export const SLUG_MIN = 3;
export const SLUG_MAX = 63;

/** Slug format: lowercase a-z 0-9 and single hyphens; no leading/trailing/double hyphen. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SlugCheckReason = "invalid" | "too_short" | "too_long" | "reserved";

export interface SlugValidation {
  ok: boolean;
  reason?: SlugCheckReason;
}

/** Pure format + reserved-word validation (no DB). */
export function validateSlugFormat(input: string): SlugValidation {
  const slug = input.trim().toLowerCase();
  if (slug.length < SLUG_MIN) return { ok: false, reason: "too_short" };
  if (slug.length > SLUG_MAX) return { ok: false, reason: "too_long" };
  if (!SLUG_RE.test(slug)) return { ok: false, reason: "invalid" };
  if (isReservedSlug(slug)) return { ok: false, reason: "reserved" };
  return { ok: true };
}

/** Best-effort normalization of arbitrary text into a candidate slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, SLUG_MAX);
}
