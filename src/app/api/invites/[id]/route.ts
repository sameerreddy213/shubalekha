import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/redis";
import { getInviteById, saveInvite, softDeleteInvite } from "@/features/invites/services";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rl = await rateLimit("read", user.id);
    if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

    const invite = await getInviteById(id, user.id);
    if (!invite) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

    return NextResponse.json({ data: invite });
  } catch {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rl = await rateLimit("write", user.id);
    if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

    const body = await req.json();
    const result = await saveInvite({ ...body, inviteId: id, ownerId: user.id });
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    if (msg === "ARCHIVED") return NextResponse.json({ error: { code: "ARCHIVED" } }, { status: 409 });
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await softDeleteInvite(id, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}
