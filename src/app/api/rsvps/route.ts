import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/redis";
import { submitRsvp } from "@/features/rsvp/services";

const schema = z.object({
  inviteId: z.string().regex(/^[a-f\d]{24}$/i),
  name: z.string().min(1).max(120),
  email: z.string().email().optional().nullable(),
  phone: z.string().regex(/^[0-9+\-\s()]{6,20}$/).optional().nullable(),
  status: z.enum(["attending", "not_attending", "maybe"]),
  partySize: z.number().int().min(1).max(50).default(1),
  meal: z.enum(["veg", "non_veg", "vegan", "jain", "none"]).default("none"),
  message: z.string().max(500).optional(),
  guestLinkToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",").at(0)?.trim() || "unknown";
  const rl = await rateLimit("rsvp", ip);
  if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION", fields: parsed.error.flatten() } }, { status: 400 });
  }

  try {
    const result = await submitRsvp({ ...parsed.data, source: "direct" });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INVITE_NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    if (msg === "RSVP_DISABLED") return NextResponse.json({ error: { code: "DISABLED" } }, { status: 403 });
    if (msg === "ALREADY_RSVPED") return NextResponse.json({ error: { code: "ALREADY_RSVPED" } }, { status: 409 });
    return NextResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
  }
}
