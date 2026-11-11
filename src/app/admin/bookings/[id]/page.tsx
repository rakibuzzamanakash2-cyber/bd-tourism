import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  AdminCancelForm,
  MarkPaidForm,
  QuoteForm,
  NotesForm,
  RefundPaidForm,
  GatewayRefundButton,
  RefundStatusButton,
  StatusButtons,
} from "@/components/admin/booking-actions";
import { AssignmentStatusBadge, BookingStatusBadge, PaymentStatusBadge } from "@/components/admin/ui";
import { AssignGuidePanel, CancelAssignmentButton, MarkGuidePaidForm, type GuideCandidate } from "@/components/admin/guide-actions";
import { GUIDE_ASSIGNABLE_BOOKING, bdt, tripDays } from "@/lib/guide-shared";
import { bookingRegionIds, guideConflicts } from "@/lib/guides";
import { dateTime, describeAction, humanize, money, paymentMethod } from "@/lib/admin-format";
import {
  ADMIN_CANCELLABLE_STATUSES,
  ADMIN_STATUS_TRANSITIONS,
  calculateRefund,
  formatDate,
  formatDateRange,
  serviceFeeFromDetails,
} from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { ensurePermitsForBooking } from "@/lib/permits";
import { PermitEditor } from "@/components/admin/permit-panel";
import { requireAdmin } from "@/lib/session";
import { bookingTitle, stayNightKeys } from "@/lib/homestay-shared";
import { MarkHostPaidForm } from "@/components/admin/homestay-actions";
import { RevealPassport } from "@/components/admin/reveal-passport";
import { maskedPassport } from "@/lib/travelers";
import { visaPending, visaStatusLabel } from "@/lib/travel-docs";

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

  // Older paid bookings get their permit records the first time they're opened
  await ensurePermitsForBooking(id);

  const [booking, history, permits] = await Promise.all([
    db.booking.findUnique({
      where: { id },
      include: {
        package: { select: { id: true, title: true, slug: true, durationDays: true, includesGuide: true } },
        homestay: { select: { id: true, name: true, slug: true, phone: true, address: true, host: { select: { name: true, email: true } } } },
        requestedGuide: { select: { id: true, slug: true, displayName: true } },
        travelers: { orderBy: { position: "asc" } },
        guideAssignments: {
          include: { guide: { select: { id: true, displayName: true, slug: true, phone: true } }, assignedBy: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        tourist: { select: { id: true, name: true, email: true, createdAt: true, touristProfile: true } },
        payment: true,
      },
    }),
    db.auditLog.findMany({
      where: { targetType: "Booking", targetId: id },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.permit.findMany({
      where: { bookingId: id },
      include: { region: { select: { name: true, permitFeeBDT: true } } },
      orderBy: { createdAt: "asc" },
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

  // ---- Guide
  const liveAssignment = booking.guideAssignments.find((a) => a.status === "PENDING" || a.status === "ACCEPTED");
  const pastAssignments = booking.guideAssignments.filter((a) => a !== liveAssignment);
  const canAssign = !booking.homestayId && !liveAssignment && (GUIDE_ASSIGNABLE_BOOKING as readonly string[]).includes(booking.status);
  const days = tripDays(booking.startDate, booking.endDate);
  let candidates: GuideCandidate[] = [];
  if (canAssign) {
    const [regionIds, guides] = await Promise.all([
      bookingRegionIds(booking.packageId),
      db.guideProfile.findMany({
        where: { isActive: true, user: { role: "GUIDE" } },
        include: { regions: { select: { id: true } } },
        orderBy: { displayName: "asc" },
        take: 50,
      }),
    ]);
    const declined = new Set(pastAssignments.filter((a) => a.status === "DECLINED").map((a) => a.guideId));
    candidates = await Promise.all(
      guides.map(async (g) => {
        const c = await guideConflicts(g.id, booking.startDate, booking.endDate, booking.id);
        const conflict = declined.has(g.id)
          ? "Already declined this trip"
          : c.trips.length
            ? `On another trip: ${c.trips.map((t) => t.bookingCode).join(", ")}`
            : c.blockedDays.length
              ? `Marked not available: ${c.blockedDays.join(", ")}`
              : null;
        return {
          id: g.id,
          name: g.displayName,
          dayRateBDT: g.dayRateBDT,
          languages: g.languages,
          coversRegion: regionIds.length === 0 || g.regions.some((r) => regionIds.includes(r.id)),
          requested: g.id === booking.requestedGuideId,
          conflict,
        };
      }),
    );
    // Requested first, then free guides who cover the area, then the rest
    const score = (c: GuideCandidate) => (c.requested ? 0 : 1) * 4 + (c.conflict ? 2 : 0) + (c.coversRegion ? 0 : 1);
    candidates.sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
  }

  return (
    <div>
      <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All bookings
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-ink-mute">{booking.bookingCode}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight">{bookingTitle(booking)}</h1>
          <p className="mt-2 text-ink-soft">
            {formatDateRange(booking.startDate, booking.endDate)} · {booking.travelerCount}{" "}
            {booking.travelerCount === 1 ? "traveler" : "travelers"} · {money(booking.totalAmountUSD)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {booking.status === "QUOTE_REQUESTED" && (
        <p className="mt-4 rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-700">
          This is a custom trip. Plan it, then set the price on the right so the traveler can pay.
        </p>
      )}
      {booking.status !== "CANCELLED" && booking.travelers.some((t) => visaPending(t.visaStatus)) && (
        <p className="mt-4 rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-700">
          Visa pending for {booking.travelers.filter((t) => visaPending(t.visaStatus)).map((t) => t.name).join(", ")}. Ask to see the visa before the trip starts.
        </p>
      )}
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
              {booking.travelers.map((t) => (
                <Item key={t.id} label={t.position === 0 ? "Lead traveler" : `Traveler #${t.position + 1}`}>
                  {t.name}
                  {t.nationality && <span className="text-ink-mute"> · {t.nationality}</span>}
                  {t.dateOfBirth && <span className="text-ink-mute"> · born {formatDate(t.dateOfBirth)}</span>}
                  {maskedPassport(t) && (
                    <>
                      <br />
                      {t.passportExpiry || !t.visaStatus ? "Passport" : "Passport / NID"}{" "}
                      {t.passportEnc ? <RevealPassport travelerId={t.id} masked={maskedPassport(t)!} /> : <span className="font-mono">{maskedPassport(t)}</span>}
                      {t.passportExpiry && <span className="text-ink-mute"> · valid to {formatDate(t.passportExpiry)}</span>}
                    </>
                  )}
                  {t.visaStatus && (
                    <>
                      <br />
                      <span className={visaPending(t.visaStatus) ? "font-medium text-clay-700" : undefined}>
                        Visa: {visaPending(t.visaStatus) ? "pending · " : ""}
                        {visaStatusLabel(t.visaStatus)}
                      </span>
                      {t.visaNumberEnc && (
                        <>
                          {" "}
                          <RevealPassport travelerId={t.id} masked="••••" what="visa" />
                        </>
                      )}
                      {t.visaExpiry && <span className="text-ink-mute"> · valid to {formatDate(t.visaExpiry)}</span>}
                    </>
                  )}
                </Item>
              ))}
              {booking.travelers.length === 0 &&
                details.additionalTravelers?.map((t, i) => (
                  <Item key={i} label={`Traveler #${i + 2}`}>{t.name}</Item>
                ))}
              {booking.emergencyName ? (
                <Item label="Emergency contact">
                  {booking.emergencyName}
                  <br />
                  {booking.emergencyPhone}
                </Item>
              ) : (
                booking.tourist.touristProfile?.emergencyContact && (
                  <Item label="Emergency contact">{booking.tourist.touristProfile.emergencyContact}</Item>
                )
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
              <p className="mb-4 text-sm text-ink-soft">
                Visits {restricted.map((r) => r.name).join(", ")}. Processing fee charged:{" "}
                {money(details.permitContext?.serviceFeeUSD ?? 0)}.
              </p>
              {permits.length === 0 ? (
                <p className="text-sm text-ink-mute">Permit records are created once the booking is paid.</p>
              ) : (
                <div className="space-y-3">
                  {permits.map((pm) => (
                    <PermitEditor
                      key={pm.id}
                      travelerCount={booking.travelerCount}
                      permit={{
                        id: pm.id,
                        regionName: pm.region.name,
                        feeBDT: pm.region.permitFeeBDT,
                        status: pm.status,
                        referenceNumber: pm.referenceNumber ?? "",
                        noteToTraveler: pm.noteToTraveler ?? "",
                        submittedAt: pm.submittedAt ? dateTime(pm.submittedAt) : null,
                        decidedAt: pm.decidedAt ? dateTime(pm.decidedAt) : null,
                      }}
                    />
                  ))}
                </div>
              )}
            </Section>
          )}

          <Section title="Payment">
            {booking.payment ? (
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                <Item label="Status">
                  <PaymentStatusBadge status={booking.payment.status} />
                </Item>
                <Item label="Amount">
                  {booking.payment.currency === "BDT" && booking.payment.amountBDT
                    ? `৳${Number(booking.payment.amountBDT).toLocaleString("en-US")} (${money(booking.payment.amountUSD)})`
                    : money(booking.payment.amountUSD)}
                </Item>
                <Item label="Method">
                  {paymentMethod(booking.payment.provider)}
                  {booking.payment.method && <span className="block text-xs text-ink-mute">{booking.payment.method}</span>}
                </Item>
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
                    {booking.payment.refundRefId && (
                      <span className="block text-xs text-ink-mute">
                        SSLCommerz ref {booking.payment.refundRefId}
                        {booking.payment.refundAmountBDT && ` · ৳${Number(booking.payment.refundAmountBDT).toLocaleString("en-US")}`} · {booking.payment.refundStatus ?? "sent"}{" "}
                        <RefundStatusButton bookingId={booking.id} />
                      </span>
                    )}
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
                  {h.details && typeof h.details === "object" && "to" in h.details && ` → ${humanize(String(h.details.to))}`}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* RIGHT: actions */}
        <aside className="space-y-6">
          <Section title="Actions">
            <div className="space-y-4">
              {refundOwed && booking.payment?.provider === "sslcommerz" && booking.payment.bankTranId && (
                <GatewayRefundButton bookingId={booking.id} amountLabel={money(booking.refundAmountUSD)} />
              )}
              {refundOwed && <RefundPaidForm bookingId={booking.id} amount={money(booking.refundAmountUSD)} />}
              {booking.payment && ["SUCCEEDED", "REFUNDED", "PARTIAL_REFUND"].includes(booking.payment.status) && (
                <a href={`/dashboard/bookings/${booking.id}/receipt`} className="block text-center text-sm underline underline-offset-4">Download receipt (PDF)</a>
              )}
              {booking.status === "QUOTE_REQUESTED" && <QuoteForm bookingId={booking.id} />}
              {booking.status === "PAYMENT_PENDING" && booking.quotedAt && !booking.payment && (
                <details className="text-sm">
                  <summary className="cursor-pointer underline underline-offset-4">Change the quoted price</summary>
                  <div className="mt-3">
                    <QuoteForm bookingId={booking.id} currentUSD={Number(booking.totalAmountUSD)} />
                  </div>
                </details>
              )}
              {booking.status === "PAYMENT_PENDING" && <MarkPaidForm bookingId={booking.id} />}
              <StatusButtons bookingId={booking.id} allowed={allowed} />
              {canCancel && (
                <AdminCancelForm bookingId={booking.id} paid={paid} paidAmount={paidAmount} suggestedRefund={quote.refundUSD} />
              )}
              {!refundOwed && booking.status !== "PAYMENT_PENDING" && booking.status !== "QUOTE_REQUESTED" && allowed.length === 0 && !canCancel && (
                <p className="text-sm text-ink-mute">No actions for a {booking.status.toLowerCase()} booking.</p>
              )}
            </div>
          </Section>
          {booking.homestay && (
            <Section title="Homestay">
              <div className="space-y-2 text-sm">
                <Link href={`/admin/homestays/${booking.homestay.id}`} className="font-medium underline-offset-4 hover:underline">{booking.homestay.name}</Link>
                <p className="text-xs text-ink-mute">
                  Host: {booking.homestay.host.name ?? booking.homestay.host.email} · {booking.homestay.phone}
                  <br />
                  {stayNightKeys(booking.startDate, booking.endDate).length} nights · host gets {bdt(booking.hostPayoutBDT ?? 0)}
                </p>
                {booking.hostPayoutStatus === "PAID" ? (
                  <p className="text-xs text-forest-800">Host paid {dateTime(booking.hostPaidAt)}{booking.hostPayoutReference && ` · ${booking.hostPayoutReference}`}</p>
                ) : booking.hostPayoutStatus === "UNPAID" && booking.status !== "CANCELLED" ? (
                  <MarkHostPaidForm bookingId={booking.id} amountBDT={booking.hostPayoutBDT ?? 0} />
                ) : (
                  <p className="text-xs text-ink-mute">{booking.status === "CANCELLED" ? "Cancelled: nothing owed to the host." : "Host payout is owed once the stay is paid."}</p>
                )}
              </div>
            </Section>
          )}
          {!booking.homestay && <Section title="Guide">
            {booking.requestedGuide && (
              <p className="mb-3 rounded-md bg-paper-warm px-3 py-2 text-xs">
                Traveler asked for{" "}
                <Link href={`/admin/guides/${booking.requestedGuide.id}`} className="font-medium underline underline-offset-4">
                  {booking.requestedGuide.displayName}
                </Link>
              </p>
            )}
            {!booking.package?.includesGuide && <p className="mb-3 text-xs text-ink-mute">This tour doesn&rsquo;t include a guide, but you can still add one.</p>}
            {liveAssignment ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/guides/${liveAssignment.guide.id}`} className="font-medium underline-offset-4 hover:underline">
                    {liveAssignment.guide.displayName}
                  </Link>
                  <AssignmentStatusBadge status={liveAssignment.status} />
                </div>
                <p className="text-xs text-ink-mute">
                  Fee {bdt(liveAssignment.feeBDT)} · asked {dateTime(liveAssignment.createdAt)}
                  {liveAssignment.respondedAt && ` · answered ${dateTime(liveAssignment.respondedAt)}`}
                  <br />
                  {liveAssignment.guide.phone}
                </p>
                {liveAssignment.noteToGuide && <p className="whitespace-pre-wrap rounded-md bg-paper-warm p-2 text-xs">{liveAssignment.noteToGuide}</p>}
                {liveAssignment.status === "ACCEPTED" &&
                  (liveAssignment.payoutStatus === "PAID" ? (
                    <p className="text-xs text-forest-800">
                      Paid {dateTime(liveAssignment.paidAt)}
                      {liveAssignment.payoutReference && ` · ${liveAssignment.payoutReference}`}
                    </p>
                  ) : (
                    <MarkGuidePaidForm assignmentId={liveAssignment.id} feeBDT={liveAssignment.feeBDT} />
                  ))}
                {liveAssignment.payoutStatus !== "PAID" && <CancelAssignmentButton assignmentId={liveAssignment.id} />}
              </div>
            ) : canAssign ? (
              <AssignGuidePanel bookingId={booking.id} days={days} candidates={candidates} />
            ) : (
              <p className="text-sm text-ink-mute">
                {booking.status === "CANCELLED" ? "Booking cancelled." : "You can assign a guide once the booking is paid."}
              </p>
            )}
            {pastAssignments.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-forest-900/10 pt-3 text-xs text-ink-soft">
                {pastAssignments.map((a) => (
                  <li key={a.id}>
                    {a.guide.displayName}: {a.status.toLowerCase()}
                    {a.declineReason && ` (${a.declineReason})`}
                  </li>
                ))}
              </ul>
            )}
          </Section>}
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
