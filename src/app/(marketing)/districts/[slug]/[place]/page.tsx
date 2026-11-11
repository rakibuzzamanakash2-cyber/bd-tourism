import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, ChevronRight, Info, Lightbulb, Navigation, ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bookOptionsForDistrict } from "@/lib/book-options";
import { creditsFor } from "@/lib/image-credits";
import { getSavedState } from "@/lib/saved";
import { PhotoCredit } from "@/components/photo-credit";
import { BookDialog } from "@/components/booking/book-dialog";
import { SaveButton } from "@/components/saved/save-button";
import { PlaceCard, placeKindLabel } from "@/components/districts/place-card";

type Props = { params: Promise<{ slug: string; place: string }> };

async function load(districtSlug: string, placeSlug: string) {
  const district = await db.district.findUnique({ where: { slug: districtSlug }, select: { id: true } });
  if (!district) return null;
  return db.districtPlace.findFirst({
    where: { districtId: district.id, slug: placeSlug, isPublished: true },
    include: { district: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, place: placeSlug } = await params;
  const place = await load(slug, placeSlug);
  if (!place) return { title: "Place not found" };
  return {
    title: `${place.name}, ${place.district.name}`,
    description: place.description,
    alternates: { canonical: `/districts/${place.district.slug}/${place.slug}` },
    openGraph: place.photo ? { images: [place.photo] } : undefined,
  };
}

export default async function PlacePage({ params }: Props) {
  const { slug, place: placeSlug } = await params;
  const place = await load(slug, placeSlug);
  if (!place) notFound();
  const d = place.district;

  const [more, saved, options, session] = await Promise.all([
    db.districtPlace.findMany({
      where: { districtId: d.id, isPublished: true, NOT: { id: place.id } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      take: 6,
    }),
    getSavedState(),
    bookOptionsForDistrict(d.id),
    auth(),
  ]);
  const photos = [place.photo, ...place.gallery, ...more.map((m) => m.photo)].filter((u): u is string => Boolean(u));
  const credits = await creditsFor(photos);

  const facts = [
    place.bestTime && { icon: CalendarDays, label: "Best time to go", value: place.bestTime },
    place.gettingThere && { icon: Navigation, label: "Getting there", value: place.gettingThere },
    place.goodToKnow && { icon: Info, label: "Good to know", value: place.goodToKnow },
    place.tip && { icon: Lightbulb, label: "Tip", value: place.tip },
  ].filter((x): x is { icon: typeof Info; label: string; value: string } => Boolean(x));

  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b border-forest-900/10 bg-paper-warm">
        <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-3 text-sm text-ink-mute sm:px-6 lg:px-8">
          <li><Link href="/districts" className="hover:text-forest-800">Districts</Link></li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li><Link href={`/districts/${d.slug}`} className="hover:text-forest-800">{d.name}</Link></li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li aria-current="page" className="text-ink">{place.name}</li>
        </ol>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.25fr_1fr] lg:px-8">
        <figure>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-forest-100">
            {place.photo ? (
              <Image src={place.photo} alt={place.name} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest-800 to-forest-950">
                <span className="px-6 text-center font-display text-4xl text-paper/20">{place.name}</span>
              </div>
            )}
          </div>
          {place.photo && <PhotoCredit credit={credits.get(place.photo)} className="mt-2 text-ink-mute" />}
        </figure>

        <div className="flex flex-col">
          <p className="eyebrow text-forest-700">
            {placeKindLabel(place.kind)} · <Link href={`/districts/${d.slug}`} className="hover:underline">{d.name}</Link>
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] sm:text-6xl">{place.name}</h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{place.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BookDialog
              title={place.name}
              context={{ districtId: d.id, placeId: place.id }}
              options={options}
              defaults={{ name: session?.user?.name ?? undefined, email: session?.user?.email ?? undefined }}
              label="Plan a visit"
            />
            <SaveButton
              kind="place"
              id={place.id}
              name={place.name}
              initialSaved={saved.placeIds.has(place.id)}
              signedIn={saved.signedIn}
              variant="inline"
              className="rounded-full border border-forest-900/20 px-4 py-2 hover:bg-forest-100 hover:no-underline"
            />
          </div>

          {d.permitRequired && (
            <p className="mt-6 flex gap-2 rounded-md bg-clay-500/10 p-3 text-sm">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-clay-700" aria-hidden />
              <span>
                Foreign visitors need a permit for {d.name}. We arrange it when you book.{" "}
                <Link href="/permits" className="underline underline-offset-4">How permits work</Link>
              </span>
            </p>
          )}

          {facts.length > 0 && (
            <dl className="mt-8 space-y-5 border-t border-forest-900/10 pt-6">
              {facts.map((f) => (
                <div key={f.label} className="flex gap-3">
                  <f.icon className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-mute">{f.label}</dt>
                    <dd className="mt-1 text-sm leading-relaxed">{f.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {place.about && (
        <section className="border-t border-forest-900/10">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <p className="eyebrow mb-4 text-forest-700">About {place.name}</p>
            <div className="space-y-4 text-lg leading-relaxed text-ink-soft">
              {place.about.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {place.gallery.length > 0 && (
        <section className="border-t border-forest-900/10 bg-paper-warm">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="eyebrow mb-6 text-forest-700">In pictures</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {place.gallery.map((url) => (
                <figure key={url}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-forest-100">
                    <Image src={url} alt={place.name} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                  </div>
                  <PhotoCredit credit={credits.get(url)} className="mt-1 text-ink-mute" />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="border-t border-forest-900/10">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl sm:text-4xl">More in {d.name}</h2>
              <Link href={`/districts/${d.slug}`} className="text-sm underline underline-offset-4">
                Everything in {d.name} →
              </Link>
            </div>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((m) => (
                <PlaceCard
                  key={m.id}
                  place={m}
                  districtSlug={d.slug}
                  credit={m.photo ? credits.get(m.photo) : undefined}
                  saved={saved.placeIds.has(m.id)}
                  signedIn={saved.signedIn}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
