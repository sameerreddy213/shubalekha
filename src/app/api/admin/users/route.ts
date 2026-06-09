import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { AuthError } from "@/lib/auth/guards";
import { listAdminUsers } from "@/features/admin/services";

export async function GET(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: { code: err.code } }, { status: err.status });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Number(sp.get("limit") ?? 25));
  const search = sp.get("q") ?? undefined;

  const result = await listAdminUsers({ page, limit, search });
  return NextResponse.json({ data: result.items, meta: { page, limit, total: result.total } });
}
