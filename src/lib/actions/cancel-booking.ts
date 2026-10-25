"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releaseGuidesForBooking } from "@/lib/guides";
import { env } from "@/lib/env";
import { notifyTeam, sendEmail, simpleEmail } from "@/lib/email";
import { RATE_LIMITS, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import {
  CANCELLABLE_STATUSES,
  calculateRefund,
  formatDateRange,
  serviceFeeFromDetails,
} from "@/lib/booking-utils";

const schema = z.object({
  bookingId: z.string().min(1).max(64),
  reason: z.string().trim().max(1000).optional(),
});

export type CancelBookingResult =
  | { success: true; refundUSD: number }
  | { success: false; error: string };

export async function cancelBookingAction(input: z.input<typeof schema>): Promise<CancelBookingResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Please sign in again." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const limited = await rateLimit(`cancel:user:${session.user.id}`, RATE_LIMITS.cancelUser);
  if (!limited.ok) return { success: false, error: tooManyMessage(limited.retryAfterSeconds) };

  const booking = await db.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { package: true, payment: true, tourist: true },
  });
  if (!booking || booking.touristId !== session.user.id) {
    return { success: false, error: "Booking not found." };
  }
  if (!(CANCELLABLE_STATUSES as readonly string[]).includes(booking.status)) {
    return { success: false, error: "This booking can no longer be cancelled online. Please contact us." };
  }

  const paid = booking.status === "PAID" || booking.status === "CONFIRMED";
  const quote = calculateRefund({
    totalUSD: Number(booking.totalAmountUSD),
    serviceFeeUSD: serviceFeeFromDetails(booking.specialRequests),
    startDate: booking.startDate,
    paid,
  });

  // Only cancel if the status hasn't changed since we read it (e.g. a payment
  // landing at the same moment)
  const { count } = await db.booking.updateMany({
    where: { id: booking.id, status: booking.status },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: parsed.data.reason || "Cancelled by the traveler",
      refundAmountUSD: paid ? quote.refundUSD : null,
    },
  });
  if (count === 0) {
    return { success: false, error: "This booking just changed. Please refresh and try again." };
  }
  await releaseGuidesForBooking(booking.id, parsed.data.reason || "Cancelled by the traveler");

  const title = booking.package?.title ?? "Custom trip";
  const dates = formatDateRange(booking.startDate, booking.endDate);
  const refundLine = paid
    ? quote.refundUSD > 0
      ? `Refund due: $${quote.refundUSD.toFixed(2)} USD (to be sent within 7–10 working days).`
      : "Under the cancellation policy, no refund is due for this booking."
    : "No payment had been made, so there is nothing to refund.";

  await Promise.all([
    sendEmail({
      to: booking.tourist.email,
      subject: `Booking cancelled — ${booking.bookingCode}`,
      html: simpleEmail("Your booking is cancelled.", [
        `Booking ${booking.bookingCode}: ${title}, ${dates}.`,
        refundLine,
        `View it any time: ${env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}`,
      ]),
    }),
    notifyTeam({
      subject: `Booking cancelled: ${booking.bookingCode}`,
      lines: [
        `${booking.tourist.name ?? booking.tourist.email} cancelled ${title} (${dates}).`,
        refundLine,
        `Reason: ${parsed.data.reason || "(none given)"}`,
      ],
    }),
  ]);

  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  return { success: true, refundUSD: paid ? quote.refundUSD : 0 };
}
