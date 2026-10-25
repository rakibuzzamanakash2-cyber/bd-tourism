import Link from "next/link";
import { GuideAvatar } from "@/components/guides/guide-avatar";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CANCELLABLE_STATUSES,
  calculateRefund,
  formatDateRange,
  serviceFeeFromDetails,
} from "@/lib/booking-utils";
import { CancelBookingButton } from "@/components/booking/cancel-booking";
import { PERMIT_STATUS } from "@/lib/permit-labels";
import { expireUnpaidBookings } from "@/lib/booking-expiry";

type PageProps = {
  params: Promise<{ id: string }>;
};

const statusConfig: Record<
  string,
  { label: string; className: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "border-ink-mute/30 bg-paper text-ink-mute",
    description: "This booking hasn't been submitted yet.",
  },
  PAYMENT_PENDING: {
    label: "Payment pending",
    className: "border-clay-600/40 bg-clay-500/10 text-clay-700",
    description: "Complete payment to confirm your booking.",
  },
  PAID: {
    label: "Paid",
    className: "border-forest-700/40 bg-forest-100 text-forest-800",
    description:
      "Payment received. We're finalising your itinerary and permits (if applicable).",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "border-forest-700/40 bg-forest-100 text-forest-800",
    description: "You're all set. Look for a full brief 7 days before your trip.",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "border-forest-700/40 bg-forest-100 text-forest-800",
    description: "Enjoy the trip. We'll be in touch if anything comes up.",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-forest-900/20 bg-forest-900/10 text-forest-900",
    description: "Thanks for travelling with us. Leave a review?",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-ink-mute/30 bg-paper text-ink-mute",
    description: "This booking is cancelled.",
  },
  DISPUTED: {
    label: "Disputed",
    className: "border-clay-600/40 bg-clay-500/10 text-clay-700",
    description: "This booking is under review — we'll be in touch soon.",
  },
};

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  await expireUnpaidBookings(user.id);

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      package: {
        include: {
          itinerary: {
            orderBy: { dayNumber: "asc" },
            include: {
              destination: { include: { region: true } },
            },
          },
        },
      },
      permits: {
        include: { region: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      guideAssignments: {
        where: { status: "ACCEPTED" },
        include: { guide: { select: { slug: true, displayName: true, photoUrl: true, languages: true, yearsExperience: true, phone: true } } },
        take: 1,
      },
    },
  });

  if (!booking) notFound();

  // Security — only the owner can view their booking
  if (booking.touristId !== user.id) notFound();

  const status = statusConfig[booking.status] ?? statusConfig.DRAFT;

  // Their guide, once one has accepted. The guide's number shows from three
  // days before the trip (before that, travelers talk to us).
  const guide = booking.status !== "CANCELLED" ? booking.guideAssignments[0]?.guide : undefined;
  const showGuidePhone = guide ? daysUntilTrip(booking.startDate) <= 3 : false;

  // Refund the tourist would get if they cancelled now (null = can't cancel)
  const cancelQuote = (CANCELLABLE_STATUSES as readonly string[]).includes(booking.status)
    ? calculateRefund({
        totalUSD: Number(booking.totalAmountUSD),
        serviceFeeUSD: serviceFeeFromDetails(booking.specialRequests),
        startDate: booking.startDate,
        paid: booking.status !== "PAYMENT_PENDING",
      })
    : null;
  const priceUSD = Number(booking.totalAmountUSD);
  const pricePerPerson = booking.package
    ? Number(booking.package.basePriceUSD)
    : 0;

  // Parse the details payload we stashed in specialRequests
  let details: {
    primaryContact?: { name: string; email: string; phone: string };
    additionalTravelers?: {
      name: string;
      passportNumber: string;
      nationality: string;
    }[];
    notes?: string;
  } | null = null;
  if (booking.specialRequests) {
    try {
      details = JSON.parse(booking.specialRequests);
    } catch {
      details = { notes: booking.specialRequests };
    }
  }

  return (
    <>
      {/* Back link */}
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800"
      >
        <ArrowLeft className="size-4" />
        All bookings
      </Link>

      {/* Header */}
      <div className="mt-6">
        <p className="eyebrow text-forest-700">
          Booking · {booking.bookingCode}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
          {booking.package?.title ?? "Custom trip"}
        </h1>
        <p className="mt-3 text-ink-soft">
          {formatDateRange(booking.startDate, booking.endDate)} ·{" "}
          {booking.travelerCount}{" "}
          {booking.travelerCount === 1 ? "traveler" : "travelers"}
        </p>
      </div>

      {/* Status card */}
      <div className="mt-10 rounded-lg border border-forest-900/10 bg-paper-warm p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-wider",
                status.className,
              )}
            >
              {status.label}
            </span>
            <p className="mt-4 max-w-md leading-relaxed text-ink">
              {status.description}
            </p>
            {booking.status === "CANCELLED" && (
              <div className="mt-4 space-y-1 text-sm text-ink-soft">
                {booking.cancellationReason && <p>Reason: {booking.cancellationReason}</p>}
                {booking.refundAmountUSD !== null && (
                  <p className="font-medium text-ink">
                    {Number(booking.refundAmountUSD) > 0
                      ? `Refund due: $${Number(booking.refundAmountUSD).toFixed(2)}, sent within 7–10 working days.`
                      : "No refund is due under the cancellation policy."}
                  </p>
                )}
              </div>
            )}
          </div>
          {booking.status === "PAYMENT_PENDING" && (
            <Link
              href={`/dashboard/bookings/${booking.id}/pay`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full bg-forest-900 text-paper hover:bg-forest-800",
              )}
            >
              Pay ${priceUSD.toFixed(0)}
            </Link>
          )}
        </div>
      </div>

      {/* Body — two column */}
      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-16">
        <div className="lg:col-span-2 space-y-10">
          {guide && (
            <section className="flex items-center gap-5 rounded-lg border border-forest-900/10 bg-paper-warm p-5">
              <GuideAvatar name={guide.displayName} photoUrl={guide.photoUrl} className="size-20 shrink-0 rounded-full" sizes="80px" />
              <div className="min-w-0">
                <p className="eyebrow text-forest-700">Your guide</p>
                <Link href={`/guides/${guide.slug}`} className="mt-1 block font-display text-2xl hover:text-forest-800">{guide.displayName}</Link>
                <p className="text-sm text-ink-soft">
                  {guide.yearsExperience} years guiding · speaks {guide.languages.join(", ")}
                </p>
                <p className="mt-1 text-sm">
                  {showGuidePhone ? (
                    <a href={`https://wa.me/${guide.phone.replace(/^\+/, "")}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                      WhatsApp {guide.displayName.split(/\s+/)[0]}: {guide.phone}
                    </a>
                  ) : (
                    <span className="text-ink-mute">Their WhatsApp number appears here three days before the trip.</span>
                  )}
                </p>
              </div>
            </section>
          )}
          {/* Itinerary preview */}
          {booking.package && booking.package.itinerary.length > 0 && (
            <section>
              <p className="eyebrow mb-3 text-forest-700">Itinerary</p>
              <h2 className="font-display text-2xl">Day by day.</h2>
              <ol className="mt-8 space-y-8 border-l-2 border-forest-900/10 pl-8">
                {booking.package.itinerary.map((day) => (
                  <li key={day.id} className="relative">
                    <span className="absolute -left-[41px] top-0 flex size-6 items-center justify-center rounded-full bg-forest-900 font-display text-xs text-paper">
                      {day.dayNumber}
                    </span>
                    <h3 className="font-display text-xl leading-tight">
                      {day.title}
                    </h3>
                    {day.destination && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-forest-800">
                        <MapPin className="size-3.5" />
                        {day.destination.name} ·{" "}
                        <span className="text-ink-mute">
                          {day.destination.region.name}
                        </span>
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                      {day.description}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Permits */}
          {booking.permits.length > 0 && booking.status !== "CANCELLED" && (
            <section>
              <p className="eyebrow mb-3 text-forest-700">Permits</p>
              <h2 className="font-display text-2xl">Restricted-area permits.</h2>
              <ul className="mt-6 divide-y divide-forest-900/10 rounded-lg border border-forest-900/10">
                {booking.permits.map((p) => {
                  const info = PERMIT_STATUS[p.status];
                  return (
                    <li key={p.id} className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-ink">{p.region.name}</p>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-0.5 text-xs uppercase tracking-wider",
                            info.tone === "green" && "border-forest-700/40 bg-forest-100 text-forest-800",
                            info.tone === "amber" && "border-clay-600/40 bg-clay-500/10 text-clay-700",
                            info.tone === "grey" && "border-ink-mute/30 bg-paper text-ink-soft",
                            info.tone === "red" && "border-clay-700/40 bg-clay-600/15 text-clay-700",
                          )}
                        >
                          {info.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{info.traveler}</p>
                      {p.noteToTraveler && (
                        <p className="mt-3 rounded-md bg-paper-warm px-3 py-2 text-sm text-ink">
                          <span className="font-medium">Note from our team:</span> {p.noteToTraveler}
                        </p>
                      )}
                      {p.referenceNumber && p.status === "APPROVED" && (
                        <p className="mt-2 text-xs text-ink-mute">Permit reference: {p.referenceNumber}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Travelers */}
          {details?.primaryContact && (
            <section>
              <p className="eyebrow mb-3 text-forest-700">Travelers</p>
              <h2 className="font-display text-2xl">On this trip.</h2>
              <div className="mt-6 divide-y divide-forest-900/10 rounded-lg border border-forest-900/10">
                <TravelerRow
                  label="Primary"
                  name={details.primaryContact.name}
                  info={`${details.primaryContact.email} · ${details.primaryContact.phone}`}
                />
                {details.additionalTravelers?.map((t, i) => (
                  <TravelerRow
                    key={i}
                    label={`Traveler #${i + 2}`}
                    name={t.name}
                    info={`${t.nationality} · Passport ${t.passportNumber}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {details?.notes && details.notes.trim() && (
            <section>
              <p className="eyebrow mb-3 text-forest-700">Special requests</p>
              <div className="rounded-lg border border-forest-900/10 bg-paper p-6">
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {details.notes}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-lg border border-forest-900/10 bg-paper p-6">
            <p className="eyebrow text-forest-700">Price</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>
                  {booking.travelerCount} × ${pricePerPerson.toFixed(0)}
                </span>
                <span>${priceUSD.toFixed(0)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-forest-900/10 pt-3">
                <span className="font-medium">Total</span>
                <span className="font-display text-3xl text-forest-900">
                  ${priceUSD.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-forest-900/10 bg-paper-warm p-6">
            <p className="eyebrow text-forest-700">Cancellation</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Cancel more than 14 days before the start date for a full refund.
              Within 14 days: 50% refund. Within 48 hours: no refund. Permit
              fees are non-refundable once processed.
            </p>
            {cancelQuote && (
              <CancelBookingButton
                bookingId={booking.id}
                bookingCode={booking.bookingCode}
                totalUSD={priceUSD}
                quote={cancelQuote}
              />
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function TravelerRow({
  label,
  name,
  info,
}: {
  label: string;
  name: string;
  info: string;
}) {
  return (
    <div className="p-5">
      <p className="eyebrow text-ink-mute">{label}</p>
      <p className="mt-1 font-medium text-ink">{name}</p>
      <p className="mt-0.5 text-xs text-ink-mute">{info}</p>
    </div>
  );
}

function daysUntilTrip(start: Date): number {
  return Math.ceil((start.getTime() - Date.now()) / 86_400_000);
}
