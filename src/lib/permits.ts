import "server-only";
import { db } from "@/lib/db";

const PAID_STATUSES = ["PAID", "CONFIRMED", "IN_PROGRESS"];

/**
 * Makes sure a paid booking has one permit record for each restricted
 * region its tour visits. Safe to call any number of times.
 * Returns how many were created.
 */
export async function ensurePermitsForBooking(bookingId: string): Promise<number> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      package: {
        select: { itinerary: { select: { destination: { select: { region: { select: { id: true, isRestricted: true } } } } } } },
      },
    },
  });
  if (!booking || !PAID_STATUSES.includes(booking.status)) return 0;

  const regionIds = [
    ...new Set(
      (booking.package?.itinerary ?? [])
        .map((d) => d.destination?.region)
        .filter((r): r is { id: string; isRestricted: boolean } => Boolean(r?.isRestricted))
        .map((r) => r.id),
    ),
  ];
  if (regionIds.length === 0) return 0;

  const { count } = await db.permit.createMany({
    data: regionIds.map((regionId) => ({ bookingId, regionId })),
    skipDuplicates: true,
  });
  return count;
}
