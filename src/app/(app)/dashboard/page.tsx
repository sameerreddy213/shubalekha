import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText, Globe, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listInvites } from "@/features/invites/services";
import { InviteCard } from "@/features/invites/components/invite-card";
import { Button } from "@/components/ui/button";
import type { TemplateDoc, InviteDoc } from "@/models";

export const metadata: Metadata = { title: "Dashboard — Shubalekha" };
export const dynamic = "force-dynamic";

type PopulatedInvite = InviteDoc & { _id: { toString(): string } };

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";
  const { items, total } = await listInvites({ ownerId: user.id, page: 1, limit: 50 });

  const drafts = items.filter((i) => (i as PopulatedInvite).status === "draft").length;
  const published = items.filter((i) => (i as PopulatedInvite).status === "published").length;
  const expired = items.filter((i) => (i as PopulatedInvite).status === "expired").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Hi {firstName} 👋</h1>
          <p className="mt-1 text-muted-foreground">
            {total === 0 ? "Your invitations live here." : `${total} invitation${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/invites/new" className="gap-1.5 flex items-center">
            <Plus className="h-4 w-4" /> Create invitation
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<FileText className="h-5 w-5" />} label="Drafts" value={String(drafts)} />
        <StatCard icon={<Globe className="h-5 w-5" />} label="Published" value={String(published)} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Expired" value={String(expired)} />
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <h2 className="font-display text-xl font-medium">No invitations yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Browse our templates and publish your first beautiful invitation in minutes.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/invites/new">Browse templates</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((invite) => {
            const inv = invite as unknown as PopulatedInvite & { templateId: TemplateDoc | null };
            const c = inv.content as Record<string, Record<string, string>> | null;
            const heroSection = c?.hero ?? {};
            const displayTitle =
              heroSection.brideName && heroSection.groomName
                ? `${heroSection.brideName} & ${heroSection.groomName}`
                : heroSection.coupleName ?? heroSection.title ?? undefined;

            return (
              <InviteCard
                key={inv._id.toString()}
                id={inv._id.toString()}
                title={displayTitle}
                slug={typeof inv.slug === "string" ? inv.slug : undefined}
                status={inv.status as "draft" | "published" | "expired" | "archived"}
                eventDate={inv.eventDate ? new Date(inv.eventDate as unknown as string).toISOString() : undefined}
                stats={inv.stats ? { views: inv.stats.views ?? 0, rsvpYes: inv.stats.rsvpYes ?? 0 } : undefined}
                templateName={inv.templateId?.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
