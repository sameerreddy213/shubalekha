import "server-only";
import { dbConnect } from "@/lib/db/connect";
import { User, Invite, Rsvp, Template } from "@/models";
import type { UserDoc } from "@/models/User";
import type { InviteDoc } from "@/models/Invite";
import type { TemplateDoc } from "@/models/Template";

// ── KPIs ──────────────────────────────────────────────────────────────────

export interface AdminKpis {
  totalUsers: number;
  newUsersThisWeek: number;
  totalInvites: number;
  publishedInvites: number;
  draftInvites: number;
  expiredInvites: number;
  totalRsvps: number;
  totalTemplates: number;
  publishedTemplates: number;
}

export async function getAdminKpis(): Promise<AdminKpis> {
  await dbConnect();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisWeek,
    totalInvites,
    publishedInvites,
    draftInvites,
    expiredInvites,
    totalRsvps,
    totalTemplates,
    publishedTemplates,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    Invite.countDocuments({}),
    Invite.countDocuments({ status: "published" }),
    Invite.countDocuments({ status: "draft" }),
    Invite.countDocuments({ status: "expired" }),
    Rsvp.countDocuments({}),
    Template.countDocuments({}),
    Template.countDocuments({ status: "published" }),
  ]);

  return {
    totalUsers,
    newUsersThisWeek,
    totalInvites,
    publishedInvites,
    draftInvites,
    expiredInvites,
    totalRsvps,
    totalTemplates,
    publishedTemplates,
  };
}

// ── Users ─────────────────────────────────────────────────────────────────

export interface AdminUser {
  _id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  inviteCount: number;
}

export async function listAdminUsers(opts: {
  page: number;
  limit: number;
  search?: string;
}): Promise<{ items: AdminUser[]; total: number }> {
  await dbConnect();
  const { page, limit, search } = opts;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }

  const [rawUsers, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const users = rawUsers as unknown as Array<UserDoc & { _id: { toString(): string } }>;

  // Batch invite counts
  const userIds = users.map((u) => u._id.toString());
  const counts = await Invite.aggregate<{ _id: string; count: number }>([
    { $match: { ownerId: { $in: userIds } } },
    { $group: { _id: "$ownerId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  return {
    items: users.map((u) => ({
      _id: u._id.toString(),
      email: u.email ?? "",
      name: u.name ?? null,
      role: (u.role as string) ?? "user",
      status: (u.status as string) ?? "active",
      createdAt: u.createdAt ? new Date(u.createdAt as unknown as string).toISOString() : "",
      inviteCount: countMap[u._id.toString()] ?? 0,
    })),
    total,
  };
}

// ── Invites ───────────────────────────────────────────────────────────────

export interface AdminInvite {
  _id: string;
  ownerEmail: string;
  ownerName: string | null;
  templateName: string | null;
  status: string;
  slug: string | null;
  eventDate: string | null;
  views: number;
  rsvpYes: number;
  createdAt: string;
}

export async function listAdminInvites(opts: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}): Promise<{ items: AdminInvite[]; total: number }> {
  await dbConnect();
  const { page, limit, status, search } = opts;

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;

  const [rawInvites, total] = await Promise.all([
    Invite.find(filter)
      .populate("ownerId", "email name")
      .populate("templateId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Invite.countDocuments(filter),
  ]);

  type PopInvite = InviteDoc & {
    _id: { toString(): string };
    ownerId: { email?: string; name?: string } | null;
    templateId: { name?: string } | null;
  };

  let items = (rawInvites as unknown as PopInvite[]).map((inv) => ({
    _id: inv._id.toString(),
    ownerEmail: inv.ownerId?.email ?? "—",
    ownerName: inv.ownerId?.name ?? null,
    templateName: inv.templateId?.name ?? null,
    status: inv.status,
    slug: typeof inv.slug === "string" ? inv.slug : null,
    eventDate: inv.eventDate ? new Date(inv.eventDate as unknown as string).toISOString() : null,
    views: inv.stats?.views ?? 0,
    rsvpYes: inv.stats?.rsvpYes ?? 0,
    createdAt: inv.createdAt ? new Date(inv.createdAt as unknown as string).toISOString() : "",
  }));

  // Client-side search on populated owner email/name
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.ownerEmail.toLowerCase().includes(q) ||
        (i.ownerName ?? "").toLowerCase().includes(q) ||
        (i.slug ?? "").toLowerCase().includes(q),
    );
  }

  return { items, total };
}

// ── Templates ─────────────────────────────────────────────────────────────

export interface AdminTemplate {
  _id: string;
  slug: string;
  name: string;
  category: string;
  status: string;
  featured: boolean;
  order: number;
  variantCount: number;
  sectionCount: number;
  updatedAt: string;
}

export async function listAdminTemplates(): Promise<AdminTemplate[]> {
  await dbConnect();
  const docs = await Template.find({})
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return (docs as unknown as Array<TemplateDoc & { _id: { toString(): string } }>).map((t) => ({
    _id: t._id.toString(),
    slug: t.slug,
    name: t.name,
    category: t.category,
    status: t.status ?? "draft",
    featured: t.featured ?? false,
    order: t.order ?? 0,
    variantCount: (t.variants ?? []).length,
    sectionCount: (t.sections ?? []).length,
    updatedAt: t.updatedAt ? new Date(t.updatedAt as unknown as string).toISOString() : "",
  }));
}
