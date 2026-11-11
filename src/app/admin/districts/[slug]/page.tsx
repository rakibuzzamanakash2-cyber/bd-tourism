import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { PlaceForm } from "@/components/admin/place-form";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "District places" };

export default async function AdminDistrictPlacesPage({ params }: Props) {
  await requireAdmin();
  const { slug } = await params;
  const district = await db.district.findUnique({
    where: { slug },
    include: { places: { orderBy: [{ order: "asc" }, { name: "asc" }] } },
  });
  if (!district) notFound();
  const shown = district.places.filter((p) => p.isPublished).length;
  return (
    <div className="max-w-3xl">
      <Link href="/admin/districts" className="text-sm underline underline-offset-4">← All districts</Link>
      <AdminPageHeader
        title={`Places in ${district.name}`}
        description={`${district.places.length} places, ${shown} shown on the site. Untick "Show on the site" to hide one.`}
      />
      <div className="space-y-2">
        {district.places.map((p) => (
          <PlaceForm
            key={p.id}
            districtId={district.id}
            uploadsEnabled={features.uploads}
            place={{
              id: p.id,
              name: p.name,
              kind: p.kind,
              description: p.description,
              tip: p.tip ?? "",
              about: p.about ?? "",
              bestTime: p.bestTime ?? "",
              gettingThere: p.gettingThere ?? "",
              goodToKnow: p.goodToKnow ?? "",
              photo: p.photo ?? "",
              isPublished: p.isPublished,
            }}
          />
        ))}
      </div>
      <h2 className="mb-3 mt-10 font-display text-2xl">Add a place</h2>
      <PlaceForm districtId={district.id} uploadsEnabled={features.uploads} place={{ name: "", kind: "SIGHT", description: "", tip: "", about: "", bestTime: "", gettingThere: "", goodToKnow: "", photo: "", isPublished: true }} />
      <p className="mt-6 text-sm">
        <a href={`/districts/${district.slug}`} target="_blank" className="underline underline-offset-4">View the public page</a>
      </p>
    </div>
  );
}
