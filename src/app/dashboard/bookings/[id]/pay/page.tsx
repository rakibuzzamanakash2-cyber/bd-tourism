import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PayForm } from "@/components/booking/pay-form";
import { features } from "@/lib/env";
import { payableAmounts } from "@/lib/payments";
import { paymentMode } from "@/lib/sslcommerz";
import { whatsappLink } from "@/lib/site";
import { formatDateRange } from "@/lib/booking-utils";
import { expireUnpaidBookings } from "@/lib/booking-expiry";
import { bookingTitle, stayNightKeys } from "@/lib/homestay-shared";
import { serviceFeeFromDetails } from "@/lib/booking-utils";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Complete payment",
};

export default async function PayPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  await expireUnpaidBookings(user.id);

  const booking = await db.booking.findUnique({
    where: { id },
    include: { package: true, homestay: { select: { name: true, region: { select: { isRestricted: true } } } } },
  });

  if (!booking) notFound();
  if (booking.touristId !== user.id) notFound();
  if (booking.status !== "PAYMENT_PENDING") {
    redirect(`/dashboard/bookings/${booking.id}`);
  }

  const totalUSD = Number(booking.totalAmountUSD);
  const amounts = payableAmounts(booking);
  const mode = paymentMode();
  const perPerson = booking.package
    ? Number(booking.package.basePriceUSD)
    : 0;
  // Stays: the permit fee (if any) is recorded in the booking details
  // The line items always add up to the stored total: total minus any permit fee
  const permitFee = serviceFeeFromDetails(booking.specialRequests);
  const tourTotal = Math.round((totalUSD - permitFee) * 100) / 100;
  const serviceFee = totalUSD - tourTotal;
  const stayNights = booking.homestay ? stayNightKeys(booking.startDate, booking.endDate).length : 0;
  const hasServiceFee = serviceFee > 0.01;

  return (
    <div>
      <Link
        href={`/dashboard/bookings/${booking.id}`}
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800"
      >
        <ArrowLeft className="size-4" />
        Back to booking
      </Link>

      <div className="mt-6">
        <p className="eyebrow text-forest-700">
          Payment · {booking.bookingCode}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
          Complete your booking.
        </h1>
        <p className="mt-3 text-ink-soft">
          {bookingTitle(booking)} ·{" "}
          {formatDateRange(booking.startDate, booking.endDate)}
        </p>
      </div>

      <div className="mt-10 max-w-2xl">
        {/* Price summary */}
        <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-6">
          <p className="eyebrow text-forest-700">You&rsquo;re paying</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>
                {booking.homestay
                  ? `Homestay · ${stayNights} ${stayNights === 1 ? "night" : "nights"}, ${booking.travelerCount} ${booking.travelerCount === 1 ? "guest" : "guests"}`
                  : `Tour · ${booking.travelerCount} × $${perPerson.toFixed(0)}`}
              </span>
              <span>${tourTotal.toFixed(2)}</span>
            </div>
            {hasServiceFee && (
              <div className="flex justify-between text-ink-soft">
                <span>Permit processing fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-forest-900/10 pt-3">
              <span className="font-medium text-ink">Total</span>
              <span className="text-right">
                <span className="block font-display text-3xl text-forest-900">${totalUSD.toFixed(2)}</span>
                <span className="text-xs text-ink-mute">or ৳{amounts.bdt.toLocaleString("en-US")}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="mt-8">
          {features.payments ? (
            <>
              {mode === "sandbox" && (
                <p role="note" className="mb-4 rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-700">
                  Test mode: this opens the SSLCommerz sandbox and no real money is taken.
                </p>
              )}
              <PayForm bookingId={booking.id} usd={amounts.usd} bdt={amounts.bdt} />
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-mute">
                <Lock className="size-3" />
                Secure payment via SSLCommerz. Your card details never touch our servers.
              </p>
            </>
          ) : (
            <div className="rounded-lg border border-forest-900/10 p-6">
              <p className="font-medium">Online payment is coming soon</p>
              <p className="mt-2 text-sm text-ink-soft">
                For now, pay by bKash, Nagad or bank transfer: message us on WhatsApp with your booking code{" "}
                <span className="font-mono">{booking.bookingCode}</span> and we&rsquo;ll send the details. Your booking is confirmed as soon as
                the payment arrives. The total is <strong>${amounts.usd.toFixed(2)}</strong> or <strong>৳{amounts.bdt.toLocaleString("en-US")}</strong>.
              </p>
              <a
                href={whatsappLink(`Hi DeltaWay, I'd like to pay for booking ${booking.bookingCode} ($${amounts.usd.toFixed(2)} / ৳${amounts.bdt}).`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full bg-forest-900 px-6 py-3 text-sm font-medium text-paper hover:bg-forest-800"
              >
                Pay via WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* What happens next */}
        <div className="mt-10 rounded-lg border border-forest-900/10 bg-paper p-6">
          <p className="eyebrow text-forest-700">What happens next</p>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            <li className="flex gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-900 text-xs font-medium text-paper">
                1
              </span>
              You&rsquo;re redirected to the SSLCommerz secure payment page.
            </li>
            <li className="flex gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-900 text-xs font-medium text-paper">
                2
              </span>
              Choose your payment method — bKash, Nagad, card, or bank transfer.
            </li>
            <li className="flex gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-900 text-xs font-medium text-paper">
                3
              </span>
              After payment, you&rsquo;re returned to your booking automatically.
            </li>
            <li className="flex gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-900 text-xs font-medium text-paper">
                4
              </span>
              {hasServiceFee
                ? "Your permit application starts within 24 hours."
                : "We confirm your booking within 24 hours."}
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
