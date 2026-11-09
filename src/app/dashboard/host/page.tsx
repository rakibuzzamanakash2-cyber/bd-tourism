import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { HostHeader } from "@/components/host/host-header";
import { HostReplyForm } from "@/components/reviews/review-actions";
import { Stars } from "@/components/reviews/stars";
import { reviewerName } from "@/lib/review-shared";
import { formatDateRange } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { bdt, dayKey } from "@/lib/guide-shared";
import { stayNightKeys } from "@/lib/homestay-shared";
import { hostLang, hostText } from "@/lib/i18n/host";
import { requireHost } from "@/lib/session";
import { whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata = { title: "My guests" };

type Details = { primaryContact?: { name?: string; phone?: string }; notes?: string };
const parse = (s: string | null): Details => {
  try {
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
};

export default async function HostDashboardPage() {
  const { user, homestay } = await requireHost();
  const lang = hostLang(homestay?.language);
  const t = hostText[lang];
  if (!homestay) {
    return (
      <div>
        <HostHeader lang={lang} title={t.hello(user.name?.split(/\s+/)[0] ?? "")} />
        <p className="rounded-lg border border-forest-900/10 bg-paper-warm p-6 text-ink-soft">{t.noListing}</p>
      </div>
    );
  }
  const today = new Date(dayKey(new Date()));
  const bookings = await db.booking.findMany({
    where: { homestayId: homestay.id, status: { not: "DRAFT" } },
    include: { tourist: { select: { touristProfile: { select: { dietaryPrefs: true } } } } },
    orderBy: { startDate: "asc" },
  });
  const active = bookings.filter((b) => b.status !== "CANCELLED");
  const paidStatuses = ["PAID", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "DISPUTED"];
  const upcoming = active.filter((b) => paidStatuses.includes(b.status) && b.endDate >= today);
  const waiting = active.filter((b) => b.status === "PAYMENT_PENDING" && b.endDate >= today);
  const past = active.filter((b) => paidStatuses.includes(b.status) && b.endDate < today).reverse();
  const reviews = await db.review.findMany({
    where: { homestayId: homestay.id, status: "PUBLISHED" },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const paidTotal = bookings.filter((b) => b.hostPayoutStatus === "PAID").reduce((n, b) => n + (b.hostPayoutBDT ?? 0), 0);
  const owedTotal = active.filter((b) => b.hostPayoutStatus === "UNPAID" && b.endDate <= today).reduce((n, b) => n + (b.hostPayoutBDT ?? 0), 0);

  const StayCard = ({ b, showGuest }: { b: (typeof bookings)[number]; showGuest: boolean }) => {
    const d = parse(b.specialRequests);
    const nights = stayNightKeys(b.startDate, b.endDate).length;
    return (
      <li className="space-y-3 rounded-lg border border-forest-900/10 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="font-medium">{formatDateRange(b.startDate, b.endDate)}</p>
          <p className="text-sm">
            {t.youGet} {bdt(b.hostPayoutBDT ?? 0)}
            {b.hostPayoutStatus && <span className={cn("ml-2 text-xs", b.hostPayoutStatus === "PAID" ? "text-forest-700" : "text-ink-mute")}>{b.hostPayoutStatus === "PAID" ? t.paid : t.unpaid}</span>}
          </p>
        </div>
        <p className="text-sm text-ink-soft">{t.nights(nights)} · {t.guests(b.travelerCount)} · <span className="font-mono">{b.bookingCode}</span></p>
        {showGuest && (
          <dl className="grid gap-3 rounded-md bg-paper-warm p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-mute">{t.leadGuest}</dt>
              <dd className="mt-0.5">{d.primaryContact?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-mute">{t.phone}</dt>
              <dd className="mt-0.5">
                {d.primaryContact?.phone ? (
                  <>
                    <a href={`tel:${d.primaryContact.phone}`} className="underline underline-offset-4">{d.primaryContact.phone}</a>
                    {" · "}
                    <a href={`https://wa.me/${d.primaryContact.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">WhatsApp</a>
                  </>
                ) : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-mute">{t.notes}</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{d.notes || t.noNotes}</dd>
            </div>
            {b.tourist.touristProfile?.dietaryPrefs && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-mute">{t.dietary}</dt>
                <dd className="mt-0.5">{b.tourist.touristProfile.dietaryPrefs}</dd>
              </div>
            )}
          </dl>
        )}
      </li>
    );
  };

  return (
    <div className={cn(lang === "bn" && "font-bengali")}>
      <HostHeader lang={lang} title={t.hello((user.name ?? homestay.name).split(/\s+/)[0])} intro={t.intro} />
      {!homestay.isActive && <p className="mb-6 rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-700">{t.paused}</p>}
      {homestay.isActive && !homestay.isListed && (
        <p className="mb-6 rounded-md border border-forest-900/10 bg-paper-warm px-4 py-3 text-sm">{t.hidden} <Link href="/dashboard/host/listing" className="underline underline-offset-4">{t.nav.listing}</Link></p>
      )}

      <section className="mb-12">
        <h2 className="font-display text-2xl">{t.upcoming}</h2>
        {upcoming.length === 0 ? <p className="mt-3 text-ink-soft">{t.noUpcoming}</p> : (
          <ul className="mt-4 space-y-4">{upcoming.map((b) => <StayCard key={b.id} b={b} showGuest />)}</ul>
        )}
        {upcoming.length > 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            {t.problem} {t.problemHint}{" "}
            <a href={whatsappLink(`Hi DeltaWay, this is ${homestay.name}. I have a problem with an upcoming stay.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
              <MessageCircle className="size-3.5" /> {t.messageTeam}
            </a>
          </p>
        )}
      </section>

      {waiting.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl">{t.waiting}</h2>
          <p className="mt-2 text-sm text-ink-soft">{t.waitingHint}</p>
          <ul className="mt-4 space-y-4">{waiting.map((b) => <StayCard key={b.id} b={b} showGuest={false} />)}</ul>
        </section>
      )}

      <section className="mb-12">
        <h2 className="font-display text-2xl">{t.earnings}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-forest-900/10 p-5"><p className="text-sm text-ink-mute">{t.paidTotal}</p><p className="mt-1 font-display text-3xl">{bdt(paidTotal)}</p></div>
          <div className="rounded-lg border border-forest-900/10 p-5"><p className="text-sm text-ink-mute">{t.owedTotal}</p><p className="mt-1 font-display text-3xl">{bdt(owedTotal)}</p></div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl">{t.reviews}</h2>
        {reviews.length === 0 ? <p className="mt-3 text-ink-soft">{t.noReviews}</p> : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="space-y-3 rounded-lg border border-forest-900/10 p-5">
                <div className="flex flex-wrap items-center gap-2"><Stars value={r.rating} />{r.title && <span className="font-medium">{r.title}</span>}</div>
                <p className="whitespace-pre-line text-sm">{r.comment}</p>
                <p className="text-xs text-ink-mute">{reviewerName(r.author.name)}</p>
                {r.reply && (
                  <div className="border-l-2 border-forest-700 pl-3 text-sm">
                    <p className="text-xs text-forest-800">{r.replyBy === "TEAM" ? t.teamReplied : t.yourReply}</p>
                    <p className="whitespace-pre-line text-ink-soft">{r.reply}</p>
                  </div>
                )}
                {r.replyBy !== "TEAM" && <HostReplyForm id={r.id} reply={r.reply} lang={lang} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-display text-2xl">{t.past}</h2>
          <ul className="mt-4 space-y-4">{past.map((b) => <StayCard key={b.id} b={b} showGuest={false} />)}</ul>
        </section>
      )}
    </div>
  );
}
