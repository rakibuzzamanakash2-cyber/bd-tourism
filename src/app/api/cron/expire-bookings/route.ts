import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { expireUnpaidBookings } from "@/lib/booking-expiry";

// Called by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set in the project.
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expired = await expireUnpaidBookings();
  return NextResponse.json({ ok: true, expired });
}
