import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/lib/booking-utils";
import { PaymentProcessing } from "@/components/booking/payment-processing";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Payment successful",
};

export default async function PaymentSuccessPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const booking = await db.booking.findUnique({
    where: { id },
    include: { package: true, payment: true },
  });

  if (!booking) notFound();
  if (booking.touristId !== session!.user.id) notFound();

  // Race condition: user might arrive here before IPN webhook has fired.
  // Show a processing state that auto-refreshes until the booking flips to PAID.
  if (booking.status === "PAYMENT_PENDING") {
    return <PaymentProcessing />;
  }

  // If somehow the booking has moved past PAID (e.g. cancelled), send to detail
  if (booking.status !== "PAID" && booking.status !== "CONFIRMED") {
    redirect(`/dashboard/bookings/${id}`);
  }

  const amountPaid = Number(booking.totalAmountUSD);
  const dateRange = formatDateRange(booking.startDate, booking.endDate);

  return (
    <div>
      {/* Celebration header */}
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-forest-100">
          <CheckCircle2 className="size-9 text-forest-700" strokeWidth={2} />
        </div>
        <p className="eyebrow mt-8 text-forest-700">Payment received</p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          You&rsquo;re going to Bangladesh.
        </h1>
        <p className="mt-4 max-w-lg mx-auto leading-relaxed text-ink-soft">
          Your booking is confirmed. We&rsquo;ve emailed a receipt to
          <span className="text-ink"> {session!.user.email}</span> — check
          your spam folder if it doesn&rsquo;t arrive within a few minutes.
        </p>
      </div>

      {/* Booking summary card */}
      <div className="mx-auto mt-12 max-w-2xl">
        <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-6 sm:p-8">
          <div className="mb-6 flex items-baseline justify-between border-b border-forest-900/10 pb-4">
            <p className="eyebrow text-forest-700">Booking code</p>
            <p className="font-mono text-lg font-medium text-forest-900">
              {booking.bookingCode}
            </p>
          </div>

          <dl className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-ink-mute">Tour</dt>
              <dd className="col-span-2 font-medium text-ink">
                {booking.package?.title ?? "Custom trip"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-ink-mute">Dates</dt>
              <dd className="col-span-2 text-ink">{dateRange}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-ink-mute">Travelers</dt>
              <dd className="col-span-2 text-ink">
                {booking.travelerCount}{" "}
                {booking.travelerCount === 1 ? "traveler" : "travelers"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-forest-900/10 pt-4">
              <dt className="text-ink-mute">Amount paid</dt>
              <dd className="col-span-2">
                <span className="font-display text-2xl text-forest-900">
                  ${amountPaid.toFixed(2)}
                </span>
                <span className="ml-1 text-sm text-ink-mute">USD</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* CTA row */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full bg-forest-900 text-paper hover:bg-forest-800",
            )}
          >
            View booking
            <ArrowRight className="ml-2 size-4" />
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ size: "lg", variant: "ghost" }),
              "rounded-full border border-forest-900/20 hover:bg-forest-100",
            )}
          >
            Back to dashboard
          </Link>
        </div>

        {/* Email hint */}
        <div className="mt-12 rounded-lg border border-forest-900/10 bg-paper p-5">
          <div className="flex gap-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-forest-700" />
            <div>
              <p className="text-sm font-medium text-ink">
                Receipt on the way
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                A confirmation email with the full receipt is being sent to
                your account address. If you don&rsquo;t see it in 10 minutes,
                check your spam folder or contact us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
