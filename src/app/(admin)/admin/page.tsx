import type { Metadata } from "next";
import Link from "next/link";
import {
  Users, FileText, Globe, BarChart2,
  TrendingUp, Layout, CheckCircle2, Clock,
} from "lucide-react";
import { getAdminKpis } from "@/features/admin/services";

export const metadata: Metadata = { title: "Admin — Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const kpis = await getAdminKpis();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform health at a glance.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total users"
          value={kpis.totalUsers}
          sub={`+${kpis.newUsersThisWeek} this week`}
          icon={<Users className="size-4" />}
          href="/admin/users"
        />
        <KpiCard
          label="Total invitations"
          value={kpis.totalInvites}
          sub={`${kpis.publishedInvites} published`}
          icon={<FileText className="size-4" />}
          href="/admin/invites"
        />
        <KpiCard
          label="Live invitations"
          value={kpis.publishedInvites}
          sub={`${kpis.draftInvites} drafts · ${kpis.expiredInvites} expired`}
          icon={<Globe className="size-4" />}
          href="/admin/invites?status=published"
        />
        <KpiCard
          label="Total RSVPs"
          value={kpis.totalRsvps}
          sub="across all invitations"
          icon={<BarChart2 className="size-4" />}
          href="/admin/invites"
        />
      </div>

      {/* Second row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Templates"
          value={kpis.publishedTemplates}
          sub={`${kpis.totalTemplates - kpis.publishedTemplates} drafts`}
          icon={<Layout className="size-4" />}
          href="/admin/templates"
        />
        <KpiCard
          label="Drafts in progress"
          value={kpis.draftInvites}
          sub="not yet published"
          icon={<Clock className="size-4" />}
          href="/admin/invites?status=draft"
        />
        <KpiCard
          label="Expired"
          value={kpis.expiredInvites}
          sub="past event date"
          icon={<CheckCircle2 className="size-4" />}
          href="/admin/invites?status=expired"
        />
      </div>

      {/* Quick links */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold">Quick actions</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/users", label: "Manage users", icon: <Users className="size-4" /> },
            { href: "/admin/invites", label: "Moderate invitations", icon: <FileText className="size-4" /> },
            { href: "/admin/templates", label: "Manage templates", icon: <Layout className="size-4" /> },
            { href: "/templates", label: "View public gallery", icon: <TrendingUp className="size-4" /> },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg border border-border/60 px-4 py-3
                         text-sm text-muted-foreground transition-colors
                         hover:border-primary/40 hover:bg-muted hover:text-foreground"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon, href,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="group block rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        <span className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}
