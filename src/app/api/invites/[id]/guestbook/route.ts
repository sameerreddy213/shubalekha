import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/redis";
import { submitGuestbookEntry, listGuestbookEntries } from "@/features/guestbook/services";
import { currentUser } from "@/lib/auth/session";

const submitSchema = z.object({
  name: z.string().min(1).max(120),
  message: z.string().min(1).max(600),
  guestLinkToken: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",").at(0)?.trim() || "unknown";

  const rl = await rateLimit("guestbook", ip);
  if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

  const parsed = submitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION", fields: parsed.error.flatten() } }, { status: 400 });
  }

  try {
    const result = await submitGuestbookEntry(id, parsed.data.name, parsed.data.message, ip, parsed.data.guestLinkToken);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INVITE_NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    if (msg === "GUESTBOOK_DISABLED") return NextResponse.json({ error: { code: "DISABLED" } }, { status: 403 });
    return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const entries = await listGuestbookEntries(id, !!user);
  return NextResponse.json({ data: entries });
}
