import "server-only";
import { dbConnect } from "@/lib/db/connect";
import { AnalyticsDaily, Rsvp, Invite } from "@/models";

// ── Types ─────────────────────────────────────────────────────────────────

export interface DailyViewRow {
  day: string;          // YYYY-MM-DD
  views: number;
  uniqueVisitors: number;
}

export interface RsvpBreakdown {
  attending:    number;
  not_attending: number;
  maybe:        number;
  total:        number;
}

export interface InviteAnalytics {
  totalViews:     number;
  uniqueVisitors: number;
  rsvpBreakdown:  RsvpBreakdown;
  dailyViews:     DailyViewRow[];   // last `days` days, zero-filled
  topSources:     Array<{ source: string; count: number }>;
}

// ── Service ───────────────────────────────────────────────────────────────

/**
 * Fetch analytics for a single invite.
 * @param inviteId  MongoDB ObjectId string
 * @param days      Number of days of history to return (default 30)
 */
export async function getInviteAnalytics(
  inviteId: string,
  days = 30,
): Promise<InviteAnalytics> {
  await dbConnect();

  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const [rows, rsvpRows, inviteDoc] = await Promise.all([
    AnalyticsDaily.find({ inviteId, day: { $gte: since } })
      .sort({ day: 1 })
      .lean(),
    Rsvp.aggregate<{ _id: string; count: number }>([
      { $match: { inviteId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Invite.findById(inviteId).select("stats").lean() as Promise<
      { stats?: { views?: number } } | null
    >,
  ]);

  // Build zero-filled daily series
  const rowMap = new Map(
    rows.map((r) => [
      r.day as string,
      { views: r.views as number, uniqueVisitors: r.uniqueVisitors as number },
    ]),
  );

  const dailyViews: DailyViewRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const row = rowMap.get(d);
    dailyViews.push({
      day: d,
      views: row?.views ?? 0,
      uniqueVisitors: row?.uniqueVisitors ?? 0,
    });
  }

  // RSVP breakdown
  const rsvpMap = Object.fromEntries(rsvpRows.map((r) => [r._id, r.count]));
  const rsvpBreakdown: RsvpBreakdown = {
    attending:     rsvpMap.attending     ?? 0,
    not_attending: rsvpMap.not_attending ?? 0,
    maybe:         rsvpMap.maybe         ?? 0,
    total:         (rsvpMap.attending ?? 0) + (rsvpMap.not_attending ?? 0) + (rsvpMap.maybe ?? 0),
  };

  // Totals (prefer Invite.stats for the running total; sum rows as fallback)
  const totalViews =
    inviteDoc?.stats?.views ??
    rows.reduce((s, r) => s + (r.views as number), 0);

  const uniqueVisitors = rows.reduce((s, r) => s + (r.uniqueVisitors as number), 0);

  // Top sources from AnalyticsDaily.bySource maps
  const sourceMap: Record<string, number> = {};
  for (const row of rows) {
    const src = row.bySource as Map<string, number> | Record<string, number> | undefined;
    if (!src) continue;
    const entries = src instanceof Map ? [...src.entries()] : Object.entries(src);
    for (const [k, v] of entries) {
      sourceMap[k] = (sourceMap[k] ?? 0) + v;
    }
  }
  const topSources = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  return { totalViews, uniqueVisitors, rsvpBreakdown, dailyViews, topSources };
}
