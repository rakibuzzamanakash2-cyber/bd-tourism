import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { DIVISIONS } from "@/lib/districts-data";
import { divisionName, isDivision } from "@/lib/district-shared";
import { PLACE_KINDS } from "@/lib/places-data/types";
import { creditsFor } from "@/lib/image-credits";
import { getSavedState } from "@/lib/saved";
import { DestinationCard } from "@/components/destinations/destination-card";
import { PlaceCard } from "@/components/districts/place-card";

type Params = { division?: string; district?: string; type?: string; q?: string; page?: string };

const PER_PAGE = 24;

export const metadata: Metadata = {
  title: "All destinations in Bangladesh",
  description:
    "Every place to visit across the 64 districts of Bangladesh: sights, nature, mosques and temples, markets and local food. Filter by division, district or type.",
  alternates: { canonical: "/destinations" },
};

export default async function DestinationsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const division = isDivision(params.division) ? params.division : undefined;
  const type = PLACE_KINDS.find((k) => k.value.toLowerCase() === params.type?.toLowerCase())?.value;
  const q = (params.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const districts = await db.district.findMany({ orderBy: { name: "asc" }, select: { id: true, slug: true, name: true, division: true } });
  // A district only counts when it belongs to the chosen division
  const district = districts.find((d) => d.slug === params.district && (!division || d.division === division));
  const activeDivision = division ?? (district?.division as typeof division);

  const where: Prisma.DistrictPlaceWhereInput = {
    isPublished: true,
    ...(district ? { districtId: district.id } : activeDivision ? { district: { division: activeDivision } } : {}),
    ...(type ? { kind: type } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { district: { name: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  // The hand-picked destinations with ready tours lead the first page
  const showFeatured = !type && !q && page === 1;

  const [total, places, featured, saved, totals] = await Promise.all([
    db.districtPlace.count({ where }),
    db.districtPlace.findMany({
      where,
      include: { district: { select: { slug: true, name: true } } },
      orderBy: [{ district: { name: "asc" } }, { order: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    showFeatured
      ? db.destination.findMany({
          where: {
            isPublished: true,
            ...(district ? { districtId: district.id } : activeDivision ? { district: { division: activeDivision } } : {}),
          },
          include: { region: true, categories: true },
          orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        })
      : [],
    getSavedState(),
    db.districtPlace.count({ where: { isPublished: true } }),
  ]);
  const credits = await creditsFor(places.map((p) => p.photo).filter((u): u is string => Boolean(u)));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const filtered = Boolean(activeDivision || district || type || q);

  const current: Params = { division: activeDivision, district: district?.slug, type: type?.toLowerCase(), q: q || undefined };
  const url = (change: Partial<Params>) => {
    const next = { ...current, ...change };
    const sp = new URLSearchParams();
    for (const key of ["division", "district", "type", "q", "page"] as const) if (next[key]) sp.set(key, next[key]!);
    const qs = sp.toString();
    return qs ? `/destinations?${qs}` : "/destinations";
  };

  const title = district
    ? district.name
    : activeDivision
      ? `${divisionName(activeDivision)} division`
      : `64 districts, ${totals} places, one country.`;

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">{district ? `${divisionName(district.division)} division` : activeDivision ? "Division" : "All destinations"}</p>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">{title}</h1>
          <form action="/destinations" className="mt-8 flex max-w-xl gap-2">
            {activeDivision && <input type="hidden" name="division" value={activeDivision} />}
            {district && <input type="hidden" name="district" value={district.slug} />}
            {type && <input type="hidden" name="type" value={type.toLowerCase()} />}
            <label className="relative flex-1">
              <span className="sr-only">Search places</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-mute" aria-hidden />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search a place, food or district"
                className="w-full rounded-full border border-forest-900/15 bg-paper py-2.5 pl-11 pr-4 text-sm outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-700/15"
              />
            </label>
            <button type="submit" className="rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper hover:bg-forest-800">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Filters */}
      <section id="filters" className="scroll-mt-20 border-b border-forest-900/10 bg-paper">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FilterRow label="Region">
            <Pill href={url({ division: undefined, district: undefined, page: undefined })} active={!activeDivision}>All regions</Pill>
            {DIVISIONS.map((v) => (
              <Pill key={v.slug} href={url({ division: v.slug, district: undefined, page: undefined })} active={activeDivision === v.slug}>
                {v.name}
              </Pill>
            ))}
          </FilterRow>
          {activeDivision && (
            <FilterRow label="District">
              <Pill href={url({ district: undefined, page: undefined })} active={!district}>All of {divisionName(activeDivision)}</Pill>
              {districts
                .filter((d) => d.division === activeDivision)
                .map((d) => (
                  <Pill key={d.id} href={url({ district: d.slug, page: undefined })} active={district?.id === d.id}>
                    {d.name}
                  </Pill>
                ))}
            </FilterRow>
          )}
          <FilterRow label="Type">
            <Pill href={url({ type: undefined, page: undefined })} active={!type}>All types</Pill>
            {PLACE_KINDS.map((k) => (
              <Pill key={k.value} href={url({ type: k.value.toLowerCase(), page: undefined })} active={type === k.value}>
                {k.label}
              </Pill>
            ))}
          </FilterRow>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="border-b border-forest-900/10 bg-paper-warm/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="eyebrow mb-3 text-forest-700">Top destinations</p>
            <h2 className="mb-8 font-display text-3xl sm:text-4xl">Our best-loved places, with ready-made tours</h2>
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((d) => (
                <DestinationCard key={d.id} destination={d} saved={saved.destinationIds.has(d.id)} signedIn={saved.signedIn} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-3xl sm:text-4xl">
            {q ? `Results for “${q}”` : type ? PLACE_KINDS.find((k) => k.value === type)!.label : "Places to visit"}
            <span className="ml-3 font-sans text-sm text-ink-mute">
              {total} {total === 1 ? "place" : "places"}
            </span>
          </h2>
          {filtered && (
            <Link href="/destinations" className="text-sm text-ink-mute underline underline-offset-4 hover:text-forest-800">
              Clear filters
            </Link>
          )}
        </div>

        {places.length === 0 ? (
          <div className="rounded-lg border border-forest-900/10 bg-paper-warm px-8 py-16 text-center">
            <p className="font-display text-3xl">Nothing here yet.</p>
            <p className="mt-3 text-ink-soft">
              Try a different filter, or{" "}
              <Link href="/destinations" className="underline underline-offset-4 hover:text-forest-800">see all places</Link>.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((pl) => (
              <div key={pl.id}>
                <PlaceCard
                  place={pl}
                  districtSlug={pl.district.slug}
                  credit={pl.photo ? credits.get(pl.photo) : undefined}
                  saved={saved.placeIds.has(pl.id)}
                  signedIn={saved.signedIn}
                />
                <Link href={`/districts/${pl.district.slug}`} className="mt-2 inline-block text-xs uppercase tracking-wider text-forest-700 hover:underline">
                  {pl.district.name} district
                </Link>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="mt-14 flex flex-wrap items-center justify-center gap-2">
            {page > 1 && <PageLink href={url({ page: page === 2 ? undefined : String(page - 1) })}>← Previous</PageLink>}
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2)
              .map((n, i, shown) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - shown[i - 1] > 1 && <span className="text-ink-mute">…</span>}
                  <PageLink href={url({ page: n === 1 ? undefined : String(n) })} active={n === page}>{n}</PageLink>
                </span>
              ))}
            {page < pages && <PageLink href={url({ page: String(page + 1) })}>Next →</PageLink>}
          </nav>
        )}
      </section>
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-forest-900/5 py-2.5 last:border-b-0 md:items-start">
      <span className="eyebrow w-16 shrink-0 text-ink-mute md:pt-2">{label}</span>
      {/* Phones: swipe sideways (no scrollbar). Wider screens: wrap onto more lines. */}
      <div className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto md:flex-wrap md:overflow-visible">{children}</div>
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 bg-paper text-ink-soft hover:border-forest-900/40 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

function PageLink({ href, active = false, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-4 py-2 text-sm",
        active ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 hover:border-forest-900/40",
      )}
    >
      {children}
    </Link>
  );
}
