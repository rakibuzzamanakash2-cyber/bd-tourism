import "server-only";
import { db } from "@/lib/db";
import { publicHomestayWhere } from "@/lib/homestays";
import { distanceKm } from "@/lib/district-shared";

/** All 64 districts with how many places we feature in each. */
export async function listDistricts() {
  return db.district.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { destinations: { where: { isPublished: true } }, places: { where: { isPublished: true } } } } },
  });
}

/** One district page: its places, the tours that visit them, homestays, and the nearest districts. */
export async function getDistrictPage(slug: string) {
  const district = await db.district.findUnique({
    where: { slug },
    include: {
      destinations: { where: { isPublished: true }, include: { region: true }, orderBy: [{ isFeatured: "desc" }, { name: "asc" }] },
      places: { where: { isPublished: true }, orderBy: [{ order: "asc" }, { name: "asc" }] },
    },
  });
  if (!district) return null;

  const destinationIds = district.destinations.map((d) => d.id);
  const [tours, homestays, all] = await Promise.all([
    destinationIds.length
      ? db.tourPackage.findMany({
          where: { isPublished: true, itinerary: { some: { destinationId: { in: destinationIds } } } },
          orderBy: { basePriceUSD: "asc" },
          take: 6,
        })
      : Promise.resolve([]),
    db.homestay.findMany({
      where: { ...publicHomestayWhere, district: { equals: district.name, mode: "insensitive" } },
      include: { region: { select: { name: true } } },
      take: 6,
    }),
    db.district.findMany({ select: { slug: true, name: true, nameBn: true, latitude: true, longitude: true, photo: true, division: true } }),
  ]);

  const nearby = all
    .filter((d) => d.slug !== district.slug)
    .map((d) => ({ ...d, km: Math.round(distanceKm(district, d)) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 4);

  return { district, tours, homestays, nearby };
}
