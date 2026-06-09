import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/redis";
import { createInvite, listInvites } from "@/features/invites/services";

const createSchema = z.object({
  templateId: z.string().regex(/^[a-f\d]{24}$/i),
  variantKey: z.string().optional(),
});

const listSchema = z.object({
  status: z.enum(["draft", "published", "expired", "archived"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const rl = await rateLimit("write", user.id);
    if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION", fields: parsed.error.flatten() } }, { status: 400 });
    }

    const result = await createInvite({ ...parsed.data, ownerId: user.id });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "LIMIT_REACHED") return NextResponse.json({ error: { code: "LIMIT_REACHED" } }, { status: 409 });
    if (msg === "Template not found") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const rl = await rateLimit("read", user.id);
    if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

    const parsed = listSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION", fields: parsed.error.flatten() } }, { status: 400 });
    }

    const result = await listInvites({ ownerId: user.id, ...parsed.data });
    return NextResponse.json({ data: result.items, meta: { page: result.page, limit: result.limit, total: result.total } });
  } catch {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}
