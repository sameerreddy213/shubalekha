import type { Metadata } from "next";
import { revalidatePath, revalidateTag } from "next/cache";
import { XCircle, Archive, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Invite } from "@/models";
import { listAdminInvites } from "@/features/admin/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { inviteUrl } from "@/config/site";

export const metadata: Metadata = { title: "Admin — Invitations" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

// ── Status badge helper ────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<
  string,
  { variant: "default" | "secondary" | "outline" | "destructive"; label: string }
> = {
  published: { variant: "default", label: "Published" },
  draft:     { variant: "secondary", label: "Draft" },
  expired:   { variant: "outline", label: "Expired" },
  archived:  { variant: "destructive", label: "Archived" },
};

// ── Server actions ────────────────────────────────────────────────────────

async function forceExpire(formData: FormData) {
  "use server";
  await requireRole("admin");
  await dbConnect();
  const id = formData.get("inviteId") as string;
  const inv = await Invite.findById(id).select("slug").lean() as { slug?: string } | null;
  await Invite.updateOne({ _id: id }, { $set: { status: "expired" } });
  if (inv?.slug) revalidateTag(`invite:${inv.slug}`);
  revalidatePath("/admin/invites");
}

async function archiveInvite(formData: FormData) {
  "use server";
  await requireRole("admin");
  await dbConnect();
  const id = formData.get("inviteId") as string;
  const inv = await Invite.findById(id).select("slug").lean() as { slug?: string } | null;
  await Invite.updateOne({ _id: id }, { $set: { status: "archived", slug: null } });
  if (inv?.slug) revalidateTag(`invite:${inv.slug}`);
  revalidatePath("/admin/invites");
}

// ── Page ──────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ["all", "published", "draft", "expired", "archived"];

export default async function AdminInvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await requireRole("admin");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const search = sp.q ?? "";
  const status = sp.status ?? "all";

  const { items: invites, total } = await listAdminInvites({
    page,
    limit: PAGE_SIZE,
    status: status !== "all" ? status : undefined,
    search: search || undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Invitations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString()} total
          </p>
        </div>
        <form method="GET" className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Search by owner or slug…"
            className="w-56"
          />
          <Button type="submit" variant="outline">Search</Button>
          {search && (
            <Button asChild variant="ghost">
              <a href={`/admin/invites${status !== "all" ? `?status=${status}` : ""}`}>Clear</a>
            </Button>
          )}
        </form>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <a
            key={s}
            href={`/admin/invites?status=${s}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Views</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">RSVPs</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invites.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No invitations found.
                </td>
              </tr>
            ) : (
              invites.map((inv) => {
                const sv = STATUS_VARIANTS[inv.status] ?? { variant: "secondary" as const, label: inv.status };
                return (
                  <tr key={inv._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.ownerName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{inv.ownerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {inv.templateName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {inv.slug ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs">{inv.slug}</span>
                          <a
                            href={inviteUrl(inv.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sv.variant}>{sv.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {inv.views.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {inv.rsvpYes}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {inv.eventDate
                        ? new Date(inv.eventDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {inv.status === "published" && (
                          <form action={forceExpire}>
                            <input type="hidden" name="inviteId" value={inv._id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              title="Force expire"
                              className="size-8 text-amber-600 hover:text-amber-700"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          </form>
                        )}
                        {inv.status !== "archived" && (
                          <form action={archiveInvite}>
                            <input type="hidden" name="inviteId" value={inv._id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              title="Archive"
                              className="size-8 text-destructive hover:text-destructive/80"
                            >
                              <Archive className="size-3.5" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/admin/invites?page=${page - 1}&status=${status}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                >
                  <ChevronLeft className="size-4" /> Previous
                </a>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/admin/invites?page=${page + 1}&status=${status}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                >
                  Next <ChevronRight className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
