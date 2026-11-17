import { AdminPageHeader } from "@/components/admin/ui";
import { DistrictForm } from "@/components/admin/district-form";
import { practicalFilled } from "@/lib/district-practical";
import { db } from "@/lib/db";
import { DIVISIONS } from "@/lib/districts-data";
import { features } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Districts" };

export default async function AdminDistrictsPage() {
  await requireAdmin();
  const districts = await db.district.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { destinations: true, places: true } } },
  });
  const withPhoto = districts.filter((d) => d.photo).length;
  const documented = districts.filter((d) => practicalFilled({
    travelTime: d.travelTime, bestMonths: d.bestMonths, whereToStay: d.whereToStay, moneyNotes: d.moneyNotes,
    connectivity: d.connectivity, gettingThere: d.gettingThere, safetyNotes: d.safetyNotes, permitNote: d.permitNote,
  }) >= 5).length;
  return (
    <div>
      <AdminPageHeader
        title="Districts"
        description={`All ${districts.length} districts shown on /districts. ${withPhoto} have a photo. Run "npm run photos:wikimedia -- --districts" to fill the rest, or set one here. ${documented} of ${districts.length} have enough "before you go" detail to be genuinely useful.`}
      />
      <div className="grid gap-10 lg:grid-cols-2">
        {DIVISIONS.map((v) => (
          <section key={v.slug} className="space-y-2">
            <h2 className="font-display text-2xl">{v.name}</h2>
            {districts
              .filter((d) => d.division === v.slug)
              .map((d) => (
                <DistrictForm
                  key={d.id}
                  uploadsEnabled={features.uploads}
                  district={{
                    id: d.id,
                    slug: d.slug,
                    name: d.name,
                    nameBn: d.nameBn,
                    photo: d.photo ?? "",
                    knownFor: d.knownFor,
                    highlights: d.highlights,
                    places: d._count.destinations,
                    things: d._count.places,
                    permitRequired: d.permitRequired,
                    travelTime: d.travelTime ?? "",
                    bestMonths: d.bestMonths ?? "",
                    whereToStay: d.whereToStay ?? "",
                    moneyNotes: d.moneyNotes ?? "",
                    connectivity: d.connectivity ?? "",
                    gettingThere: d.gettingThere ?? "",
                    safetyNotes: d.safetyNotes ?? "",
                    permitNote: d.permitNote ?? "",
                    costMultiplier: d.costMultiplier,
                  }}
                />
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
