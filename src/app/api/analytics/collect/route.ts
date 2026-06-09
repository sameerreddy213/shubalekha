import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { rateLimit, bufferView } from "@/lib/redis";

const schema = z.object({
  inviteId: z.string().regex(/^[a-f\d]{24}$/i),
  guestLinkToken: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",").at(0)?.trim() || "unknown";
  const rl = await rateLimit("beacon", ip);
  if (!rl.success) return new NextResponse(null, { status: 429 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const ua = req.headers.get("user-agent") ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHash("sha256")
    .update(`${ip}|${ua}|${day}`)
    .digest("hex")
    .slice(0, 32);

  await bufferView(parsed.data.inviteId, visitorHash);

  return new NextResponse(null, { status: 204 });
}
