import { NextRequest, NextResponse } from "next/server";
import { receiptForBooking } from "@/lib/receipts";
import { db } from "@/lib/db";
import { validatePayment } from "@/lib/sslcommerz";
import { notifyTeam, sendPaymentReceipt } from "@/lib/email";
import { EXPIRED_BOOKING_REASON, formatDateRange } from "@/lib/booking-utils";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { ensurePermitsForBooking } from "@/lib/permits";
import { homestayTakenNights, onStayPaid } from "@/lib/homestays";
import { bookingTitle } from "@/lib/homestay-shared";
import { bookingCodeFromTranId, type Attempts } from "@/lib/payments";

// SSLCommerz sends form-encoded POST to this endpoint after payment.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const raw: Record<string, string> = {};
    for (const [k, v] of form.entries()) {
      raw[k] = v.toString();
    }

    const tranId = raw.tran_id;
    const valId = raw.val_id;
    const status = raw.status;

    if (!tranId) {
      return NextResponse.json({ error: "Missing tran_id" }, { status: 400 });
    }

    const include = {
      booking: { include: { package: true, homestay: { select: { name: true } }, tourist: true } },
    } satisfies Prisma.PaymentInclude;
    // The latest attempt is on the payment row; an earlier attempt (paid in a
    // tab opened before) is found through the booking code in the tran_id.
    let payment = await db.payment.findFirst({ where: { providerTxnId: tranId }, include });
    if (!payment) {
      const byCode = await db.payment.findFirst({ where: { booking: { bookingCode: bookingCodeFromTranId(tranId) } }, include });
      if (byCode && ((byCode.attempts as Attempts | null) ?? {})[tranId]) payment = byCode;
    }

    if (!payment) {
      console.warn(`[IPN] Payment not found for tran_id: ${tranId}`);
      return NextResponse.json({ ok: true });
    }

    // SSLCommerz can send the same IPN more than once. If we've already
    // recorded this payment as successful, do nothing (no duplicate emails).
    if (payment.status === "SUCCEEDED") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // Failure paths
    if (status !== "VALID" && status !== "VALIDATED") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          providerRaw: raw as Prisma.InputJsonValue,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (!valId) {
      return NextResponse.json({ error: "Missing val_id" }, { status: 400 });
    }

    const validation = await validatePayment(valId);

    // Never trust the gateway result alone: the validated transaction must be
    // THIS transaction, for the FULL amount, in USD. Otherwise someone could
    // replay a cheaper payment's val_id against an expensive booking.
    // What THIS attempt asked for (older payments only ever asked in USD)
    const attempt = ((payment.attempts as Attempts | null) ?? {})[tranId];
    const expectedCurrency = attempt?.currency ?? "USD";
    const expectedAmount = attempt?.amount ?? Number(payment.amountUSD);
    const paidAmount = validation.currencyAmount ?? validation.amount;
    const paidCurrency = validation.currencyType ?? validation.currency;
    const matches =
      validation.tranId === tranId &&
      paidCurrency === expectedCurrency &&
      paidAmount !== undefined &&
      Math.abs(paidAmount - expectedAmount) < 0.01;

    if (validation.valid && !matches) {
      console.error(
        `[IPN] Mismatch for ${tranId}: expected ${expectedAmount} ${expectedCurrency}, got ${paidAmount} ${paidCurrency} (tran ${validation.tranId})`,
      );
    }

    if (!validation.valid || !matches) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          providerRaw: (validation.raw ?? raw) as Prisma.InputJsonValue,
        },
      });
      return NextResponse.json({ ok: false, error: "Validation failed" });
    }

    // A payment can land after the booking was cancelled:
    //  • expired for non-payment → bring the booking back as PAID
    //  • cancelled by the tourist  → keep it cancelled, owe a full refund
    const wasCancelled = payment.booking.status === "CANCELLED";
    let wasExpired =
      wasCancelled && payment.booking.cancellationReason === EXPIRED_BOOKING_REASON;
    // A homestay's nights may have gone to someone else after this booking
    // expired. Then it can't come back: keep it cancelled and refund in full.
    if (wasExpired && payment.booking.homestayId) {
      const taken = await homestayTakenNights(payment.booking.homestayId, payment.booking.startDate, payment.booking.endDate, payment.bookingId);
      if (taken.booked.length || taken.blocked.length) wasExpired = false;
    }
    const bookingUpdate: Prisma.BookingUpdateInput =
      wasCancelled && !wasExpired
        ? { refundAmountUSD: payment.booking.totalAmountUSD }
        : { status: "PAID", cancelledAt: null, cancellationReason: null };

    // Payment succeeded — atomic update
    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          paidAt: new Date(),
          providerTxnId: tranId,
          currency: expectedCurrency,
          amountBDT: expectedCurrency === "BDT" ? expectedAmount : (validation.amount ?? null),
          exchangeRate: expectedCurrency === "BDT" ? payment.exchangeRate : (validation.raw?.currency_rate ? Number(validation.raw.currency_rate) : null),
          method: validation.cardType ?? null,
          bankTranId: validation.bankTranId ?? null,
          providerRaw: (validation.raw ?? raw) as Prisma.InputJsonValue,
        },
      }),
      db.booking.update({
        where: { id: payment.bookingId },
        data: bookingUpdate,
      }),
    ]);

    if (!wasCancelled || wasExpired) {
      await ensurePermitsForBooking(payment.bookingId);
      await onStayPaid(payment.bookingId);
    }

    if (wasCancelled && !wasExpired) {
      await notifyTeam({
        subject: `Payment received for a cancelled booking: ${payment.booking.bookingCode}`,
        lines: [
          `A payment of $${Number(payment.booking.totalAmountUSD).toFixed(2)} arrived after the traveler cancelled.`,
          "The booking stays cancelled and the full amount is recorded as a refund due.",
        ],
      });
      return NextResponse.json({ ok: true });
    }

    console.log(
      `[IPN] Payment succeeded for booking ${payment.booking.bookingCode}`,
    );

    // Send email receipt — non-blocking (don't fail the webhook if email fails)
    try {
      // Detect if this booking involves a restricted region by looking at
      // the stored specialRequests payload we set at booking creation time
      let hasPermit = false;
      if (payment.booking.specialRequests) {
        try {
          const details = JSON.parse(payment.booking.specialRequests);
          hasPermit = !!details?.permitContext?.isRestricted;
        } catch {
          // Ignore parse errors
        }
      }

      const baseUrl = env.NEXT_PUBLIC_APP_URL;
      const bookingUrl = `${baseUrl}/dashboard/bookings/${payment.bookingId}`;

      await sendPaymentReceipt({
        to: payment.booking.tourist.email,
        travelerName:
          payment.booking.tourist.name?.split(/\s+/)[0] ?? "Traveler",
        bookingCode: payment.booking.bookingCode,
        packageTitle: bookingTitle(payment.booking),
        dateRange: formatDateRange(
          payment.booking.startDate,
          payment.booking.endDate,
        ),
        travelerCount: payment.booking.travelerCount,
        amountPaid: Number(payment.booking.totalAmountUSD),
        bookingUrl,
        hasPermit,
        attachment: await receiptForBooking(payment.bookingId)
          .then((r) => (r ? { filename: r.filename, content: r.pdf } : undefined))
          .catch(() => undefined),
      });
    } catch (emailErr) {
      console.error("[IPN] Failed to send receipt email:", emailErr);
      // Don't fail the webhook — email is a nice-to-have
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[IPN] Handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
