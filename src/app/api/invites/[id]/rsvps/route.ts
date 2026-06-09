import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/redis";
import { listRsvps } from "@/features/rsvp/services";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rl = await rateLimit("read", user.id);
    if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 50)));

    const result = await listRsvps(id, user.id, page, limit);
    return NextResponse.json({
      data: result.items,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}
