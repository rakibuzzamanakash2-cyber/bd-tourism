import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, MessageCircle, ShieldAlert } from "lucide-react";
import { getDistrictPage } from "@/lib/districts";
import { divisionName, divisionNameBn } from "@/lib/district-shared";
import { creditsFor } from "@/lib/image-credits";
import { getSavedState } from "@/lib/saved";
import { whatsappLink } from "@/lib/site";
import { PhotoCredit } from "@/components/photo-credit";
import { DestinationCard } from "@/components/destinations/destination-card";
import { PackageCard } from "@/components/packages/package-card";
import { HomestayCard } from "@/components/homestays/homestay-card";
import { DistrictPlaceholder } from "@/components/districts/district-card";
import { PlaceCard } from "@/components/districts/place-card";
import { BookDialog } from "@/components/booking/book-dialog";
import { SaveButton } from "@/components/saved/save-button";
import { bookOptionsForDistrict } from "@/lib/book-options";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getDistrictPage(slug);
  if (!page) return { title: "District not found" };
  const d = page.district;
  return {
    title: `${d.name} district: things to do and places to visit`,
    description: `${d.knownFor} Top places in ${d.name}: ${d.highlights.slice(0, 3).join(", ")}.`,
    alternates: { canonical: `/districts/${d.slug}` },
    openGraph: d.photo ? { images: [d.photo] } : undefined,
  };
}

