import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Template } from "@/models";

const patchSchema = z.object({
  status:   z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  order:    z.number().int().min(0).optional(),
  name:     z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireRole("admin");
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: { code: err.code } }, { status: err.status });
  }

  const { slug } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  await dbConnect();
  const result = await Template.updateOne({ slug }, { $set: parsed.data });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  revalidateTag("templates");
  return NextResponse.json({ data: { updated: true } });
}
