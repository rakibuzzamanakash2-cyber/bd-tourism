import Link from "next/link";
import { GuideHeader } from "./guide-header";
import { TripResponse } from "@/components/guide/trip-response";
import { formatDateRange } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { bdt, dayKey, tripDays } from "@/lib/guide-shared";
import { guideLang, guideText } from "@/lib/i18n/guide";
import { requireGuide } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "My trips" };

export default async function GuideTripsPage() {
  const { user, profile } = await requireGuide();
  const lang = guideLang(profile?.language);
  const t = guideText[lang];
  if (!profile) {
    return (
      <div>
        <GuideHeader lang={lang} title={t.hello(user.name?.split(/\s+/)[0] ?? "")} />
        <p className="rounded-lg border border-forest-900/10 bg-paper-warm p-6 text-ink-soft">{t.noProfile}</p>
      </div>
    );
  }

  const assignments = await db.guideAssignment.findMany({
    where: { guideId: profile.id },
    include: { booking: { select: { id: true, startDate: true, endDate: true, travelerCount: true, status: true, package: { select: { title: true } } } } },
    orderBy: { booking: { startDate: "asc" } },
  });
  const today = new Date(dayKey(new Date()));
  const live = assignments.filter((a) => a.booking.status !== "CANCELLED");
  const requests = live.filter((a) => a.status === "PENDING");
  const accepted = live.filter((a) => a.status === "ACCEPTED");
  const upcoming = accepted.filter((a) => a.booking.endDate >= today);
  const past = accepted.filter((a) => a.booking.endDate < today).reverse();
  const paidTotal = accepted.filter((a) => a.payoutStatus === "PAID").reduce((n, a) => n + a.feeBDT, 0);
  const owedTotal = accepted.filter((a) => a.payoutStatus === "UNPAID" && a.booking.endDate < today).reduce((n, a) => n + a.feeBDT, 0);
  const bn = lang === "bn" && "font-bengali";

  const TripLine = ({ a }: { a: (typeof assignments)[number] }) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
      <div>
        <Link href={`/dashboard/guide/trips/${a.id}`} className="font-medium underline-offset-4 hover:underline">{a.booking.package?.title ?? "Custom trip"}</Link>
        <p className="text-sm text-ink-soft">
          {formatDateRange(a.booking.startDate, a.booking.endDate)} · {t.days(tripDays(a.booking.startDate, a.booking.endDate))} · {t.travelers(a.booking.travelerCount)}
        </p>
      </div>
      <p className="text-sm">
        {bdt(a.feeBDT)}
        {a.status === "ACCEPTED" && <span className={cn("ml-2 text-xs", a.payoutStatus === "PAID" ? "text-forest-700" : "text-ink-mute")}>{a.payoutStatus === "PAID" ? t.paid : t.unpaid}</span>}
      </p>
    </div>
  );

  return (
    <div className={cn(bn)}>
      <GuideHeader lang={lang} title={t.hello(profile.displayName.split(/\s+/)[0])} intro={t.intro} />

      {!profile.isActive && <p className="mb-6 rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-700">{t.profilePaused}</p>}
      {profile.isActive && !profile.isListed && (
        <p className="mb-6 rounded-md border border-forest-900/10 bg-paper-warm px-4 py-3 text-sm">
          {t.profileHidden} <Link href="/dashboard/guide/profile" className="underline underline-offset-4">{t.nav.profile}</Link>
        </p>
      )}

      <section className="mb-12">
        <h2 className="font-display text-2xl">{t.requests}</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-ink-soft">{t.noRequests}</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-soft">{t.requestsHint}</p>
            <ul className="mt-4 space-y-4">
              {requests.map((a) => (
                <li key={a.id} className="space-y-4 rounded-lg border border-clay-600/30 bg-clay-500/5 p-5">
                  <TripLine a={a} />
                  {a.noteToGuide && (
                    <p className="whitespace-pre-wrap rounded-md bg-paper p-3 text-sm">
                      <span className="block text-xs text-ink-mute">{t.noteFromTeam}</span>
                      {a.noteToGuide}
                    </p>
                  )}
                  <TripResponse assignmentId={a.id} lang={lang} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl">{t.upcoming}</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-ink-soft">{t.noUpcoming}</p>
        ) : (
          <ul className="mt-4 divide-y divide-forest-900/10 rounded-lg border border-forest-900/10">
            {upcoming.map((a) => (
              <li key={a.id} className="p-5"><TripLine a={a} /></li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl">{t.earnings}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-forest-900/10 p-5">
            <p className="text-sm text-ink-mute">{t.paidTotal}</p>
            <p className="mt-1 font-display text-3xl">{bdt(paidTotal)}</p>
          </div>
          <div className="rounded-lg border border-forest-900/10 p-5">
            <p className="text-sm text-ink-mute">{t.owedTotal}</p>
            <p className="mt-1 font-display text-3xl">{bdt(owedTotal)}</p>
          </div>
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-display text-2xl">{t.past}</h2>
          <ul className="mt-4 divide-y divide-forest-900/10 rounded-lg border border-forest-900/10">
            {past.map((a) => (
              <li key={a.id} className="p-5"><TripLine a={a} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
