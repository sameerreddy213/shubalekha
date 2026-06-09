import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Invite } from "@/models";
import { flushViewsForInvite } from "@/lib/analytics/flush";
import { getInviteAnalytics } from "@/features/analytics/services";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";
import { inviteUrl } from "@/config/site";
import type { InviteDoc } from "@/models";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function InviteAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  await dbConnect();
  const invite = await Invite.findOne({ _id: id, ownerId: user.id })
    .select("_id slug status stats content")
    .lean() as (InviteDoc & { _id: { toString(): string } }) | null;

  if (!invite) notFound();

  // Flush Redis buffer before rendering so the owner sees fresh data
  await flushViewsForInvite(id);

  const analytics = await getInviteAnalytics(id);

  const heroContent = (invite.content as Record<string, Record<string, string>> | null)?.hero ?? {};
  const displayTitle =
    heroContent.brideName && heroContent.groomName
      ? `${heroContent.brideName} & ${heroContent.groomName}`
      : heroContent.title ?? "Your invitation";

  const slug = typeof invite.slug === "string" ? invite.slug : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground
                       hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {displayTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analytics · last 30 days
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/invites/${id}/edit`}
            className="rounded-lg border px-4 py-2 text-sm font-medium
                       transition-colors hover:bg-muted"
          >
            Edit invitation
          </Link>
          {slug && (
            <a
              href={inviteUrl(slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2
                         text-sm font-medium transition-colors hover:bg-muted"
            >
              View live <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      <AnalyticsDashboard inviteId={id} initial={analytics} />
    </div>
  );
}
