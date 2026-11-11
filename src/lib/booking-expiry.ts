import "server-only";
import { db } from "@/lib/db";
import { EXPIRED_BOOKING_REASON, QUOTE_VALID_DAYS, UNPAID_BOOKING_TTL_HOURS } from "@/lib/booking-utils";

/**
 * Cancels bookings that have waited for payment longer than the limit.
 * Runs from the scheduled job, and also "lazily" whenever a tourist opens
 * their bookings, so the dashboard is always correct even between job runs.
 *
 * Pass a userId to only expire that tourist's bookings (cheap, for pages).
 */
export async function expireUnpaidBookings(userId?: string): Promise<number> {
  const cutoff = new Date(Date.now() - UNPAID_BOOKING_TTL_HOURS * 36e5);
  const quoteCutoff = new Date(Date.now() - QUOTE_VALID_DAYS * 864e5);
  const { count } = await db.booking.updateMany({
    where: {
      status: "PAYMENT_PENDING",
      ...(userId && { touristId: userId }),
      AND: [
        // The clock starts when the price is known: at booking for a tour,
        // or when we send the quote for a custom trip
        { OR: [{ quotedAt: null, createdAt: { lt: cutoff } }, { quotedAt: { lt: quoteCutoff } }] },
        // Don't expire a booking while its payment is still being confirmed
        // in the last few minutes
        { OR: [{ payment: null }, { payment: { updatedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } } }] },
      ],
    },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: EXPIRED_BOOKING_REASON,
    },
  });
  return count;
}
