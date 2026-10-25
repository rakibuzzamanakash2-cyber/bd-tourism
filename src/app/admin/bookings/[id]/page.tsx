import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  AdminCancelForm,
  MarkPaidForm,
  NotesForm,
  RefundPaidForm,
  StatusButtons,
} from "@/components/admin/booking-actions";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/admin/ui";
import { dateTime, describeAction, money, paymentMethod } from "@/lib/admin-format";
import {
  ADMIN_CANCELLABLE_STATUSES,
  ADMIN_STATUS_TRANSITIONS,
  calculateRefund,
  formatDateRange,
  serviceFeeFromDetails,
} from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Booking" };

type Props = { params: Promise<{ id: string }> };

type Details = {
  primaryContact?: { name: string; email: string; phone: string; passportNumber?: string; nationality?: string };
  additionalTravelers?: { name: string; passportNumber?: string; nationality?: string }[];
  notes?: string;
  permitContext?: { restrictedRegions?: { name: string }[]; serviceFeeUSD?: number; tourPriceUSD?: number } | null;
};

export default async function AdminBookingDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const [booking, history] = await Promise.all([
    db.booking.findUnique({
      where: { id },
      include: {
        package: { select: { title: true, slug: true, durationDays: true } },
        tourist: { select: { id: true, name: true, email: true, createdAt: true, touristProfile: true } },
        payment: true,
      },
    }),
    db.auditLog.findMany({
      where: { targetType: "Booking", targetId: id },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!booking) notFound();

  let details: Details = {};
  try {
    details = booking.specialRequests ? JSON.parse(booking.specialRequests) : {};
  } catch {
    details = { notes: booking.specialRequests ?? "" };
  }

  const paid = booking.payment?.status === "SUCCEEDED";
  const paidAmount = Number(booking.payment?.amountUSD ?? 0);
  const quote = calculateRefund({
    totalUSD: Number(booking.totalAmountUSD),
    serviceFeeUSD: serviceFeeFromDetails(booking.specialRequests),
    startDate: booking.startDate,
    paid,
  });
  const refundOwed =
    booking.status === "CANCELLED" && Number(booking.refundAmountUSD ?? 0) > 0 && booking.payment?.status === "SUCCEEDED";
  const allowed = ADMIN_STATUS_TRANSITIONS[booking.status] ?? [];
  const canCancel = (ADMIN_CANCELLABLE_STATUSES as readonly string[]).includes(booking.status);
  const restricted = details.permitContext?.restrictedRegions ?? [];
  const raw = (booking.payment?.providerRaw ?? null) as Record<string, unknown> | null;

  return (
    <div>
      <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All bookings
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-ink-mute">{booking.bookingCode}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight">{booking.package?.title ?? "Custom trip"}</h1>
          <p className="mt-2 text-ink-soft">
            {formatDateRange(booking.startDate, booking.endDate)} · {booking.travelerCount}{" "}
            {booking.travelerCount === 1 ? "traveler" : "travelers"} · {money(booking.totalAmountUSD)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {booking.status === "CANCELLED" && (
        <p className="mt-4 rounded-md border border-forest-900/10 bg-paper-warm px-4 py-3 text-sm text-ink-soft">
          Cancelled {dateTime(booking.cancelledAt)}. Reason: {booking.cancellationReason ?? "—"}
        </p>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        {/* LEFT: information */}
        <div className="space-y-8 xl:col-span-2">
          <Section title="Travelers">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Item label="Account">
                {booking.tourist.name ?? "—"}
                <br />
                <a href={`mailto:${booking.tourist.email}`} className="underline underline-offset-4">
                  {booking.tourist.email}
                </a>
              </Item>
              <Item label="Primary contact">
                {details.primaryContact?.name ?? "—"}
                <br />
                {details.primaryContact?.phone ?? ""}
                {details.primaryContact?.email && details.primaryContact.email !== booking.tourist.email && (
                  <>
                    <br />
                    {details.primaryContact.email}
                  </>
                )}
              </Item>
              {details.primaryContact?.passportNumber && (
                <Item label="Primary passport">
                  {details.primaryContact.passportNumber} · {details.primaryContact.nationality}
                </Item>
              )}
              {details.additionalTravelers?.map((t, i) => (
                <Item key={i} label={`Traveler #${i + 2}`}>
                  {t.name}
                  {t.passportNumber && (
                    <>
                      <br />
                      Passport {t.passportNumber} · {t.nationality}
                    </>
                  )}
                </Item>
              ))}
              {booking.tourist.touristProfile?.emergencyContact && (
                <Item label="Emergency contact">{booking.tourist.touristProfile.emergencyContact}</Item>
              )}
              {booking.tourist.touristProfile?.dietaryPrefs && (
                <Item label="Dietary needs">{booking.tourist.touristProfile.dietaryPrefs}</Item>
              )}
            </dl>
            {details.notes && (
              <div className="mt-4 rounded-md bg-paper-warm p-4 text-sm">
                <p className="text-xs uppercase tracking-wider text-ink-mute">Special requests</p>
                <p className="mt-1 whitespace-pre-wrap">{details.notes}</p>
              </div>
            )}
          </Section>

          {restricted.length > 0 && (
            <Section title="Permits">
              <p className="text-sm text-ink-soft">
                Visits {restricted.map((r) => r.name).join(", ")}. Permit processing fee charged:{" "}
                {money(details.permitContext?.serviceFeeUSD ?? 0)}. Permit tracking arrives in the next admin update.
              </p>
            </Section>
          )}

          <Section title="Payment">
            {booking.payment ? (
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                <Item label="Status">
                  <PaymentStatusBadge status={booking.payment.status} />
                </Item>
                <Item label="Amount">{money(booking.payment.amountUSD)}</Item>
                <Item label="Method">{paymentMethod(booking.payment.provider)}</Item>
                <Item label="Paid at">{dateTime(booking.payment.paidAt)}</Item>
                <Item label="Transaction">
                  <span className="break-all font-mono text-xs">
                    {booking.payment.providerTxnId ?? (raw?.reference as string) ?? "—"}
                  </span>
                </Item>
                {booking.refundAmountUSD !== null && (
                  <Item label="Refund">
                    {money(booking.refundAmountUSD)}
                    {booking.payment.refundedAt ? ` · sent ${dateTime(booking.payment.refundedAt)}` : " · owed"}
                  </Item>
                )}
              </dl>
            ) : (
              <p className="text-sm text-ink-soft">No payment yet.</p>
            )}
          </Section>

          <Section title="History">
            <ul className="space-y-2 text-sm">
              <li className="text-ink-soft">
                {dateTime(booking.createdAt)} · Booked by {booking.tourist.name ?? booking.tourist.email}
              </li>
              {[...history].reverse().map((h) => (
                <li key={h.id} className="text-ink-soft">
                  {dateTime(h.createdAt)} · {h.actor?.name ?? h.actor?.email ?? "System"} {describeAction(h.action)}
                  {h.details && typeof h.details === "object" && "to" in h.details && ` → ${String(h.details.to)}`}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* RIGHT: actions */}
        <aside className="space-y-6">
          <Section title="Actions">
            <div className="space-y-4">
              {refundOwed && <RefundPaidForm bookingId={booking.id} amount={money(booking.refundAmountUSD)} />}
              {booking.status === "PAYMENT_PENDING" && <MarkPaidForm bookingId={booking.id} />}
              <StatusButtons bookingId={booking.id} allowed={allowed} />
              {canCancel && (
                <AdminCancelForm bookingId={booking.id} paid={paid} paidAmount={paidAmount} suggestedRefund={quote.refundUSD} />
              )}
              {!refundOwed && booking.status !== "PAYMENT_PENDING" && allowed.length === 0 && !canCancel && (
                <p className="text-sm text-ink-mute">No actions for a {booking.status.toLowerCase()} booking.</p>
              )}
            </div>
          </Section>
          <Section title="Team notes">
            <NotesForm bookingId={booking.id} initial={booking.adminNotes ?? ""} />
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-forest-900/10 p-5">
      <h2 className="mb-4 font-sans text-xs uppercase tracking-wider text-ink-mute">{title}</h2>
      {children}
    </section>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-mute">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
