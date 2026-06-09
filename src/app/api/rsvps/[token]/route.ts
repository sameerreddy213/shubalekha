import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/redis";
import { getRsvpByToken, updateRsvp } from "@/features/rsvp/services";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rsvp = await getRsvpByToken(token);
  if (!rsvp) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  // Don't expose dedupeKey
  const { dedupeKey: _, editToken: __, ...safe } = rsvp as typeof rsvp & { dedupeKey: string; editToken: string };
  void _; void __;
  return NextResponse.json({ data: safe });
}

const updateSchema = z.object({
  status: z.enum(["attending", "not_attending", "maybe"]),
  partySize: z.number().int().min(1).max(50).optional(),
  meal: z.enum(["veg", "non_veg", "vegan", "jain", "none"]).optional(),
  message: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",").at(0)?.trim() || "unknown";
  const rl = await rateLimit("rsvp", ip);
  if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION", fields: parsed.error.flatten() } }, { status: 400 });
  }

  try {
    const result = await updateRsvp(token, parsed.data);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
  }
}
