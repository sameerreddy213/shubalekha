import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Invite } from "@/models";
import { getInviteAnalytics } from "@/features/analytics/services";
import { flushViewsForInvite } from "@/lib/analytics/flush";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: { code: err.code } }, { status: err.status });
  }

  const { id } = await params;
  await dbConnect();

  // Ownership check — only the invite owner can read analytics
  const invite = await Invite.findOne({ _id: id, ownerId: user.id })
    .select("_id")
    .lean();
  if (!invite) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  // On-demand flush so the owner sees near-real-time data
  await flushViewsForInvite(id);

  const days = Math.min(90, Math.max(7, Number(req.nextUrl.searchParams.get("days") ?? 30)));
  const analytics = await getInviteAnalytics(id, days);

  return NextResponse.json({ data: analytics });
}
