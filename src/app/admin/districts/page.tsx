import { AdminPageHeader } from "@/components/admin/ui";
import { DistrictForm } from "@/components/admin/district-form";
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
  return (
    <div>
      <AdminPageHeader
        title="Districts"
        description={`All ${districts.length} districts shown on /districts. ${withPhoto} have a photo. Run "npm run photos:wikimedia -- --districts" to fill the rest, or set one here.`}
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
                  }}
                />
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
