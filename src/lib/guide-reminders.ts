import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { emailGuide, notifyTeam, tripInfo } from "@/lib/guides";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Trip requests a guide hasn't answered in a day: remind the guide once and
 * tell the team, so a trip never sits without a guide unnoticed.
 */
export async function remindUnansweredTrips(now = new Date()): Promise<number> {
  const stale = await db.guideAssignment.findMany({
    where: { status: "PENDING", reminderSentAt: null, createdAt: { lt: new Date(now.getTime() - DAY) }, booking: { status: { not: "CANCELLED" } } },
    include: { guide: { include: { user: { select: { email: true } } } }, booking: { include: { package: { select: { title: true } } } } },
    take: 100,
  });
  let n = 0;
  for (const a of stale) {
    const { count } = await db.guideAssignment.updateMany({ where: { id: a.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (!count) continue;
    const trip = tripInfo(a.booking, a.feeBDT);
    await Promise.all([
      emailGuide("request", a.guide, trip),
      notifyTeam({
        subject: `${a.guide.displayName} hasn't answered ${a.booking.bookingCode} yet`,
        lines: [`${trip.title}, ${trip.dates}. Asked over a day ago.`, `Call them, or pick someone else: ${env.NEXT_PUBLIC_APP_URL}/admin/bookings/${a.bookingId}`],
      }),
    ]);
    n++;
  }
  return n;
}
