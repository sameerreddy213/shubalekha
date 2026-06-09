"use client";

import { useState } from "react";
import type { DailyViewRow } from "@/features/analytics/services";

interface SparklineProps {
  data: DailyViewRow[];
  height?: number;
  /** which value to plot — "views" or "uniqueVisitors" */
  field?: "views" | "uniqueVisitors";
  color?: string;
  label?: string;
}

export function Sparkline({
  data,
  height = 80,
  field = "views",
  color = "hsl(var(--primary))",
  label = "Views",
}: SparklineProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; row: DailyViewRow } | null>(null);

  if (data.length === 0) return null;

  const values = data.map((d) => d[field]);
  const maxVal = Math.max(...values, 1);
  const W = 600; // viewBox width (scales with container)
  const H = height;
  const PAD_X = 2;
  const PAD_Y = 8;
  const plotH = H - PAD_Y * 2;
  const stepX = (W - PAD_X * 2) / Math.max(data.length - 1, 1);

  const points = data.map((row, i) => {
    const x = PAD_X + i * stepX;
    const y = PAD_Y + plotH - (row[field] / maxVal) * plotH;
    return { x, y, row };
  });

  // SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // Fill area under line
  const firstPt = points.at(0)!;
  const lastPt  = points.at(-1)!;
  const fillD = `${pathD} L${lastPt.x.toFixed(1)},${(H - PAD_Y).toFixed(1)} L${firstPt.x.toFixed(1)},${(H - PAD_Y).toFixed(1)} Z`;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    // Find nearest point
    let nearest = points[0]!;
    let minDist = Infinity;
    for (const p of points) {
      const d = Math.abs(p.x - relX);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    setTooltip({ x: nearest.x, y: nearest.y, row: nearest.row });
  }

  const activePt = tooltip ? points.find((p) => p.row.day === tooltip.row.day) : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        aria-label={`${label} over time`}
        role="img"
      >
        <defs>
          <linearGradient id={`fill-${field}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={fillD} fill={`url(#fill-${field})`} />

        {/* Grid lines — 4 horizontal rules */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const lineY = PAD_Y + plotH - frac * plotH;
          return (
            <line
              key={frac}
              x1={PAD_X}
              y1={lineY}
              x2={W - PAD_X}
              y2={lineY}
              stroke="currentColor"
              strokeOpacity="0.06"
              strokeWidth="1"
            />
          );
        })}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover dot */}
        {activePt && (
          <circle
            cx={activePt.x}
            cy={activePt.y}
            r="3.5"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        )}
      </svg>

      {/* X-axis labels — show ~5 evenly spaced dates */}
      <div className="mt-1 flex justify-between px-0.5 text-[10px] text-muted-foreground">
        {[0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((data.length * 3) / 4), data.length - 1].map(
          (idx) => {
            const row = data[idx];
            if (!row) return null;
            return (
              <span key={row.day}>
                {new Date(row.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            );
          },
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border bg-popover px-3 py-2
                     text-xs shadow-md"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: "-48px",
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-semibold text-foreground">
            {tooltip.row[field].toLocaleString()} {label.toLowerCase()}
          </p>
          <p className="text-muted-foreground">
            {new Date(tooltip.row.day).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
