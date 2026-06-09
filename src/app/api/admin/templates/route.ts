import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { listAdminTemplates } from "@/features/admin/services";

export async function GET() {
  try {
    await requireRole("admin");
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: { code: err.code } }, { status: err.status });
  }

  const templates = await listAdminTemplates();
  return NextResponse.json({ data: templates });
}
