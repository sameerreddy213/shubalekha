import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/redis";
import { checkSlugAvailability } from "@/features/invites/services";

const querySchema = z.object({
  slug: z.string().min(3).max(63),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const rl = await rateLimit("check", user.id);
    if (!rl.success) {
      return NextResponse.json({ error: { code: "RATE_LIMITED" } }, {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) },
      });
    }

    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION", fields: parsed.error.flatten() } }, { status: 400 });
    }

    const result = await checkSlugAvailability(parsed.data.slug);
    return NextResponse.json({ data: { slug: parsed.data.slug, ...result } });
  } catch {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}
