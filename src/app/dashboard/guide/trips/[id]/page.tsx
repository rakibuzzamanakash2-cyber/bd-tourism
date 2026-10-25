import Link from "next/link";
import { notFound } from "next/navigation";
import { TripResponse } from "@/components/guide/trip-response";
import { formatDateRange } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { bdt, tripDays } from "@/lib/guide-shared";
import { guideLang, guideText } from "@/lib/i18n/guide";
import { whatsappTo } from "@/lib/invites";
import { requireGuide } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Trip" };

type Details = {
  primaryContact?: { name: string; email: string; phone: string };
  additionalTravelers?: { name: string }[];
  notes?: string;
};

export default async function GuideTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireGuide(`/dashboard/guide/trips/${id}`);
  if (!profile) notFound();
  const lang = guideLang(profile.language);
  const t = guideText[lang];

  const a = await db.guideAssignment.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          package: { include: { itinerary: { orderBy: { dayNumber: "asc" }, include: { destination: { select: { name: true } } } } } },
          tourist: { select: { touristProfile: { select: { dietaryPrefs: true, emergencyContact: true } } } },
        },
      },
    },
  });
  // Only their own trips. Declined or withdrawn ones are hidden: the traveler isn't theirs.
  if (!a || a.guideId !== profile.id || a.status === "DECLINED") notFound();
  const b = a.booking;
  const cancelled = b.status === "CANCELLED" || a.status === "CANCELLED";
  // Traveler contact details only once the guide has said yes, and not after a cancellation
  const showContact = a.status === "ACCEPTED" && !cancelled;
  let details: Details = {};
  try {
    details = b.specialRequests ? JSON.parse(b.specialRequests) : {};
  } catch {
    details = {};
  }
  const contact = details.primaryContact;

  return (
    <div className={cn(lang === "bn" && "font-bengali")}>
      <Link href="/dashboard/guide" className="text-sm text-ink-soft hover:text-forest-800">{t.backToTrips}</Link>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-ink-mute">{b.bookingCode}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight">{b.package?.title ?? "Custom trip"}</h1>
          <p className="mt-2 text-ink-soft">
            {formatDateRange(b.startDate, b.endDate)} · {t.days(tripDays(b.startDate, b.endDate))} · {t.travelers(b.travelerCount)}
          </p>
        </div>
        <span className="rounded-full border border-forest-900/15 px-3 py-1 text-sm">{cancelled ? t.status.CANCELLED : t.status[a.status]}</span>
      </div>

      {cancelled && <p className="mt-6 rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-700">{t.bookingCancelled}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {a.status === "PENDING" && !cancelled && (
            <section className="rounded-lg border border-clay-600/30 bg-clay-500/5 p-5">
              <TripResponse assignmentId={a.id} lang={lang} />
            </section>
          )}
          <section className="rounded-lg border border-forest-900/10 p-5">
            <h2 className="mb-4 font-sans text-xs uppercase tracking-wider text-ink-mute">{t.leadTraveler}</h2>
            {showContact && contact ? (
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-ink-mute">{contact.name}</dt>
                  <dd className="mt-1">
                    {t.phone}: <a href={`tel:${contact.phone}`} className="underline underline-offset-4">{contact.phone}</a>
                    {contact.phone && (
                      <>
                        {" · "}
                        <a href={whatsappTo(contact.phone.replace(/[^\d+]/g, ""))} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">WhatsApp</a>
                      </>
                    )}
                    <br />
                    {t.email}: {contact.email}
                  </dd>
                </div>
                {details.additionalTravelers && details.additionalTravelers.length > 0 && (
                  <div>
                    <dt className="text-xs text-ink-mute">{t.otherTravelers}</dt>
                    <dd className="mt-1">{details.additionalTravelers.map((x) => x.name).join(", ")}</dd>
                  </div>
                )}
                {b.tourist.touristProfile?.dietaryPrefs && (
                  <div>
                    <dt className="text-xs text-ink-mute">{t.dietary}</dt>
                    <dd className="mt-1">{b.tourist.touristProfile.dietaryPrefs}</dd>
                  </div>
                )}
                {b.tourist.touristProfile?.emergencyContact && (
                  <div>
                    <dt className="text-xs text-ink-mute">{t.emergency}</dt>
                    <dd className="mt-1">{b.tourist.touristProfile.emergencyContact}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-ink-mute">{cancelled ? t.bookingCancelled : t.contactAfterAccept}</p>
            )}
            {showContact && details.notes && (
              <div className="mt-4 rounded-md bg-paper-warm p-4 text-sm">
                <p className="text-xs text-ink-mute">{t.specialRequests}</p>
                <p className="mt-1 whitespace-pre-wrap">{details.notes}</p>
              </div>
            )}
          </section>
          {b.package && b.package.itinerary.length > 0 && (
            <section className="rounded-lg border border-forest-900/10 p-5">
              <h2 className="mb-4 font-sans text-xs uppercase tracking-wider text-ink-mute">{t.itinerary}</h2>
              <ol className="space-y-4">
                {b.package.itinerary.map((d) => (
                  <li key={d.id}>
                    <p className="font-medium">
                      {t.day(d.dayNumber)}: {d.title}
                      {d.destination && <span className="font-normal text-ink-mute"> · {d.destination.name}</span>}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{d.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
        <aside className="space-y-4">
          <section className="rounded-lg border border-forest-900/10 p-5">
            <p className="text-sm text-ink-mute">{t.fee}</p>
            <p className="mt-1 font-display text-3xl">{bdt(a.feeBDT)}</p>
            {a.status === "ACCEPTED" && (
              <p className={cn("mt-2 text-sm", a.payoutStatus === "PAID" ? "text-forest-700" : "text-ink-mute")}>
                {a.payoutStatus === "PAID" ? `${t.paid}${a.payoutReference ? ` · ${a.payoutReference}` : ""}` : t.unpaid}
              </p>
            )}
          </section>
          {a.noteToGuide && (
            <section className="rounded-lg border border-forest-900/10 p-5 text-sm">
              <p className="text-xs text-ink-mute">{t.noteFromTeam}</p>
              <p className="mt-1 whitespace-pre-wrap">{a.noteToGuide}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
