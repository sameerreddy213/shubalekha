import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Template } from "@/models";

export async function GET(req: NextRequest) {
  await dbConnect();
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(50, Number(sp.get("limit") ?? 20));

  const filter: Record<string, unknown> = { status: "published" };
  if (category) filter.category = category;

  const [items, total] = await Promise.all([
    Template.find(filter)
      .select("-sections") // don't send the full schema in the gallery list
      .sort({ featured: -1, order: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Template.countDocuments(filter),
  ]);

  return NextResponse.json({ data: items, meta: { page, limit, total } });
}
