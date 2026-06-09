import "server-only";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Invite, Template, type InviteDoc, type TemplateDoc } from "@/models";
import { isReservedSlug } from "@/config/reserved-slugs";
import { validateSlugFormat } from "@/lib/utils/slug";
import { isSlugLocked } from "@/lib/redis";
import { seedContentFromTemplate, validateContent, sanitizeContent } from "@/lib/invite/content";
import { computeLifecycleDates } from "@/lib/invite/lifecycle";
import { revalidateTag } from "next/cache";
import type { InviteContent, SectionOverride } from "@/types/invite";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateInviteInput {
  templateId: string;
  variantKey?: string;
  ownerId: string;
}

export interface SaveInviteInput {
  inviteId: string;
  ownerId: string;
  content?: InviteContent;
  sectionOverrides?: SectionOverride[];
  themeOverrides?: { palette?: Record<string, string>; fonts?: Record<string, string> };
  music?: { url?: string; title?: string; enabled?: boolean };
  eventDate?: string;
  timezone?: string;
  rsvpEnabled?: boolean;
  guestbookEnabled?: boolean;
  giftEnabled?: boolean;
  seo?: { title?: string; description?: string };
}

export interface PublishInviteInput {
  inviteId: string;
  ownerId: string;
  slug: string;
}

