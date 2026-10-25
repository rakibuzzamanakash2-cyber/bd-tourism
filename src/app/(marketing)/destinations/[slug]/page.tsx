import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SaveButton } from "@/components/saved/save-button";
import { getSavedState } from "@/lib/saved";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await db.destination.findUnique({
    where: { slug },
    select: { name: true, shortDesc: true, featuredImage: true, isPublished: true },
  });
  if (!destination || !destination.isPublished) return {};
  return {
    title: destination.name,
    description: destination.shortDesc,
    openGraph: {
      title: destination.name,
      description: destination.shortDesc,
      images: [destination.featuredImage],
    },
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const destination = await db.destination.findUnique({
    where: { slug },
    include: {
      region: true,
      categories: true,
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!destination || !destination.isPublished) notFound();

  const [relatedPackages, savedState] = await Promise.all([
    db.tourPackage.findMany({
      where: {
        isPublished: true,
        itinerary: { some: { destinationId: destination.id } },
      },
      take: 3,
      orderBy: { durationDays: "asc" },
    }),
    getSavedState(),
  ]);

  const mapsUrl =
    destination.latitude && destination.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${destination.latitude},${destination.longitude}`
      : null;

  return (
    <>
      {/* Hero */}
      <section className="relative h-[min(78vh,680px)] w-full overflow-hidden">
        <Image
          src={destination.featuredImage}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/25 via-forest-950/30 to-forest-950/85" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          <Link
            href="/destinations"
            className="mb-6 inline-flex items-center gap-2 text-sm text-paper/85 transition-colors hover:text-paper"
          >
            <ArrowLeft className="size-4" />
            All destinations
          </Link>
          <p className="eyebrow mb-4 text-paper/80">
            {destination.region.name}
          </p>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.95] text-paper sm:text-7xl md:text-[5.5rem]">
            {destination.name}
          </h1>
          {destination.region.isRestricted && (
            <div className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-clay-600/95 px-4 py-2 text-sm text-paper backdrop-blur">
              <span className="size-1.5 rounded-full bg-paper" />
              Permit required — we handle it
            </div>
          )}
        </div>
      </section>

      {/* Description + practical sidebar */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          <div className="lg:col-span-2">
            <div className="max-w-2xl">
              <p className="text-lg leading-relaxed text-ink">
                {destination.longDesc}
              </p>

              {destination.categories.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2">
                  {destination.categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/destinations?category=${c.slug}`}
                      className="rounded-full border border-forest-900/15 bg-paper-warm px-3 py-1 text-xs uppercase tracking-wider text-forest-800 transition-colors hover:border-forest-900/40"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-forest-900/10 bg-paper-warm p-6">
              <p className="eyebrow mb-5 text-forest-700">Practical</p>
              <dl className="space-y-4 text-sm">
                {destination.bestSeason && (
                  <div>
                    <dt className="text-ink-mute">Best time to visit</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {destination.bestSeason}
                    </dd>
                  </div>
                )}
                {destination.averageBudget && (
                  <div>
                    <dt className="text-ink-mute">Budget</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {destination.averageBudget}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-ink-mute">Region</dt>
                  <dd className="mt-1 font-medium text-ink">
                    {destination.region.name}
                  </dd>
                </div>
                {destination.region.isRestricted &&
                  destination.region.permitFeeBDT && (
                    <div>
                      <dt className="text-ink-mute">Permit fee (per person)</dt>
                      <dd className="mt-1 font-medium text-ink">
                        BDT {destination.region.permitFeeBDT.toLocaleString()}
                      </dd>
                    </div>
                  )}
              </dl>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-sm text-forest-800 underline underline-offset-4"
                >
                  <MapPin className="size-4" />
                  View on map
                </a>
              )}

              <Link
                href={`/contact?subject=${encodeURIComponent(`Visiting ${destination.name}`)}`}
                className={cn(
                  buttonVariants(),
                  "mt-6 w-full rounded-full bg-forest-900 text-paper hover:bg-forest-800",
                )}
              >
                Ask us about visiting
              </Link>
              <div className="mt-4 text-center">
                <SaveButton
                  kind="destination"
                  id={destination.id}
                  name={destination.name}
                  initialSaved={savedState.destinationIds.has(destination.id)}
                  signedIn={savedState.signedIn}
                  variant="inline"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Gallery */}
      {destination.images.length > 0 && (
        <section className="border-t border-forest-900/10 bg-paper-warm">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="eyebrow mb-4 text-forest-700">In pictures</p>
            <h2 className="mb-12 font-display text-4xl sm:text-5xl">
              {destination.name},{" "}
              <em className="italic text-forest-700">up close.</em>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {destination.images.map((img) => (
                <figure
                  key={img.id}
                  className="relative aspect-[4/3] overflow-hidden bg-forest-100"
                >
                  <Image
                    src={img.url}
                    alt={img.caption ?? destination.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                  {img.caption && (
                    <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-forest-950/70 to-transparent px-4 py-3 text-xs text-paper">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related tour packages */}
      {relatedPackages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Tours that go here</p>
          <h2 className="mb-12 font-display text-4xl sm:text-5xl">
            Ready-made itineraries.
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {relatedPackages.map((p) => (
              <Link
                key={p.id}
                href={`/packages/${p.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-forest-100">
                  <Image
                    src={p.featuredImage}
                    alt={p.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-ink-mute">
                    <span>
                      {p.durationDays}{" "}
                      {p.durationDays === 1 ? "day" : "days"}
                    </span>
                    <span>·</span>
                    <span>from ${Number(p.basePriceUSD).toFixed(0)}</span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl leading-tight">
                    {p.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {p.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
