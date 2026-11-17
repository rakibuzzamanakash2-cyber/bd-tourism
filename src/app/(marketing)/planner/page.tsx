import type { Metadata } from "next";
import { TripPlanner, type PlannerDistrict } from "@/components/planner/trip-planner";
import { db } from "@/lib/db";
import { divisionName } from "@/lib/district-shared";
import { readSettings } from "@/lib/settings";
import type { DayTier } from "@/lib/costs";
import { TIER_ORDER } from "@/lib/costs";

export const metadata: Metadata = {
  title: "Plan your trip",
  description:
    "Choose the districts you want to see and how long in each, and get a rough price straight away. Then send the plan to us and we'll turn it into a real itinerary.",
  alternates: { canonical: "/planner" },
};

type Props = { searchParams: Promise<{ plan?: string; people?: string; level?: string }> };

export default async function PlannerPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [districts, rates, settings] = await Promise.all([
    db.district.findMany({
      select: { slug: true, name: true, division: true, costMultiplier: true, permitRequired: true },
      orderBy: { name: "asc" },
    }),
    db.costRate.findMany({ where: { isActive: true }, orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] }),
    readSettings(),
  ]);

  const list: PlannerDistrict[] = districts.map((d) => ({ ...d, division: divisionName(d.division) }));
  const people = Number.parseInt(sp.people ?? "", 10);
  const tier = (TIER_ORDER as readonly string[]).includes(sp.level ?? "") ? (sp.level as DayTier) : "comfortable";

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Plan your trip</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl">
            Build the trip you want, <em className="italic text-forest-700">then let us price it.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Choose the districts and how long you&rsquo;d like in each. You&rsquo;ll see roughly what it costs as you
            go. When it looks right, send it over and a person here turns it into a real itinerary.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <TripPlanner
          districts={list}
          rates={rates}
          serviceFeePercent={settings.serviceFeePercent}
          initialPlan={sp.plan ?? null}
          initialTravellers={Number.isFinite(people) && people >= 1 && people <= 20 ? people : 2}
          initialTier={tier}
        />
      </section>
    </>
  );
}
