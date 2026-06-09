import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/redis";
import { publishInvite } from "@/features/invites/services";

const body = z.object({
  slug: z.string().min(3).max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rl = await rateLimit("write", user.id);
    if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

    const parsed = body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION", fields: parsed.error.flatten() } }, { status: 400 });
    }

    const result = await publishInvite({ inviteId: id, ownerId: user.id, slug: parsed.data.slug });
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    if (msg === "SLUG_TAKEN" || msg === "SLUG_LOCKED") return NextResponse.json({ error: { code: "CONFLICT", message: msg } }, { status: 409 });
    if (msg === "SLUG_RESERVED") return NextResponse.json({ error: { code: "SLUG_RESERVED" } }, { status: 409 });
    if (msg?.startsWith("VALIDATION:")) {
      return NextResponse.json({ error: { code: "VALIDATION", fields: JSON.parse(msg.slice(11)) } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}
