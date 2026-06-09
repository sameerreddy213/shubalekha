"use client";

import type { RsvpBreakdown } from "@/features/analytics/services";

interface RsvpBarProps {
  breakdown: RsvpBreakdown;
}

const SEGMENTS = [
  { key: "attending" as const,     label: "Attending",     color: "bg-emerald-500" },
  { key: "maybe" as const,         label: "Maybe",         color: "bg-amber-400" },
  { key: "not_attending" as const, label: "Not attending", color: "bg-rose-400" },
];

export function RsvpBar({ breakdown }: RsvpBarProps) {
  const total = breakdown.total || 1; // avoid /0

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      {breakdown.total > 0 ? (
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {SEGMENTS.map((seg) => {
            const pct = (breakdown[seg.key] / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={seg.key}
                className={`${seg.color} transition-all duration-500`}
                style={{ width: `${pct.toFixed(1)}%` }}
                title={`${seg.label}: ${breakdown[seg.key]}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="h-3 w-full rounded-full bg-muted" />
      )}

      {/* Legend rows */}
      <div className="space-y-2">
        {SEGMENTS.map((seg) => {
          const count = breakdown[seg.key];
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
          return (
            <div key={seg.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm ${seg.color}`} />
                <span className="text-sm text-muted-foreground">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-sm font-medium">{count.toLocaleString()}</span>
                <span className="w-9 text-right text-xs text-muted-foreground">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {breakdown.total === 0 && (
        <p className="text-xs text-muted-foreground">No RSVPs yet.</p>
      )}
    </div>
  );
}
