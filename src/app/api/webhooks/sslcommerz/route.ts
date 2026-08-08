import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validatePayment } from "@/lib/sslcommerz";
import { sendPaymentReceipt } from "@/lib/email";
import { formatDateRange } from "@/lib/booking-utils";
import type { Prisma } from "@prisma/client";

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

    const payment = await db.payment.findFirst({
      where: { providerTxnId: tranId },
      include: {
        booking: {
          include: {
            package: true,
            tourist: true,
          },
        },
      },
    });

    if (!payment) {
      console.warn(`[IPN] Payment not found for tran_id: ${tranId}`);
      return NextResponse.json({ ok: true });
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
    if (!validation.valid) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          providerRaw: (validation.raw ?? raw) as Prisma.InputJsonValue,
        },
      });
      return NextResponse.json({ ok: false, error: "Validation failed" });
    }

    // Payment succeeded — atomic update
    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          paidAt: new Date(),
          providerRaw: (validation.raw ?? raw) as Prisma.InputJsonValue,
        },
      }),
      db.booking.update({
        where: { id: payment.bookingId },
        data: { status: "PAID" },
      }),
    ]);

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

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const bookingUrl = `${baseUrl}/dashboard/bookings/${payment.bookingId}`;

      await sendPaymentReceipt({
        to: payment.booking.tourist.email,
        travelerName:
          payment.booking.tourist.name?.split(/\s+/)[0] ?? "Traveler",
        bookingCode: payment.booking.bookingCode,
        packageTitle: payment.booking.package?.title ?? "Custom trip",
        dateRange: formatDateRange(
          payment.booking.startDate,
          payment.booking.endDate,
        ),
        travelerCount: payment.booking.travelerCount,
        amountPaid: Number(payment.booking.totalAmountUSD),
        bookingUrl,
        hasPermit,
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
