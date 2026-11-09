import Image from "next/image";
import { publicReviewInclude, ratingSummary } from "@/lib/reviews";
import { RatingBadge } from "@/components/reviews/stars";
import { ReviewSection } from "@/components/reviews/review-list";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, Languages, MapPin, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/auth";
import { StayBookingForm } from "@/components/homestays/stay-booking-form";
import { bdtToUsd } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { bdt, dayKey } from "@/lib/guide-shared";
import { stayQuote, MAX_STAY_DAYS_AHEAD, MIN_STAY_LEAD_DAYS } from "@/lib/homestay-shared";
import { homestayTakenNights, publicHomestayWhere } from "@/lib/homestays";
import { applyText } from "@/lib/i18n/apply";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const h = await db.homestay.findFirst({ where: { slug: (await params).slug, ...publicHomestayWhere }, include: { region: true } });
  if (!h) return { title: "Homestay", robots: { index: false } };
  return {
    title: h.name,
    description: `Homestay in ${h.district}, ${h.region.name}. Sleeps ${h.maxGuests}. ${h.description.slice(0, 130)}`,
    openGraph: h.photos[0] ? { images: [h.photos[0]] } : undefined,
  };
}

const addDays = (d: Date, n: number) => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() + n);
  return x;
};

export default async function HomestayPage({ params, searchParams }: Props) {
  const [{ slug }, sp, session] = await Promise.all([params, searchParams, auth()]);
  const h = await db.homestay.findUnique({
    where: { slug },
    include: { region: true, host: { select: { name: true, role: true } } },
  });
  if (!h) notFound();
  const isPublic = h.isActive && h.isListed && h.host.role === "HOST";
  const isOwner = session?.user?.id === h.hostId;
  if (!isPublic && !isOwner && session?.user?.role !== "ADMIN") notFound();

  const today = new Date(dayKey(new Date()));
  const minCheckIn = addDays(today, MIN_STAY_LEAD_DAYS);
  const maxCheckIn = addDays(today, MAX_STAY_DAYS_AHEAD);
  const [taken, me] = await Promise.all([
    homestayTakenNights(h.id, today, addDays(maxCheckIn, 14)),
    session?.user?.id
      ? db.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, touristProfile: { select: { phoneNumber: true, nationality: true } } } })
      : null,
  ]);
  const [rating, reviews] = await Promise.all([
    ratingSummary({ homestayId: h.id }),
    db.review.findMany({ where: { homestayId: h.id, status: "PUBLISHED" }, include: publicReviewInclude, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const price = stayQuote(h.facilities, 3);
  const hostFirst = (h.host.name ?? h.name).split(/\s+/)[0];
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const facility = applyText.en.facility;
  const mapQuery = encodeURIComponent(`${h.area}, ${h.district}, Bangladesh`);

  return (
    <>
      {!isPublic && (
        <div className="border-b border-clay-600/30 bg-clay-500/10 px-4 py-3 text-center text-sm text-clay-700">
          {isOwner ? "Only you and the DeltaWay team can see this listing right now." : "Hidden from the public (paused or unlisted)."}{" "}
          {isOwner && <Link href="/dashboard/host/listing" className="underline underline-offset-4">Edit listing</Link>}
        </div>
      )}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <Link href="/homestays" className="text-sm text-ink-soft hover:text-forest-800">← All homestays</Link>
        <p className="eyebrow mt-6 text-forest-700">{h.district} · {h.region.name}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">{h.name}</h1>
        <RatingBadge summary={rating} className="mt-3" />

        {h.photos.length > 0 ? (
          <div className="mt-8 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
            {h.photos.slice(0, 5).map((src, i) => (
              <a key={src} href={src} target="_blank" rel="noopener noreferrer" className={i === 0 ? "relative aspect-[4/3] overflow-hidden rounded-sm sm:col-span-2 sm:row-span-2 sm:aspect-auto" : "relative hidden aspect-[4/3] overflow-hidden rounded-sm sm:block"}>
                <Image src={src} alt={i === 0 ? h.name : `${h.name}, photo ${i + 1}`} fill priority={i === 0} sizes={i === 0 ? "(min-width: 640px) 50vw, 100vw" : "25vw"} className="object-cover" />
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-sm bg-forest-100 px-6 py-16 text-center text-ink-soft">Photos coming soon.</div>
        )}
        {h.photos.length > 5 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {h.photos.slice(5).map((src, i) => (
              <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="relative h-24 w-32 shrink-0 overflow-hidden rounded-sm">
                <Image src={src} alt={`${h.name}, photo ${i + 6}`} fill sizes="128px" className="object-cover" />
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-ink-soft">
            <div className="flex items-center gap-2"><Users className="size-4" aria-hidden /><dd>Sleeps {h.maxGuests} · {h.rooms} {h.rooms === 1 ? "room" : "rooms"}</dd></div>
            <div className="flex items-center gap-2"><Languages className="size-4" aria-hidden /><dd>Speaks {h.languages.join(", ") || "Bangla"}</dd></div>
            <div className="flex items-center gap-2"><MapPin className="size-4" aria-hidden /><dd>{h.area}</dd></div>
          </dl>

          <h2 className="mt-10 font-display text-3xl">About the home</h2>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{h.description}</p>

          {h.facilities.length > 0 && (
            <>
              <h2 className="mt-10 font-display text-3xl">What&rsquo;s there</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {h.facilities.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="size-4 text-forest-700" aria-hidden /> {facility[f] ?? f}</li>
                ))}
              </ul>
            </>
          )}

          {h.houseRules && (
            <>
              <h2 className="mt-10 font-display text-3xl">House rules</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">{h.houseRules}</p>
            </>
          )}

          <h2 className="mt-10 font-display text-3xl">Where it is</h2>
          <p className="mt-4 text-ink-soft">
            {h.area}, {h.district}. The exact address and directions are shared once your stay is paid.{" "}
            <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">See the area on a map</a>
          </p>

          <div className="mt-12">
            <ReviewSection summary={rating} reviews={reviews} hostReplyLabel={`Response from ${hostFirst}`} emptyText="No reviews yet. Guests can review their stay after check-out." />
          </div>

          <div className="mt-10 rounded-lg border border-forest-900/10 bg-paper-warm p-6">
            <p className="flex items-center gap-2 font-medium"><ShieldCheck className="size-5 text-forest-700" aria-hidden /> Checked by DeltaWay</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              <li>Our team visited {hostFirst}&rsquo;s home in person.</li>
              <li>The host&rsquo;s ID and phone number have been checked.</li>
              <li>You can reach us on WhatsApp at any time during your stay.</li>
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-forest-900/10 p-6 shadow-sm">
            <p>
              <span className="font-display text-3xl">{bdt(price.firstNightBDT)}</span>
              <span className="text-ink-mute"> first night · about ${Math.round(bdtToUsd(price.firstNightBDT))}</span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">+{bdt(price.extraNightBDT)} for each extra night · 3 nights: {bdt(price.totalBDT)}</p>
            <p className="mb-5 mt-1 text-xs text-ink-mute">For the whole group, meals included</p>
            {isPublic ? (
              <StayBookingForm
                slug={h.slug}
                facilities={h.facilities}
                maxGuests={h.maxGuests}
                restrictedRegion={h.region.isRestricted ? h.region.name : null}
                takenNights={[...taken.blocked, ...taken.booked]}
                minCheckIn={dayKey(minCheckIn)}
                maxCheckIn={dayKey(maxCheckIn)}
                signedIn={Boolean(session?.user)}
                defaults={{
                  name: me?.name ?? "",
                  email: me?.email ?? "",
                  phone: me?.touristProfile?.phoneNumber ?? "",
                  nationality: me?.touristProfile?.nationality ?? "",
                  checkIn: one("checkIn"),
                  checkOut: one("checkOut"),
                  guests: Number(one("guests")) || undefined,
                }}
              />
            ) : (
              <p className="text-sm text-ink-mute">Not taking bookings right now.</p>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}
