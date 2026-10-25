import Link from "next/link";
import { db } from "@/lib/db";
import { cn, countWord } from "@/lib/utils";
import { DestinationCard } from "@/components/destinations/destination-card";
import { getSavedState } from "@/lib/saved";

type SearchParams = Promise<{
  region?: string;
  category?: string;
}>;

export const metadata = {
  title: "All destinations",
  description:
    "Explore Bangladesh's mountains, beaches, mangroves, and tea gardens. Filter by region or type — restricted-area destinations included.",
};

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { region: regionSlug, category: categorySlug } = params;

  const [regions, categories, destinations, savedState] = await Promise.all([
    db.region.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.destination.findMany({
      where: {
        isPublished: true,
        ...(regionSlug && { region: { slug: regionSlug } }),
        ...(categorySlug && { categories: { some: { slug: categorySlug } } }),
      },
      include: { region: true, categories: true },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    }),
    getSavedState(),
  ]);

  const currentRegion = regions.find((r) => r.slug === regionSlug);
  const currentCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <>
      {/* Page header */}
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">
            {currentRegion ? "Region" : currentCategory ? "Type" : "All destinations"}
          </p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
            {currentRegion
              ? currentRegion.name
              : currentCategory
                ? currentCategory.name
                : `${countWord(destinations.length)} ${destinations.length === 1 ? "place" : "places"}, one country.`}
          </h1>
          {currentRegion?.description && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {currentRegion.description}
            </p>
          )}
        </div>
      </section>

      {/* Sticky filter bar */}
      <section className="sticky top-16 z-30 border-b border-forest-900/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FilterRow label="Region">
            <FilterPill
              href={makeUrl(params, "region", undefined)}
              active={!regionSlug}
            >
              All regions
            </FilterPill>
            {regions.map((r) => (
              <FilterPill
                key={r.id}
                href={makeUrl(params, "region", r.slug)}
                active={regionSlug === r.slug}
              >
                {r.name}
                {r.isRestricted && (
                  <span className="ml-1 text-clay-600" aria-label="Permit required">
                    ·
                  </span>
                )}
              </FilterPill>
            ))}
          </FilterRow>

          <FilterRow label="Type">
            <FilterPill
              href={makeUrl(params, "category", undefined)}
              active={!categorySlug}
            >
              All types
            </FilterPill>
            {categories.map((c) => (
              <FilterPill
                key={c.id}
                href={makeUrl(params, "category", c.slug)}
                active={categorySlug === c.slug}
              >
                {c.name}
              </FilterPill>
            ))}
          </FilterRow>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {destinations.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-8 flex items-baseline justify-between">
              <p className="text-sm text-ink-mute">
                {destinations.length}{" "}
                {destinations.length === 1 ? "place" : "places"}
              </p>
              {(regionSlug || categorySlug) && (
                <Link
                  href="/destinations"
                  className="text-sm text-ink-mute underline underline-offset-4 hover:text-forest-800"
                >
                  Clear filters
                </Link>
              )}
            </div>
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d) => (
                <DestinationCard
                  key={d.id}
                  destination={d}
                  saved={savedState.destinationIds.has(d.id)}
                  signedIn={savedState.signedIn}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

// ============================================================
// HELPERS
// ============================================================

function makeUrl(
  current: { region?: string; category?: string },
  key: "region" | "category",
  value: string | undefined,
): string {
  const params = new URLSearchParams();
  if (key !== "region" && current.region) params.set("region", current.region);
  if (key !== "category" && current.category)
    params.set("category", current.category);
  if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/destinations?${qs}` : "/destinations";
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-forest-900/5 py-3 last:border-b-0">
      <span className="eyebrow shrink-0 text-ink-mute">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-forest-900 bg-forest-900 text-paper"
          : "border-forest-900/15 bg-paper text-ink-soft hover:border-forest-900/40 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-forest-900/10 bg-paper-warm px-8 py-20 text-center">
      <p className="font-display text-4xl">Nothing here yet.</p>
      <p className="mt-4 text-ink-soft">
        Try a different filter, or{" "}
        <Link
          href="/destinations"
          className="underline underline-offset-4 hover:text-forest-800"
        >
          see all destinations
        </Link>
        .
      </p>
    </div>
  );
}