export interface ListInvitesInput {
  ownerId: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getInviteById(id: string, ownerId?: string) {
  await dbConnect();
  if (!Types.ObjectId.isValid(id)) return null;
  const query: Record<string, unknown> = { _id: id, deletedAt: null };
  if (ownerId) query.ownerId = new Types.ObjectId(ownerId);
  return Invite.findOne(query).populate("templateId").lean();
}

export async function listInvites({ ownerId, status, page = 1, limit = 20 }: ListInvitesInput) {
  await dbConnect();
  const filter: Record<string, unknown> = {
    ownerId: new Types.ObjectId(ownerId),
    deletedAt: null,
  };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Invite.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Invite.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createInvite({ templateId, variantKey = "default", ownerId }: CreateInviteInput) {
  await dbConnect();

  if (!Types.ObjectId.isValid(templateId)) throw new Error("Invalid templateId");

  const template = await Template.findById(templateId).lean() as TemplateDoc & { _id: Types.ObjectId } | null;
  if (!template) throw new Error("Template not found");
  if (template.status !== "published") throw new Error("Template is not published");

  // Enforce per-user invite cap (check Settings in prod; use 50 default here)
  const count = await Invite.countDocuments({ ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (count >= 50) throw new Error("LIMIT_REACHED");

  const sections = template.sections as unknown as import("@/types/invite").SectionDef[];
  const content = seedContentFromTemplate(sections);

  const invite = await Invite.create({
    ownerId: new Types.ObjectId(ownerId),
    templateId: template._id,
    templateVersion: template.version,
    variantKey,
    content,
    status: "draft",
  });

  return { inviteId: invite._id.toString() };
}

// ---------------------------------------------------------------------------
// Save (autosave / manual save)
// ---------------------------------------------------------------------------

export async function saveInvite(input: SaveInviteInput) {
  await dbConnect();

  const invite = await Invite.findOne({
    _id: input.inviteId,
    ownerId: new Types.ObjectId(input.ownerId),
    deletedAt: null,
  });
  if (!invite) throw new Error("NOT_FOUND");
  if (invite.status === "archived") throw new Error("ARCHIVED");

  if (input.content !== undefined) {
    // Sanitize: only keep known section keys from the template schema
    const template = await Template.findById(invite.templateId).lean() as TemplateDoc | null;
    if (template) {
      const sections = template.sections as unknown as import("@/types/invite").SectionDef[];
      invite.content = sanitizeContent(input.content, sections);
    } else {
      invite.content = input.content;
    }
  }
  if (input.sectionOverrides !== undefined) invite.sectionOverrides = input.sectionOverrides as never;
  if (input.themeOverrides !== undefined) invite.themeOverrides = input.themeOverrides as never;
  if (input.music !== undefined) invite.music = input.music as never;
  if (input.eventDate !== undefined) invite.eventDate = new Date(input.eventDate);
  if (input.timezone !== undefined) invite.timezone = input.timezone;
  if (input.rsvpEnabled !== undefined) invite.rsvpEnabled = input.rsvpEnabled;
  if (input.guestbookEnabled !== undefined) invite.guestbookEnabled = input.guestbookEnabled;
  if (input.giftEnabled !== undefined) invite.giftEnabled = input.giftEnabled;
  if (input.seo !== undefined) invite.seo = input.seo as never;

  await invite.save();

  // If already published, bust the ISR cache
  if (invite.status === "published" && invite.slug) {
    revalidateTag(`invite:${invite.slug}`);
  }

  return { inviteId: invite._id.toString() };
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export async function publishInvite({ inviteId, ownerId, slug }: PublishInviteInput) {
  await dbConnect();

  const invite = await Invite.findOne({
    _id: inviteId,
    ownerId: new Types.ObjectId(ownerId),
    deletedAt: null,
  }).populate("templateId");
  if (!invite) throw new Error("NOT_FOUND");
  if (!["draft", "published"].includes(invite.status as string)) throw new Error("INVALID_STATUS");

  // Validate slug
  const slugCheck = validateSlugFormat(slug);
  if (!slugCheck.ok) throw new Error(`INVALID_SLUG:${slugCheck.reason}`);
  if (isReservedSlug(slug)) throw new Error("SLUG_RESERVED");
  if (await isSlugLocked(slug)) throw new Error("SLUG_LOCKED");

  // Check uniqueness (partial-unique index will catch DB-level, but pre-check for UX)
  const existing = await Invite.findOne({
    slug,
    status: { $in: ["published", "expired"] },
    _id: { $ne: invite._id },
  });
  if (existing) throw new Error("SLUG_TAKEN");

  // Validate required fields
  const template = (invite.templateId as unknown as TemplateDoc & { sections: import("@/types/invite").SectionDef[] });
  if (template?.sections) {
    const errors = validateContent(
      invite.content as InviteContent,
      template.sections,
      (invite.sectionOverrides ?? []) as { type: string; enabled: boolean }[],
    );
    if (Object.keys(errors).length > 0) {
      throw new Error(`VALIDATION:${JSON.stringify(errors)}`);
    }
  }

  const eventDate = invite.eventDate as Date | undefined;
  const { expiresAt, slugReleaseAt } = eventDate
    ? computeLifecycleDates(eventDate)
    : { expiresAt: null, slugReleaseAt: null };

  const now = new Date();
  invite.slug = slug;
  invite.status = "published";
  invite.publishedAt = invite.publishedAt ?? now;
  if (expiresAt) invite.expiresAt = expiresAt;
  if (slugReleaseAt) invite.slugReleaseAt = slugReleaseAt;
  invite.ogVersion = (invite.ogVersion ?? 1) + 1;

  try {
    await invite.save();
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) throw new Error("SLUG_TAKEN");
    throw err;
  }

  revalidateTag(`invite:${slug}`);
  return { slug };
}

// ---------------------------------------------------------------------------
// Unpublish / archive / duplicate / soft-delete
// ---------------------------------------------------------------------------

export async function unpublishInvite(inviteId: string, ownerId: string) {
  await dbConnect();
  const invite = await Invite.findOne({ _id: inviteId, ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (!invite) throw new Error("NOT_FOUND");
  if (invite.status !== "published") throw new Error("NOT_PUBLISHED");

  const oldSlug = invite.slug as string | undefined;
  invite.status = "draft";
  invite.slug = undefined as never;
  invite.publishedAt = undefined as never;
  invite.expiresAt = undefined as never;
  invite.slugReleaseAt = undefined as never;
  await invite.save();

  if (oldSlug) revalidateTag(`invite:${oldSlug}`);
}

export async function archiveInvite(inviteId: string, ownerId: string) {
  await dbConnect();
  const invite = await Invite.findOne({ _id: inviteId, ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (!invite) throw new Error("NOT_FOUND");
  invite.status = "archived";
  await invite.save();
}

export async function softDeleteInvite(inviteId: string, ownerId: string) {
  await dbConnect();
  const result = await Invite.updateOne(
    { _id: inviteId, ownerId: new Types.ObjectId(ownerId), deletedAt: null },
    { $set: { deletedAt: new Date() } },
  );
  if (result.matchedCount === 0) throw new Error("NOT_FOUND");
}

export async function duplicateInvite(inviteId: string, ownerId: string) {
  await dbConnect();
  const original = await Invite.findOne({
    _id: inviteId,
    ownerId: new Types.ObjectId(ownerId),
    deletedAt: null,
  }).lean();
  if (!original) throw new Error("NOT_FOUND");

  const count = await Invite.countDocuments({ ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (count >= 50) throw new Error("LIMIT_REACHED");

  const { _id, slug, status, publishedAt, expiresAt, slugReleaseAt, stats, ...rest } = original as InviteDoc & {
    _id: unknown; slug: unknown; status: unknown; publishedAt: unknown; expiresAt: unknown;
    slugReleaseAt: unknown; stats: unknown;
  };
  void _id; void slug; void status; void publishedAt; void expiresAt; void slugReleaseAt; void stats;

  const clone = await Invite.create({
    ...rest,
    status: "draft",
    slug: null,
    publishedAt: null,
    expiresAt: null,
    slugReleaseAt: null,
    stats: { views: 0, uniqueVisitors: 0, rsvpYes: 0, rsvpNo: 0, rsvpMaybe: 0 },
  });

  return { inviteId: clone._id.toString() };
}

// ---------------------------------------------------------------------------
// Slug availability check
// ---------------------------------------------------------------------------

export async function checkSlugAvailability(slug: string): Promise<{
  available: boolean;
  reason?: "reserved" | "taken" | "locked" | "invalid";
}> {
  const fmt = validateSlugFormat(slug);
  if (!fmt.ok) return { available: false, reason: "invalid" };
  if (isReservedSlug(slug)) return { available: false, reason: "reserved" };
  if (await isSlugLocked(slug)) return { available: false, reason: "locked" };

  await dbConnect();
  const existing = await Invite.exists({ slug, status: { $in: ["published", "expired"] } });
  if (existing) return { available: false, reason: "taken" };

  return { available: true };
}

// ---------------------------------------------------------------------------
// Public fetch (for ISR renderer — no auth)
// ---------------------------------------------------------------------------

export async function getPublishedInviteBySlug(slug: string) {
  await dbConnect();
  return Invite.findOne({ slug, status: "published", deletedAt: null })
    .populate("templateId")
    .lean();
}
