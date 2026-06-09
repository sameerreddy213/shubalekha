"use client";

import { useState } from "react";
import { Eye, Users, CalendarCheck, TrendingUp } from "lucide-react";
import { Sparkline } from "./sparkline";
import { RsvpBar } from "./rsvp-bar";
import type { InviteAnalytics } from "@/features/analytics/services";

const RANGE_OPTIONS = [
  { label: "7 days",  days: 7  },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

interface AnalyticsDashboardProps {
  inviteId: string;
  initial: InviteAnalytics;
}

export function AnalyticsDashboard({ inviteId, initial }: AnalyticsDashboardProps) {
  const [data, setData]       = useState<InviteAnalytics>(initial);
  const [days, setDays]       = useState(30);
  const [loading, setLoading] = useState(false);
  const [chartField, setChartField] = useState<"views" | "uniqueVisitors">("views");

  async function fetchRange(newDays: number) {
    setDays(newDays);
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${inviteId}/analytics?days=${newDays}`);
      if (res.ok) {
        const json = await res.json() as { data: InviteAnalytics };
        setData(json.data);
      }
    } finally {
      setLoading(false);
    }
  }

  const attendanceRate =
    data.rsvpBreakdown.total > 0
      ? Math.round((data.rsvpBreakdown.attending / data.rsvpBreakdown.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Eye className="size-4" />}
          label="Total views"
          value={data.totalViews.toLocaleString()}
        />
        <KpiCard
          icon={<Users className="size-4" />}
          label="Unique visitors"
          value={data.uniqueVisitors.toLocaleString()}
        />
        <KpiCard
          icon={<CalendarCheck className="size-4" />}
          label="Total RSVPs"
          value={data.rsvpBreakdown.total.toLocaleString()}
        />
        <KpiCard
          icon={<TrendingUp className="size-4" />}
          label="Attendance rate"
          value={data.rsvpBreakdown.total > 0 ? `${attendanceRate}%` : "—"}
          sub={
            data.rsvpBreakdown.attending > 0
              ? `${data.rsvpBreakdown.attending} attending`
              : undefined
          }
        />
      </div>

      {/* Views chart */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Field toggle */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setChartField("views")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                chartField === "views"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Total views
            </button>
            <button
              type="button"
              onClick={() => setChartField("uniqueVisitors")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                chartField === "uniqueVisitors"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Unique visitors
            </button>
          </div>

          {/* Range selector */}
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => fetchRange(opt.days)}
                disabled={loading}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  days === opt.days
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`transition-opacity duration-150 ${loading ? "opacity-50" : "opacity-100"}`}>
          <Sparkline
            data={data.dailyViews}
            field={chartField}
            label={chartField === "views" ? "Views" : "Unique visitors"}
            height={96}
          />
        </div>
      </div>

      {/* Bottom row: RSVP breakdown + top sources */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* RSVP breakdown */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">RSVP breakdown</h3>
          <RsvpBar breakdown={data.rsvpBreakdown} />
        </div>

        {/* Top sources */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Top referrers</h3>
          {data.topSources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Source data will appear here once the cron flushes buffered views.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.topSources.map((src) => {
                const pct =
                  data.totalViews > 0
                    ? (src.count / data.totalViews) * 100
                    : 0;
                return (
                  <div key={src.source} className="flex items-center gap-3">
                    <span className="w-28 truncate text-sm text-muted-foreground">
                      {src.source || "Direct"}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary/60 transition-all duration-500"
                        style={{ width: `${pct.toFixed(1)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm tabular-nums">
                      {src.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
