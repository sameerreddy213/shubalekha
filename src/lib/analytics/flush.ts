import "server-only";
import { getRedis } from "@/lib/redis";
import { dbConnect } from "@/lib/db/connect";
import { AnalyticsDaily, Invite } from "@/models";

interface FlushResult {
  flushed: number;
  skipped: number;
  errors: number;
}

/**
 * Drain the Redis `analytics:pending` set.
 *
 * For each `inviteId:day` entry:
 *   1. Read HyperLogLog count (unique visitors) + raw view counter
 *   2. Upsert an AnalyticsDaily document
 *   3. Sync the running view total back to Invite.stats.views
 *   4. Remove the entry from the pending set
 *
 * Called by the /api/cron/analytics route, and can be called manually.
 */
export async function flushPendingViews(opts?: { dryRun?: boolean }): Promise<FlushResult> {
  const redis = getRedis();
  // No Redis configured — nothing to flush; not an error
  if (!redis) return { flushed: 0, skipped: 0, errors: 0 };

  await dbConnect();

  const pending = await redis.smembers("analytics:pending") as string[];
  if (pending.length === 0) return { flushed: 0, skipped: 0, errors: 0 };

  let flushed = 0;
  let skipped = 0;
  let errors  = 0;

  for (const entry of pending) {
    const colonIdx = entry.indexOf(":");
    if (colonIdx === -1) { skipped++; continue; }

    const inviteId = entry.slice(0, colonIdx);
    const day      = entry.slice(colonIdx + 1);

    try {
      const hllKey   = `views:${inviteId}:${day}`;
      const countKey = `viewcount:${inviteId}:${day}`;

      const [uniqueVisitors, rawViews] = await Promise.all([
        redis.pfcount(hllKey),
        redis.get<number>(countKey),
      ]);

      const views = typeof rawViews === "number" ? rawViews : 0;

      if (views === 0 && uniqueVisitors === 0) { skipped++; continue; }

      if (!opts?.dryRun) {
        // Upsert the daily analytics row
        await AnalyticsDaily.updateOne(
          { inviteId, day },
          {
            $max: { views, uniqueVisitors },
          },
          { upsert: true },
        );

        // Roll up total views across all days → Invite.stats.views
        const totals = await AnalyticsDaily.aggregate<{ total: number }>([
          { $match: { inviteId } },
          { $group: { _id: null, total: { $sum: "$views" } } },
        ]);
        const totalViews = totals.at(0)?.total ?? 0;
        await Invite.updateOne({ _id: inviteId }, { $set: { "stats.views": totalViews } });

        // Remove processed entry from pending set
        await redis.srem("analytics:pending", entry);
      }

      flushed++;
    } catch {
      errors++;
    }
  }

  return { flushed, skipped, errors };
}

/**
 * Flush views for a specific invite right now (called on-demand, e.g. when
 * the owner opens their analytics page so they see near-real-time data).
 */
export async function flushViewsForInvite(inviteId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  await dbConnect();

  // Check last 2 days (today + yesterday) for any buffered data
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  for (const day of [today, yesterday]) {
    const hllKey   = `views:${inviteId}:${day}`;
    const countKey = `viewcount:${inviteId}:${day}`;

    const [uniqueVisitors, rawViews] = await Promise.all([
      redis.pfcount(hllKey),
      redis.get<number>(countKey),
    ]);

    const views = typeof rawViews === "number" ? rawViews : 0;
    if (views === 0 && uniqueVisitors === 0) continue;

    await AnalyticsDaily.updateOne(
      { inviteId, day },
      { $max: { views, uniqueVisitors } },
      { upsert: true },
    );

    await redis.srem("analytics:pending", `${inviteId}:${day}`);
  }

  // Sync running total
  const totals = await AnalyticsDaily.aggregate<{ total: number }>([
    { $match: { inviteId } },
    { $group: { _id: null, total: { $sum: "$views" } } },
  ]);
  const totalViews = totals.at(0)?.total ?? 0;
  await Invite.updateOne({ _id: inviteId }, { $set: { "stats.views": totalViews } });
}
