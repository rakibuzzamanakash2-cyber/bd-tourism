import Link from "next/link";
import type { Metadata } from "next";
import { listDistricts } from "@/lib/districts";
import { DIVISIONS } from "@/lib/districts-data";
import { isDivision } from "@/lib/district-shared";
import { DistrictCard } from "@/components/districts/district-card";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ division?: string }> };

export const metadata: Metadata = {
  title: "All 64 districts of Bangladesh",
  description:
    "Every district of Bangladesh in one place, from the hills of Bandarban to the tea gardens of Sylhet and the Sundarbans. See what each one is known for and plan your trip.",
  alternates: { canonical: "/districts" },
};

export default async function DistrictsPage({ searchParams }: Props) {
  const { division } = await searchParams;
  const current = isDivision(division) ? division : undefined;
  const districts = await listDistricts();
  const groups = DIVISIONS.filter((v) => !current || v.slug === current).map((v) => ({
    ...v,
    districts: districts.filter((d) => d.division === v.slug),
  }));

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Districts</p>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
            64 districts. <em className="italic text-forest-700">Each one a different trip.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Bangladesh is small on the map and huge on the ground: mountains, mangroves, haor wetlands, river islands and
            3,000-year-old cities. Start anywhere, then let us plan the route.
          </p>
        </div>
      </section>

      <nav aria-label="Divisions" className="sticky top-16 z-30 border-b border-forest-900/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          <Pill href="/districts" active={!current}>All 64</Pill>
          {DIVISIONS.map((v) => (
            <Pill key={v.slug} href={`/districts?division=${v.slug}`} active={current === v.slug}>
              {v.name} <span className="text-ink-mute">{districts.filter((d) => d.division === v.slug).length}</span>
            </Pill>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {groups.map((g, gi) => (
          <section key={g.slug} aria-labelledby={`div-${g.slug}`}>
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-b border-forest-900/10 pb-4">
              <h2 id={`div-${g.slug}`} className="font-display text-3xl sm:text-4xl">
                {g.name} division <span className="font-bengali text-xl text-ink-mute">{g.nameBn} বিভাগ</span>
              </h2>
              <p className="text-sm text-ink-mute">{g.districts.length} districts</p>
            </div>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {g.districts.map((d, i) => (
                <DistrictCard key={d.id} district={d} places={d._count.destinations} priority={gi === 0 && i < 4} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors",
        active ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 hover:border-forest-900/40",
      )}
    >
      {children}
    </Link>
  );
}
