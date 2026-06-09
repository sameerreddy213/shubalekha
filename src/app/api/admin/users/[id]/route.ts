import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/models";

const patchSchema = z.object({
  role:   z.enum(["admin", "user"]).optional(),
  status: z.enum(["active", "disabled"]).optional(),
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
  const result = await User.updateOne({ _id: id }, { $set: parsed.data });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }
  return NextResponse.json({ data: { updated: true } });
}
