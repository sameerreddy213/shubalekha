import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { duplicateInvite } from "@/features/invites/services";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const result = await duplicateInvite(id, user.id);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    if (msg === "LIMIT_REACHED") return NextResponse.json({ error: { code: "LIMIT_REACHED" } }, { status: 409 });
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}
