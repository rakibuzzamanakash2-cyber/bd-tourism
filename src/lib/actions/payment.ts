"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { RATE_LIMITS, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import { initiatePayment } from "@/lib/sslcommerz";

export type InitiatePaymentResult =
  | { success: true; gatewayUrl: string }
  | { success: false; error: string };

export async function initiatePaymentAction(
  bookingId: string,
): Promise<InitiatePaymentResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to pay." };
  }

  const limited = await rateLimit(`payment:user:${session.user.id}`, RATE_LIMITS.paymentUser);
  if (!limited.ok) {
    return { success: false, error: tooManyMessage(limited.retryAfterSeconds) };
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { package: true, payment: true },
  });

  if (!booking) {
    return { success: false, error: "Booking not found." };
  }

  if (booking.touristId !== session.user.id) {
    return { success: false, error: "You don't have access to this booking." };
  }

  if (booking.status !== "PAYMENT_PENDING") {
    return {
      success: false,
      error: "This booking is not awaiting payment.",
    };
  }

  // Extract customer info from the stored details payload
  let customer = {
    name: session.user.name ?? "Traveler",
    email: session.user.email ?? "",
    phone: "0000000000",
  };
  if (booking.specialRequests) {
    try {
      const details = JSON.parse(booking.specialRequests);
      if (details?.primaryContact) {
        customer = {
          name: details.primaryContact.name ?? customer.name,
          email: details.primaryContact.email ?? customer.email,
          phone: details.primaryContact.phone ?? customer.phone,
        };
      }
    } catch {
      // Ignore JSON parse errors; use defaults
    }
  }

  const tranId = `${booking.bookingCode}-${Date.now()}`;

  const result = await initiatePayment({
    amountUSD: Number(booking.totalAmountUSD),
    tranId,
    bookingCode: booking.bookingCode,
    packageTitle: booking.package?.title ?? "Custom trip",
    customer,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  await db.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amountUSD: booking.totalAmountUSD,
      currency: "USD",
      provider: "sslcommerz",
      providerTxnId: tranId,
      status: "PENDING",
    },
    update: {
      providerTxnId: tranId,
      status: "PENDING",
    },
  });

  return { success: true, gatewayUrl: result.gatewayUrl };
}
