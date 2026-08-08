import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await db.tourPackage.findUnique({
    where: { slug },
    select: { title: true, summary: true, featuredImage: true },
  });
  if (!pkg) return {};
  return {
    title: pkg.title,
    description: pkg.summary,
    openGraph: {
      title: pkg.title,
      description: pkg.summary,
      images: [pkg.featuredImage],
    },
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const pkg = await db.tourPackage.findUnique({
    where: { slug },
    include: {
      itinerary: {
        orderBy: { dayNumber: "asc" },
        include: { destination: { include: { region: true } } },
      },
    },
  });

  if (!pkg) notFound();

  const priceUSD = Number(pkg.basePriceUSD);

  const included: string[] = [];
  if (pkg.includesGuide) included.push("Verified local guide");
  if (pkg.includesLodging) included.push("All accommodation");
  if (pkg.includesTransport) included.push("Transport between stops");

  const notIncluded: string[] = [];
  if (!pkg.includesGuide) notIncluded.push("Guide (available as add-on)");
  if (!pkg.includesLodging) notIncluded.push("Accommodation");
  if (!pkg.includesTransport) notIncluded.push("Transport");
  notIncluded.push("International flights");
  notIncluded.push("Travel insurance");

  return (
    <>
      {/* Hero */}
      <section className="relative h-[min(72vh,620px)] w-full overflow-hidden">
        <Image
          src={pkg.featuredImage}
          alt={pkg.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/25 via-forest-950/35 to-forest-950/85" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          <Link
            href="/packages"
            className="mb-6 inline-flex items-center gap-2 text-sm text-paper/85 transition-colors hover:text-paper"
          >
            <ArrowLeft className="size-4" />
            All tours
          </Link>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-paper/85">
            <span>
              {pkg.durationDays} {pkg.durationDays === 1 ? "day" : "days"}
            </span>
            <span>·</span>
            <span>Max {pkg.maxTravelers} travelers</span>
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[0.98] text-paper sm:text-6xl md:text-7xl">
            {pkg.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/85">
            {pkg.summary}
          </p>
        </div>
      </section>

      {/* Body — itinerary + sticky booking sidebar */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          {/* LEFT — overview + day-by-day */}
          <div className="lg:col-span-2">
            <div className="max-w-2xl">
              <p className="eyebrow mb-4 text-forest-700">Overview</p>
              <p className="text-lg leading-relaxed text-ink">
                {pkg.description}
              </p>
            </div>

            {/* Day-by-day itinerary — the star */}
            {pkg.itinerary.length > 0 && (
              <div className="mt-16">
                <p className="eyebrow mb-4 text-forest-700">Day by day</p>
                <h2 className="mb-12 font-display text-4xl sm:text-5xl">
                  What each day looks like.
                </h2>

                <ol className="relative border-l-2 border-forest-900/10">
                  {pkg.itinerary.map((day) => (
                    <li key={day.id} className="relative pb-12 pl-8 last:pb-0">
                      {/* Day marker on the timeline */}
                      <span className="absolute -left-[13px] top-0 flex size-6 items-center justify-center rounded-full bg-forest-900 font-display text-xs text-paper">
                        {day.dayNumber}
                      </span>

                      <p className="eyebrow text-ink-mute">
                        Day {day.dayNumber}
                      </p>
                      <h3 className="mt-1 font-display text-3xl leading-tight">
                        {day.title}
                      </h3>

                      {day.destination && (
                        <Link
                          href={`/destinations/${day.destination.slug}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm text-forest-800 underline underline-offset-4"
                        >
                          <MapPin className="size-3.5" />
                          {day.destination.name}
                          <span className="text-ink-mute">
                            · {day.destination.region.name}
                          </span>
                        </Link>
                      )}

                      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
                        {day.description}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* What's included */}
            <div className="mt-16 grid gap-10 rounded-lg border border-forest-900/10 bg-paper-warm p-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-4 text-forest-700">Included</p>
                <ul className="space-y-3 text-sm">
                  {included.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-forest-700" />
                      <span className="text-ink">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-4 text-ink-mute">Not included</p>
                <ul className="space-y-3 text-sm">
                  {notIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-mute" />
                      <span className="text-ink-soft">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT — sticky booking card */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-forest-900/10 bg-paper p-6 shadow-sm">
              <p className="eyebrow mb-2 text-ink-mute">From</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl text-forest-900">
                  ${priceUSD.toFixed(0)}
                </span>
                <span className="text-sm text-ink-mute">per person</span>
              </div>

              <dl className="mt-6 space-y-3 border-t border-forest-900/10 pt-6 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Duration</dt>
                  <dd className="font-medium text-ink">
                    {pkg.durationDays}{" "}
                    {pkg.durationDays === 1 ? "day" : "days"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Group size</dt>
                  <dd className="font-medium text-ink">
                    Up to {pkg.maxTravelers}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Guide</dt>
                  <dd className="font-medium text-ink">
                    {pkg.includesGuide ? "Included" : "Add-on"}
                  </dd>
                </div>
              </dl>

              <Link
               href={`/book/${pkg.slug}`}
                className={cn(
                  buttonVariants(),
                  "mt-6 w-full rounded-full bg-forest-900 text-paper hover:bg-forest-800",
                )}
              >
                Book this tour
              </Link>
              <Link
                href="/contact"
                className="mt-3 block text-center text-sm text-ink-soft underline underline-offset-4 hover:text-forest-800"
              >
                Or ask us a question
              </Link>

              <p className="mt-6 border-t border-forest-900/10 pt-4 text-xs leading-relaxed text-ink-mute">
                No payment charged yet — you&rsquo;ll confirm dates and traveler
                count on the next screen.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
