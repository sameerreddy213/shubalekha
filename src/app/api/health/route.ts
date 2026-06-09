import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Lightweight health check. Does not touch the database. */
export function GET() {
  return NextResponse.json({ data: { status: "ok", service: "shubalekha" } });
}
