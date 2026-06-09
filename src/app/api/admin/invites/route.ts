import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { listAdminInvites } from "@/features/admin/services";

export async function GET(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: { code: err.code } }, { status: err.status });
  }

  const sp = req.nextUrl.searchParams;
  const page   = Math.max(1, Number(sp.get("page") ?? 1));
  const limit  = Math.min(100, Number(sp.get("limit") ?? 30));
  const status = sp.get("status") ?? undefined;
  const search = sp.get("q") ?? undefined;

  const result = await listAdminInvites({ page, limit, status, search });
  return NextResponse.json({ data: result.items, meta: { page, limit, total: result.total } });
}
