import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { expireUnpaidBookings } from "@/lib/booking-expiry";
import { remindStaleDrafts } from "@/lib/application-reminders";
import { remindUnansweredTrips } from "@/lib/guide-reminders";

// Daily housekeeping, called by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set in the project.
// Each job runs on its own so one failing doesn't stop the others.
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jobs = { expiredBookings: expireUnpaidBookings, draftReminders: () => remindStaleDrafts(), guideReminders: () => remindUnansweredTrips() };
  const results: Record<string, number | string> = {};
  for (const [name, job] of Object.entries(jobs)) {
    try {
      results[name] = await job();
    } catch (e) {
      console.error(`[cron/daily] ${name} failed`, e);
      results[name] = "failed";
    }
  }
  const failed = Object.values(results).includes("failed");
  return NextResponse.json({ ok: !failed, ...results }, { status: failed ? 500 : 200 });
}
