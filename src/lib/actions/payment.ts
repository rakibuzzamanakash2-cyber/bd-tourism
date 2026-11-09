"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { RATE_LIMITS, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import { initiatePayment, type PayCurrency } from "@/lib/sslcommerz";
import { payableAmounts, type Attempts } from "@/lib/payments";
import type { Prisma } from "@prisma/client";
import { expireUnpaidBookings } from "@/lib/booking-expiry";
import { EXPIRED_BOOKING_REASON } from "@/lib/booking-utils";
import { bookingTitle } from "@/lib/homestay-shared";

export type InitiatePaymentResult =
  | { success: true; gatewayUrl: string }
  | { success: false; error: string };

export async function initiatePaymentAction(
  bookingId: string,
  currency: PayCurrency = "USD",
): Promise<InitiatePaymentResult> {
  if (currency !== "USD" && currency !== "BDT") return { success: false, error: "Choose USD or BDT." };
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to pay." };
  }

  const limited = await rateLimit(`payment:user:${session.user.id}`, RATE_LIMITS.paymentUser);
  if (!limited.ok) {
    return { success: false, error: tooManyMessage(limited.retryAfterSeconds) };
  }

  await expireUnpaidBookings(session.user.id);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { package: true, homestay: { select: { name: true } }, payment: true },
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
      error:
        booking.cancellationReason === EXPIRED_BOOKING_REASON
          ? "This booking expired because payment wasn't completed within 24 hours. Please book again."
          : "This booking is not awaiting payment.",
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
  // Fix the amount now, in the chosen currency. The IPN checks against it.
  const amounts = payableAmounts(booking);
  const amount = currency === "BDT" ? amounts.bdt : amounts.usd;

  const result = await initiatePayment({
    amount,
    currency,
    tranId,
    bookingCode: booking.bookingCode,
    packageTitle: bookingTitle(booking),
    customer,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Keep every attempt: someone may pay in a gateway tab they opened earlier
  const attempts: Attempts = { ...((booking.payment?.attempts as Attempts | null) ?? {}), [tranId]: { currency, amount, at: new Date().toISOString() } };
  const fields = {
    amountUSD: booking.totalAmountUSD,
    currency,
    amountBDT: currency === "BDT" ? amounts.bdt : null,
    exchangeRate: currency === "BDT" ? amounts.rate : null,
    providerTxnId: tranId,
    attempts: attempts as Prisma.InputJsonValue,
  };
  await db.payment.upsert({
    where: { bookingId: booking.id },
    create: { bookingId: booking.id, provider: "sslcommerz", status: "PENDING", ...fields },
    update: { ...fields, status: "PENDING" },
  });

  return { success: true, gatewayUrl: result.gatewayUrl };
}
