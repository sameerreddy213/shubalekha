import { NextRequest, NextResponse } from "next/server";
import { resolveGuestName } from "@/features/guestlinks/services";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ data: null });
  const guestName = await resolveGuestName(token);
  return NextResponse.json({ data: { guestName } });
}
