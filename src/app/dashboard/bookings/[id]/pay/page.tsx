import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PayForm } from "@/components/booking/pay-form";
import { formatDateRange } from "@/lib/booking-utils";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Complete payment",
};

export default async function PayPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const booking = await db.booking.findUnique({
    where: { id },
    include: { package: true },
  });

  if (!booking) notFound();
  if (booking.touristId !== session!.user.id) notFound();
  if (booking.status !== "PAYMENT_PENDING") {
    redirect(`/dashboard/bookings/${booking.id}`);
  }

  const totalUSD = Number(booking.totalAmountUSD);
  const perPerson = booking.package
    ? Number(booking.package.basePriceUSD)
    : 0;
  const tourTotal = perPerson * booking.travelerCount;
  const serviceFee = totalUSD - tourTotal;
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
          {booking.package?.title ?? "Custom trip"} ·{" "}
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
                Tour · {booking.travelerCount} × ${perPerson.toFixed(0)}
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
              <span className="font-medium text-ink">Total (USD)</span>
              <span className="font-display text-3xl text-forest-900">
                ${totalUSD.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment button */}
        <div className="mt-8">
          <PayForm bookingId={booking.id} amount={totalUSD} />
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-mute">
            <Lock className="size-3" />
            Secure payment via SSLCommerz. Your card details never touch our
            servers.
          </p>
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
