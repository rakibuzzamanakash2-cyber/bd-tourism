import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/dashboard/empty-state";
import { expireUnpaidBookings } from "@/lib/booking-expiry";

export const metadata = {
  title: "Bookings",
};

const statusStyles: Record<string, string> = {
  DRAFT: "border-ink-mute/30 text-ink-mute",
  PAYMENT_PENDING: "border-clay-600/40 text-clay-700",
  PAID: "border-forest-700/30 text-forest-700",
  CONFIRMED: "border-forest-700/30 bg-forest-100 text-forest-800",
  IN_PROGRESS: "border-forest-700/30 bg-forest-100 text-forest-800",
  COMPLETED: "border-forest-900/20 bg-forest-900/10 text-forest-900",
  CANCELLED: "border-ink-mute/30 text-ink-mute line-through",
  DISPUTED: "border-clay-600/40 bg-clay-500/10 text-clay-700",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

export default async function BookingsPage() {
  const user = await requireUser();
  await expireUnpaidBookings(user.id);

  const bookings = await db.booking.findMany({
    where: { touristId: user.id },
    include: { package: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Bookings</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Your trips.
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
        Every tour you&rsquo;ve booked, past and upcoming. Click a row to see
        the itinerary and any permit status.
      </p>

      {bookings.length === 0 ? (
        <EmptyState
          title="You haven't booked a trip yet."
          body="Browse ready-made tour packages, or head to a destination to plan a custom trip."
          cta={{ label: "Browse tours", href: "/packages" }}
          alt={{ label: "See destinations", href: "/destinations" }}
        />
      ) : (
        <div className="mt-12 divide-y divide-forest-900/10 rounded-lg border border-forest-900/10">
          {bookings.map((b) => {
            const dateRange = new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC", // trip dates are stored as midnight UTC
            });
            const start = dateRange.format(b.startDate);
            const end = dateRange.format(b.endDate);
            return (
              <Link
                key={b.id}
                href={`/dashboard/bookings/${b.id}`}
                className="flex flex-col gap-3 p-6 transition-colors hover:bg-paper-warm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="eyebrow text-ink-mute">{b.bookingCode}</p>
                  <p className="mt-1 font-display text-xl leading-tight">
                    {b.package?.title ?? "Custom trip"}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {start} — {end} · {b.travelerCount}{" "}
                    {b.travelerCount === 1 ? "traveler" : "travelers"}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${
                      statusStyles[b.status] ?? statusStyles.DRAFT
                    }`}
                  >
                    {statusLabels[b.status] ?? b.status}
                  </span>
                  <span className="font-display text-lg text-forest-900">
                    ${Number(b.totalAmountUSD).toFixed(0)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
