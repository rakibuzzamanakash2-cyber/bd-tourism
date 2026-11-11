import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, House, Route, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { bookOptionsForDestination, bookOptionsForDistrict, type BookOptions } from "@/lib/book-options";
import { bdt } from "@/lib/guide-shared";

type Props = { searchParams: Promise<{ destination?: string; district?: string; place?: string }> };

export const metadata: Metadata = { title: "Book your trip", robots: { index: false } };

type Target = {
  title: string;
  back: { href: string; label: string };
  photo: string | null;
  /** The booking wizard for a custom trip to this place */
  customHref: string;
  options: BookOptions;
};

/** ?destination=jaflong · ?district=sylhet · ?place=sylhet/ratargul-swamp-forest */
async function resolve(sp: Awaited<Props["searchParams"]>): Promise<Target | null> {
  if (sp.destination) {
    const d = await db.destination.findFirst({ where: { slug: sp.destination, isPublished: true } });
    if (!d) return null;
    return {
      title: d.name,
      back: { href: `/destinations/${d.slug}`, label: d.name },
      photo: d.featuredImage,
      customHref: `/book/custom?destination=${d.slug}`,
      options: await bookOptionsForDestination(d),
    };
  }
  if (sp.place) {
    const [districtSlug, placeSlug] = sp.place.split("/");
    const pl = await db.districtPlace.findFirst({
      where: { slug: placeSlug ?? "", isPublished: true, district: { slug: districtSlug ?? "" } },
      include: { district: { select: { id: true, slug: true, name: true } } },
    });
    if (!pl) return null;
    return {
      title: pl.name,
      back: { href: `/districts/${pl.district.slug}/${pl.slug}`, label: pl.name },
      photo: pl.photo,
      customHref: `/book/custom?place=${pl.district.slug}/${pl.slug}`,
      options: await bookOptionsForDistrict(pl.district.id),
    };
  }
  if (sp.district) {
    const d = await db.district.findUnique({ where: { slug: sp.district } });
    if (!d) return null;
    return {
      title: d.name,
      back: { href: `/districts/${d.slug}`, label: d.name },
      photo: d.photo,
      customHref: `/book/custom?district=${d.slug}`,
      options: await bookOptionsForDistrict(d.id),
    };
  }
  return null;
}

export default async function PlanPage({ searchParams }: Props) {
  const t = await resolve(await searchParams);
  if (!t) notFound();
  const { tours, homestays, guides } = t.options;

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
          <div>
            <Link href={t.back.href} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-forest-800">
              <ArrowLeft className="size-4" /> Back to {t.back.label}
            </Link>
            <p className="eyebrow mb-3 mt-6 text-forest-700">Booking</p>
            <h1 className="font-display text-5xl leading-[1.02] sm:text-6xl">Book your trip to {t.title}</h1>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">
              Pick a ready-made tour or a homestay and book it straight away, or tell us your dates and we&rsquo;ll plan it for you.
            </p>
          </div>
          {t.photo && (
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-lg bg-forest-100 md:block">
              <Image src={t.photo} alt={t.title} fill sizes="40vw" className="object-cover" priority />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8">
        <div className="space-y-12">
          {tours.length > 0 && (
            <Group icon={Route} title="Tours that go here">
              {tours.map((x) => (
                <Row
                  key={x.slug}
                  title={x.title}
                  meta={`${x.days} ${x.days === 1 ? "day" : "days"} · from $${x.fromUSD} per person`}
                  details={`/packages/${x.slug}`}
                  book={{ href: `/book/${x.slug}`, label: "Book this tour" }}
                />
              ))}
            </Group>
          )}
          {homestays.length > 0 && (
            <Group icon={House} title="Stay with a family">
              {homestays.map((h) => (
                <Row key={h.slug} title={h.name} meta={`${h.area} · from ${bdt(h.firstNightBDT)}`} book={{ href: `/homestays/${h.slug}`, label: "Book a stay" }} />
              ))}
            </Group>
          )}
          {guides.length > 0 && (
            <Group icon={UserRound} title="Local guides">
              {guides.map((g) => (
                <Row key={g.slug} title={g.name} meta={g.languages.join(", ")} book={{ href: `/guides/${g.slug}`, label: "See guide" }} />
              ))}
            </Group>
          )}
          {tours.length + homestays.length + guides.length === 0 && (
            <p className="rounded-lg border border-dashed border-forest-900/20 p-8 text-ink-soft">
              We don&rsquo;t have a ready-made tour for {t.title} yet. Send us your dates and we&rsquo;ll put one together for you.
            </p>
          )}
        </div>

        <aside id="custom" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-forest-900/10 p-6 shadow-sm">
            <h2 className="font-display text-2xl">Book a custom trip</h2>
            <p className="mb-5 mt-1 text-sm text-ink-soft">
              Your dates, your pace. Tell us when you&rsquo;re coming and who&rsquo;s travelling; we plan the route, stays and guide, and send a
              price within 24 hours. You pay only when you&rsquo;re happy with it.
            </p>
            <Link href={t.customHref} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-900 px-6 py-3 text-sm font-medium text-paper hover:bg-forest-800">
              Start booking <ArrowRight className="size-4" />
            </Link>
            <p className="mt-3 text-xs text-ink-mute">Takes about 5 minutes. Have each traveler&rsquo;s passport to hand.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Group({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 font-display text-3xl">
        <Icon className="size-6 text-forest-700" /> {title}
      </h2>
      <div className="divide-y divide-forest-900/10 rounded-lg border border-forest-900/10">{children}</div>
    </section>
  );
}

function Row({ title, meta, details, book }: { title: string; meta: string; details?: string; book: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-ink-mute">{meta}</p>
        {details && (
          <Link href={details} className="mt-1 inline-block text-sm text-forest-800 underline underline-offset-4">
            See the itinerary
          </Link>
        )}
      </div>
      <Link href={book.href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-forest-900 px-5 py-2.5 text-sm font-medium text-paper hover:bg-forest-800">
        {book.label} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
