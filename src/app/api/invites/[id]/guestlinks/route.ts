import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/redis";
import { generateGuestLinks, listGuestLinks } from "@/features/guestlinks/services";

const guestSchema = z.object({
  guests: z.array(z.object({
    name: z.string().min(1).max(120),
    group: z.string().max(120).optional(),
    maxPartySize: z.number().int().min(1).max(50).optional(),
  })).min(1).max(500),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rl = await rateLimit("write", user.id);
    if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

    const parsed = guestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION", fields: parsed.error.flatten() } }, { status: 400 });
    }

    const links = await generateGuestLinks(id, user.id, parsed.data.guests);
    return NextResponse.json({ data: links }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const sp = req.nextUrl.searchParams;
    const result = await listGuestLinks(id, user.id, Number(sp.get("page") ?? 1), 100);
    return NextResponse.json({ data: result.items, meta: { total: result.total } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}
