import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Invite } from "@/models";

const patchSchema = z.object({
  action: z.enum(["expire", "archive"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("admin");
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: { code: err.code } }, { status: err.status });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  await dbConnect();
  const inv = await Invite.findById(id).select("slug status").lean() as
    | { slug?: string; status?: string }
    | null;

  if (!inv) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const { action } = parsed.data;
  const update =
    action === "expire"
      ? { status: "expired" }
      : { status: "archived", slug: null };

  await Invite.updateOne({ _id: id }, { $set: update });
  if (inv.slug) revalidateTag(`invite:${inv.slug}`);

  return NextResponse.json({ data: { updated: true, action } });
}
