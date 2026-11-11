import Link from "next/link";
import { GuideAvatar } from "@/components/guides/guide-avatar";
import { Stars } from "@/components/reviews/stars";
import { reviewEligibility } from "@/lib/reviews";
import { maskedPassport } from "@/lib/travelers";
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
import { bookingTitle, stayNightKeys } from "@/lib/homestay-shared";
import Image from "next/image";

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
  QUOTE_REQUESTED: {
    label: "Waiting for our price",
    className: "border-forest-700/40 bg-forest-100 text-forest-800",
    description: "We're planning your trip. You'll get an email with the plan and the price within 24 hours, and can pay here once it arrives.",
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
      review: { select: { rating: true, createdAt: true, status: true } },
      payment: { select: { status: true } },
      travelers: { select: { id: true, position: true, name: true, nationality: true, passportLast4: true, passportPurgedAt: true }, orderBy: { position: "asc" } },
      homestay: {
        select: { name: true, slug: true, photos: true, area: true, district: true, address: true, phone: true, houseRules: true, host: { select: { name: true } }, region: { select: { name: true } } },
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
        paid: booking.status !== "PAYMENT_PENDING" && booking.status !== "QUOTE_REQUESTED",
      })
    : null;
  const priceUSD = Number(booking.totalAmountUSD);
  const pricePerPerson = booking.package
    ? Number(booking.package.basePriceUSD)
    : 0;

  // Reviews: invite one once the trip is over (or show theirs)
  const reviewState = reviewEligibility(booking, user.id);

  // Homestay bookings: address and the host's number once it's paid
  const stay = booking.homestay;
  const stayNights = stay ? stayNightKeys(booking.startDate, booking.endDate).length : 0;
  const stayPaid = ["PAID", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status);
  // Tours that are booked can suggest a homestay in the same region
  const suggestRegion =
    !stay && booking.package && booking.status !== "CANCELLED"
      ? booking.package.itinerary.map((d) => d.destination?.region).find((r) => r)
      : undefined;

  // Parse the details payload we stashed in specialRequests
  let details: {
    primaryContact?: { name: string; email: string; phone: string };
    additionalTravelers?: {
      name: string;
      passportNumber?: string;
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
          {bookingTitle(booking)}
        </h1>
        <p className="mt-3 text-ink-soft">
          {stay ? (
            <>
              Check-in {formatDateRange(booking.startDate, booking.endDate).replace(/ → | – /, ", check-out ")} · {stayNights}{" "}
              {stayNights === 1 ? "night" : "nights"} · {booking.travelerCount} {booking.travelerCount === 1 ? "guest" : "guests"}
            </>
          ) : (
            <>
              {formatDateRange(booking.startDate, booking.endDate)} · {booking.travelerCount}{" "}
              {booking.travelerCount === 1 ? "traveler" : "travelers"}
            </>
          )}
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
          {(reviewState.ok || booking.review) && (
            <section className="flex flex-col gap-4 rounded-lg border border-forest-700/20 bg-forest-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              {booking.review ? (
                <div className="flex items-center gap-3">
                  <Stars value={booking.review.rating} />
                  <p className="text-sm">
                    Thanks for your review{booking.review.status === "HIDDEN" ? " (it isn't shown publicly)" : ""}.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-forest-900">How was it?</p>
                  <p className="text-sm text-ink-soft">A few honest lines help other travelers choose.</p>
                </div>
              )}
              {reviewState.ok && (
                <Link href={`/dashboard/bookings/${booking.id}/review`} className="shrink-0 rounded-full bg-forest-900 px-5 py-2.5 text-center text-sm font-medium text-paper hover:bg-forest-800">
                  {booking.review ? "Edit review" : "Write a review"}
                </Link>
              )}
            </section>
          )}
          {stay && (
            <section className="overflow-hidden rounded-lg border border-forest-900/10">
              {stay.photos[0] && (
                <div className="relative aspect-[3/1] bg-forest-100">
                  <Image src={stay.photos[0]} alt={stay.name} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
                </div>
              )}
              <div className="space-y-3 p-5 text-sm">
                <p className="eyebrow text-forest-700">Your homestay</p>
                <Link href={`/homestays/${stay.slug}`} className="block font-display text-2xl hover:text-forest-800">{stay.name}</Link>
                <p className="text-ink-soft">{stay.area}, {stay.district} · {stay.region.name}</p>
                {stayPaid ? (
                  <div className="space-y-1 rounded-md bg-paper-warm p-3">
                    {stay.address && <p><span className="text-ink-mute">Address:</span> {stay.address}</p>}
                    <p>
                      <span className="text-ink-mute">Host:</span> {stay.host.name ?? "Your host"} ·{" "}
                      <a href={`https://wa.me/${stay.phone.replace(/^\+/, "")}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">WhatsApp {stay.phone}</a>
                    </p>
                    <p className="text-xs text-ink-mute">Let your host know roughly when you&rsquo;ll arrive. Check-in is from midday unless you agree otherwise.</p>
                  </div>
                ) : (
                  <p className="text-ink-mute">The address and your host&rsquo;s number appear here once the stay is paid.</p>
                )}
                {stay.houseRules && (
                  <details className="text-ink-soft">
                    <summary className="cursor-pointer">House rules</summary>
                    <p className="mt-2 whitespace-pre-line">{stay.houseRules}</p>
                  </details>
                )}
              </div>
            </section>
          )}
          {suggestRegion && (
            <section className="rounded-lg border border-dashed border-forest-900/20 p-5 text-sm">
              <p className="font-medium">Add a night with a local family?</p>
              <p className="mt-1 text-ink-soft">Stay in a verified homestay in {suggestRegion.name} before or after your tour.</p>
              <Link href={`/homestays?region=${suggestRegion.slug}`} className="mt-3 inline-block underline underline-offset-4">See homestays in {suggestRegion.name} →</Link>
            </section>
          )}
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
                {booking.travelers.length > 0
                  ? booking.travelers
                      .filter((t) => t.position > 0)
                      .map((t) => (
                        <TravelerRow
                          key={t.id}
                          label={`Traveler #${t.position + 1}`}
                          name={t.name}
                          info={[t.nationality, maskedPassport(t) && `Passport ${maskedPassport(t)}`].filter(Boolean).join(" · ")}
                        />
                      ))
                  : details.additionalTravelers?.map((t, i) => <TravelerRow key={i} label={`Traveler #${i + 2}`} name={t.name} info={t.nationality ?? ""} />)}
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
              {booking.status === "QUOTE_REQUESTED" ? (
                <p className="text-ink-soft">We&rsquo;re working out the price for your dates and group. Nothing is charged until you accept it.</p>
              ) : (
                <div className="flex justify-between text-ink-soft">
                  <span>
                    {stay
                      ? `${stayNights} ${stayNights === 1 ? "night" : "nights"}`
                      : booking.package
                        ? `${booking.travelerCount} × $${pricePerPerson.toFixed(0)}`
                        : `Custom trip · ${booking.travelerCount} ${booking.travelerCount === 1 ? "traveler" : "travelers"}`}
                  </span>
                  <span>${priceUSD.toFixed(0)}</span>
                </div>
              )}
              {booking.payment && ["SUCCEEDED", "REFUNDED", "PARTIAL_REFUND"].includes(booking.payment.status) && (
                <a href={`/dashboard/bookings/${booking.id}/receipt`} className="block text-right text-xs underline underline-offset-4">
                  Download receipt (PDF)
                </a>
              )}
              <div className="flex items-baseline justify-between border-t border-forest-900/10 pt-3">
                <span className="font-medium">Total</span>
                <span className="font-display text-3xl text-forest-900">
                  {booking.status === "QUOTE_REQUESTED" ? "To be confirmed" : `$${priceUSD.toFixed(0)}`}
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
