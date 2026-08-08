import { PackageCard } from "@/components/packages/package-card";

import Link from "next/link";
import { TourDuration } from "@prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";


type SearchParams = Promise<{
  duration?: string;
}>;

export const metadata = {
  title: "Tour packages",
  description:
    "One-day walks, three-day cruises, and week-long expeditions across Bangladesh — all with verified guides and permits arranged.",
};

// Duration filter options — mapped to the enum in the schema
const durationOptions = [
  { value: TourDuration.ONE_DAY, label: "1 day" },
  { value: TourDuration.THREE_DAY, label: "3 days" },
  { value: TourDuration.FIVE_DAY, label: "5 days" },
  { value: TourDuration.SEVEN_DAY, label: "7 days" },
  { value: TourDuration.EXTENDED, label: "Extended" },
];

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const durationFilter = params.duration as TourDuration | undefined;
  const validDuration = durationOptions.find((d) => d.value === durationFilter)
    ? durationFilter
    : undefined;

  const packages = await db.tourPackage.findMany({
    where: {
      isPublished: true,
      ...(validDuration && { duration: validDuration }),
    },
    orderBy: [{ durationDays: "asc" }, { title: "asc" }],
  });

  const currentLabel = durationOptions.find((d) => d.value === validDuration)?.label;

  return (
    <>
      {/* Header */}
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">
            {currentLabel ?? "All tours"}
          </p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
            {validDuration
              ? `${currentLabel} in Bangladesh.`
              : "One day, three days, or a real expedition."}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Every tour includes a verified local guide, transport, and — where
            required — the government permits. Pick a length that suits how
            much time you have.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-16 z-30 border-b border-forest-900/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-3">
            <span className="eyebrow shrink-0 text-ink-mute">Duration</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterPill href="/packages" active={!validDuration}>
                All
              </FilterPill>
              {durationOptions.map((d) => (
                <FilterPill
                  key={d.value}
                  href={`/packages?duration=${d.value}`}
                  active={validDuration === d.value}
                >
                  {d.label}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {packages.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-8 flex items-baseline justify-between">
              <p className="text-sm text-ink-mute">
                {packages.length} {packages.length === 1 ? "tour" : "tours"}
              </p>
              {validDuration && (
                <Link
                  href="/packages"
                  className="text-sm text-ink-mute underline underline-offset-4 hover:text-forest-800"
                >
                  Clear filter
                </Link>
              )}
            </div>
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((p, i) => (
                <PackageCard key={p.id} package={p} priority={i < 3} />
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
      <p className="font-display text-4xl">No tours in that length yet.</p>
      <p className="mt-4 text-ink-soft">
        Try a different duration, or{" "}
        <Link
          href="/packages"
          className="underline underline-offset-4 hover:text-forest-800"
        >
          see all tours
        </Link>
        .
      </p>
    </div>
  );
}
