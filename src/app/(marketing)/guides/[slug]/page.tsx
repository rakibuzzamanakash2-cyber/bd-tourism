import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, Check, Languages, MapPin, MessageCircle } from "lucide-react";
import { auth } from "@/auth";
import { GuideAvatar } from "@/components/guides/guide-avatar";
import { buttonVariants } from "@/components/ui/button";
import { bdtToUsd } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { bdt } from "@/lib/guide-shared";
import { publicGuideWhere } from "@/lib/guides";
import { whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return db.guideProfile.findUnique({
    where: { slug },
    include: { regions: { orderBy: { name: "asc" } }, user: { select: { role: true } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = await db.guideProfile.findFirst({ where: { slug: (await params).slug, ...publicGuideWhere }, include: { regions: true } });
  if (!g) return { title: "Guide", robots: { index: false } };
  return {
    title: `${g.displayName}, local guide`,
    description: `${g.displayName} guides in ${g.regions.map((r) => r.name).join(", ")}. Speaks ${g.languages.join(", ")}. ${g.bio.slice(0, 120)}`,
    openGraph: g.photoUrl ? { images: [g.photoUrl] } : undefined,
  };
}

export default async function GuideProfilePage({ params }: Props) {
  const { slug } = await params;
  const [guide, session] = await Promise.all([load(slug), auth()]);
  if (!guide) notFound();
  const isPublic = guide.isActive && guide.isListed && guide.user.role === "GUIDE";
  const isOwner = session?.user?.id === guide.userId;
  const isAdmin = session?.user?.role === "ADMIN";
  // Hidden profiles are only visible to the guide themselves and the team
  if (!isPublic && !isOwner && !isAdmin) notFound();

  const first = guide.displayName.split(/\s+/)[0];
  const tours = await db.tourPackage.findMany({
    where: { isPublished: true, includesGuide: true, itinerary: { some: { destination: { regionId: { in: guide.regions.map((r) => r.id) } } } } },
    select: { slug: true, title: true, durationDays: true, basePriceUSD: true, summary: true },
    orderBy: { basePriceUSD: "asc" },
    take: 6,
  });

  return (
    <>
      {!isPublic && (
        <div className="border-b border-clay-600/30 bg-clay-500/10 px-4 py-3 text-center text-sm text-clay-700">
          {isOwner ? "Only you and the DeltaWay team can see this profile right now." : "Hidden from the public (paused or unlisted)."}{" "}
          {isOwner && <Link href="/dashboard/guide/profile" className="underline underline-offset-4">Edit profile</Link>}
        </div>
      )}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <Link href="/guides" className="text-sm text-ink-soft hover:text-forest-800">← All guides</Link>
        <div className="mt-8 grid gap-10 md:grid-cols-[320px_1fr] lg:gap-16">
          <GuideAvatar name={guide.displayName} photoUrl={guide.photoUrl} className="aspect-[4/5] w-full rounded-sm" sizes="(min-width: 768px) 320px, 100vw" priority />
          <div>
            <p className="eyebrow text-forest-700">Local guide</p>
            <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">{guide.displayName}</h1>
            <dl className="mt-6 space-y-2 text-ink-soft">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-1 size-4 shrink-0" />
                <dd>{guide.regions.map((r) => r.name).join(" · ")}</dd>
              </div>
              <div className="flex items-start gap-2.5">
                <Languages className="mt-1 size-4 shrink-0" />
                <dd>Speaks {guide.languages.join(", ")}</dd>
              </div>
            </dl>
            <p className="mt-8 whitespace-pre-line text-lg leading-relaxed">{guide.bio}</p>

            <div className="mt-8 grid gap-6 rounded-lg border border-forest-900/10 bg-paper-warm p-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow text-ink-mute">Experience</p>
                <p className="mt-2 font-display text-3xl">{guide.yearsExperience} {guide.yearsExperience === 1 ? "year" : "years"}</p>
              </div>
              <div>
                <p className="eyebrow text-ink-mute">Day rate</p>
                <p className="mt-2 font-display text-3xl">{bdt(guide.dayRateBDT)}</p>
                <p className="text-sm text-ink-mute">about ${Math.round(bdtToUsd(guide.dayRateBDT))} · already included in tour prices</p>
              </div>
              <ul className="space-y-2 text-sm sm:col-span-2">
                <li className="flex items-center gap-2"><Check className="size-4 text-forest-700" /> ID checked by DeltaWay</li>
                <li className="flex items-center gap-2"><Check className="size-4 text-forest-700" /> Interviewed, and two references called</li>
                {guide.licenceNumber && <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-forest-700" /> Government-licensed guide</li>}
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappLink(`Hi DeltaWay, I'd like to travel with ${guide.displayName}. Is ${first} free around my dates?`)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-forest-900 text-paper hover:bg-forest-800")}
              >
                <MessageCircle className="size-4" /> Ask about {first}
              </a>
              <Link href="#tours" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full border border-forest-900/20")}>
                Tours with {first}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="tours" className="border-t border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl">Tours {first} can lead</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Pick a tour and we&rsquo;ll ask {first} first. If {first} isn&rsquo;t free on your dates, we&rsquo;ll suggest another guide from the same area.
          </p>
          {tours.length === 0 ? (
            <p className="mt-8 text-ink-soft">
              No published tours in {guide.regions.map((r) => r.name).join(" or ")} yet. <Link href="/contact" className="underline underline-offset-4">Ask us for a custom trip</Link>.
            </p>
          ) : (
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {tours.map((t) => (
                <li key={t.slug} className="flex flex-col justify-between gap-4 rounded-lg border border-forest-900/10 bg-paper p-5">
                  <div>
                    <Link href={`/packages/${t.slug}`} className="font-display text-xl hover:text-forest-800">{t.title}</Link>
                    <p className="mt-1 text-sm text-ink-mute">{t.durationDays} days · from ${Number(t.basePriceUSD).toLocaleString()} per person</p>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{t.summary}</p>
                  </div>
                  {isPublic && (
                    <Link href={`/book/${t.slug}?guide=${guide.slug}`} className="self-start text-sm font-medium text-forest-800 underline underline-offset-4">
                      Book with {first} →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