export default async function DistrictPage({ params }: Props) {
  const { slug } = await params;
  const page = await getDistrictPage(slug);
  if (!page) notFound();
  const { district: d, tours, homestays, nearby } = page;
  const photos = [d.photo, ...d.places.map((x) => x.photo)].filter((u): u is string => Boolean(u));
  const [credits, saved, options] = await Promise.all([creditsFor(photos), getSavedState(), bookOptionsForDistrict(d.id)]);
  const toSee = d.places.filter((x) => x.kind !== "FOOD");
  const food = d.places.filter((x) => x.kind === "FOOD");
  const credit = d.photo ? credits.get(d.photo) : undefined;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-forest-950 text-paper">
        <div className="absolute inset-0 -z-10">
          {d.photo ? (
            <Image src={d.photo} alt={`${d.name}, Bangladesh`} fill priority sizes="100vw" className="object-cover opacity-70" />
          ) : (
            <DistrictPlaceholder nameBn={d.nameBn} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/50 to-forest-950/10" />
        </div>
        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col justify-end px-4 pb-12 pt-10 sm:min-h-[520px] sm:px-6 lg:px-8">
          <Link href="/destinations?view=districts" className="mb-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1.5 text-sm backdrop-blur hover:bg-paper/20">
            <ArrowLeft className="size-4" /> All districts
          </Link>
          <Link href={`/destinations?view=districts&division=${d.division}`} className="eyebrow mt-10 text-forest-200 hover:text-paper">
            {divisionName(d.division)} division · <span className="font-bengali normal-case tracking-normal">{divisionNameBn(d.division)} বিভাগ</span>
          </Link>
          <h1 className="mt-3 font-display text-6xl leading-none sm:text-7xl md:text-8xl">{d.name}</h1>
          <p className="mt-2 font-bengali text-2xl text-paper/70">{d.nameBn}</p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/85">{d.knownFor}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BookDialog
              title={d.name}
              options={options}
              customHref={`/book/custom?district=${d.slug}`}
              label={`Plan a trip to ${d.name}`}
              className="bg-paper text-forest-900 hover:bg-forest-100"
            />
            <SaveButton
              kind="district"
              id={d.id}
              name={d.name}
              initialSaved={saved.districtIds.has(d.id)}
              signedIn={saved.signedIn}
              variant="inline"
              className="rounded-full border border-paper/30 px-4 py-2 text-paper hover:bg-paper/10 hover:text-paper hover:no-underline"
            />
          </div>
        </div>
        {credit && (
          <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
            <PhotoCredit credit={credit} className="text-paper/50" />
          </div>
        )}
      </section>

      {d.permitRequired && (
        <div className="border-b border-clay-600/20 bg-clay-500/10">
          <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-4 text-sm sm:px-6 lg:px-8">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-clay-700" aria-hidden />
            <p>
              {d.name} is in the Chittagong Hill Tracts. Foreign visitors need a government permit, and we arrange it with your booking.{" "}
              <Link href="/permits" className="font-medium underline underline-offset-4">How permits work</Link>
            </p>
          </div>
        </div>
      )}

      {/* Things to do */}
      {toSee.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-4 text-forest-700">Things to do</p>
              <h2 className="font-display text-4xl sm:text-5xl">Places to visit in {d.name}</h2>
            </div>
            <p className="text-sm text-ink-mute">{toSee.length} places</p>
          </div>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {toSee.map((x) => (
              <PlaceCard key={x.id} place={x} districtSlug={d.slug} credit={x.photo ? credits.get(x.photo) : undefined} saved={saved.placeIds.has(x.id)} signedIn={saved.signedIn} />
            ))}
          </div>
        </section>
      )}

      {food.length > 0 && (
        <section className="border-t border-forest-900/10 bg-clay-500/5">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <p className="eyebrow mb-4 text-clay-700">Eat like a local</p>
            <h2 className="mb-10 font-display text-4xl sm:text-5xl">What to eat in {d.name}</h2>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {food.map((x) => (
                <PlaceCard key={x.id} place={x} districtSlug={d.slug} credit={x.photo ? credits.get(x.photo) : undefined} saved={saved.placeIds.has(x.id)} signedIn={saved.signedIn} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Short list, for a district with no places added yet */}
      {d.places.length === 0 && (
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div>
            <p className="eyebrow mb-4 text-forest-700">Don&rsquo;t miss</p>
            <h2 className="font-display text-4xl sm:text-5xl">Top places in {d.name}</h2>
          </div>
          <ol className="divide-y divide-forest-900/10 border-y border-forest-900/10">
            {d.highlights.map((h, i) => (
              <li key={h} className="flex items-baseline gap-5 py-4">
                <span className="font-display text-2xl text-forest-700">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg">{h}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {d.destinations.length > 0 && (
        <section className="border-t border-forest-900/10 bg-paper-warm">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <p className="eyebrow mb-4 text-forest-700">Places to visit</p>
            <h2 className="mb-10 font-display text-4xl">Explore {d.name} with us</h2>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {d.destinations.map((x) => (
                <DestinationCard key={x.id} destination={x} saved={saved.destinationIds.has(x.id)} signedIn={saved.signedIn} />
              ))}
            </div>
          </div>
        </section>
      )}

      {tours.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Tours</p>
          <h2 className="mb-10 font-display text-4xl">Tours that visit {d.name}</h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => (
              <PackageCard key={t.id} package={t} saved={saved.packageIds.has(t.id)} signedIn={saved.signedIn} />
            ))}
          </div>
        </section>
      )}

      {homestays.length > 0 && (
        <section className="border-t border-forest-900/10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Homestays</p>
          <h2 className="mb-10 font-display text-4xl">Stay with a family in {d.name}</h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {homestays.map((h) => (
              <HomestayCard key={h.id} h={h} />
            ))}
          </div>
        </section>
      )}

      {/* Plan */}
      <section className="bg-forest-900 text-paper">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">Want {d.name} in your trip?</h2>
            <p className="mt-2 max-w-xl text-paper/75">Tell us the districts and days you have. We&rsquo;ll plan the route, the stays and a guide, and send you a price.</p>
          </div>
          <a
            href={whatsappLink(`Hi DeltaWay, I'd like to plan a trip that includes ${d.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-paper text-forest-900 hover:bg-forest-100")}
          >
            <MessageCircle className="size-4" /> Plan it with us
          </a>
        </div>
      </section>

      {/* Nearby */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="eyebrow mb-4 text-forest-700">Close by</p>
        <h2 className="mb-8 font-display text-3xl">Nearby districts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {nearby.map((n) => (
            <Link key={n.slug} href={`/districts/${n.slug}`} className="group flex items-center gap-4 rounded-md border border-forest-900/10 p-3 hover:border-forest-900/30">
              <div className="relative size-16 shrink-0 overflow-hidden rounded bg-forest-900">
                {n.photo ? (
                  <Image src={n.photo} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center px-1 text-center font-bengali text-xs leading-tight text-paper/50">{n.nameBn}</span>
                )}
              </div>
              <div>
                <p className="font-medium group-hover:underline">{n.name}</p>
                <p className="flex items-center gap-1 text-xs text-ink-mute">
                  <MapPin className="size-3" aria-hidden /> about {n.km} km away
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
