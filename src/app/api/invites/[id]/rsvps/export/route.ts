import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/redis";
import { listRsvps } from "@/features/rsvp/services";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rl = await rateLimit("exportCsv", user.id);
    if (!rl.success) return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });

    const { items } = await listRsvps(id, user.id, 1, 1000);

    const headers = ["Name", "Email", "Phone", "Status", "Party Size", "Meal", "Message", "Submitted"];
    const rows = items.map((r) => [
      r.name,
      r.email ?? "",
      r.phone ?? "",
      r.status,
      String(r.partySize ?? 1),
      r.meal ?? "none",
      (r.message ?? "").replace(/"/g, '""'),
      (r.createdAt as Date)?.toISOString() ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="rsvps-${id}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
}
