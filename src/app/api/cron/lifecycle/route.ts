import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Invite } from "@/models";
import { needsExpiry, needsSlugRelease, type LifecycleCandidate } from "@/lib/invite/lifecycle";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  if (!requireCron(req.headers)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  await dbConnect();

  const candidates = await Invite.find({
    status: { $in: ["published", "expired"] },
    deletedAt: null,
    $or: [
      { status: "published", expiresAt: { $lt: new Date() } },
      { status: "expired", slugReleaseAt: { $lt: new Date() }, slug: { $type: "string" } },
    ],
  })
    .select("_id status expiresAt slugReleaseAt slug")
    .lean() as unknown as LifecycleCandidate[];

  let expired = 0;
  let released = 0;

  for (const invite of candidates) {
    if (needsExpiry(invite)) {
      await Invite.updateOne({ _id: invite._id }, { $set: { status: "expired" } });
      if (invite.slug) revalidateTag(`invite:${invite.slug}`);
      expired++;
    } else if (needsSlugRelease(invite)) {
      await Invite.updateOne({ _id: invite._id }, { $set: { slug: null } });
      released++;
    }
  }

  return NextResponse.json({ data: { expired, released, processedAt: new Date().toISOString() } });
}
