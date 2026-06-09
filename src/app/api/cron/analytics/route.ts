import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/auth/guards";
import { flushPendingViews } from "@/lib/analytics/flush";

/**
 * POST /api/cron/analytics
 *
 * Drains the Redis analytics:pending set into AnalyticsDaily documents
 * and syncs Invite.stats.views running totals.
 *
 * Trigger: every 10–15 minutes via your cron provider.
 * Auth: CRON_SECRET in Authorization: Bearer header or x-cron-secret header.
 *
 * Optional body: { dryRun: true } to count pending entries without writing.
 */
export async function POST(req: NextRequest) {
  if (!requireCron(req.headers)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  let dryRun = false;
  try {
    const body = await req.json() as { dryRun?: boolean };
    dryRun = body.dryRun === true;
  } catch {
    // no body — fine
  }

  const result = await flushPendingViews({ dryRun });

  return NextResponse.json({
    data: {
      ...result,
      dryRun,
      processedAt: new Date().toISOString(),
    },
  });
}
