import "server-only";
import { db } from "@/lib/db";
import { publicHomestayWhere } from "@/lib/homestays";
import { publicGuideWhere } from "@/lib/guides";
import { stayQuote } from "@/lib/homestay-shared";

export type BookOptions = {
  tours: { slug: string; title: string; days: number; fromUSD: number }[];
  homestays: { slug: string; name: string; area: string; firstNightBDT: number }[];
  guides: { slug: string; name: string; languages: string[] }[];
};

/** What a traveler can book around a district: tours that go there, homestays and guides. */
export async function bookOptionsForDistrict(districtId: string): Promise<BookOptions> {
  const district = await db.district.findUnique({
    where: { id: districtId },
    select: { name: true, destinations: { where: { isPublished: true }, select: { id: true, regionId: true } } },
  });
  if (!district) return { tours: [], homestays: [], guides: [] };
  return bookOptions({
    districtName: district.name,
    destinationIds: district.destinations.map((d) => d.id),
    regionIds: [...new Set(district.destinations.map((d) => d.regionId))],
  });
}

/** For a destination page: its district's options, or its region's when it has no district. */
export async function bookOptionsForDestination(destination: { id: string; regionId: string; districtId: string | null }): Promise<BookOptions> {
  if (destination.districtId) return bookOptionsForDistrict(destination.districtId);
  return bookOptions({ destinationIds: [destination.id], regionIds: [destination.regionId] });
}

async function bookOptions({ districtName, destinationIds, regionIds }: { districtName?: string; destinationIds: string[]; regionIds: string[] }): Promise<BookOptions> {
  const homestayPlaces = [
    ...(districtName ? [{ district: { equals: districtName, mode: "insensitive" as const } }] : []),
    ...(regionIds.length ? [{ regionId: { in: regionIds } }] : []),
  ];

  const [tours, homestays, guides] = await Promise.all([
    destinationIds.length
      ? db.tourPackage.findMany({
          where: { isPublished: true, itinerary: { some: { destinationId: { in: destinationIds } } } },
          select: { slug: true, title: true, durationDays: true, basePriceUSD: true },
          orderBy: { basePriceUSD: "asc" },
          take: 4,
        })
      : [],
    homestayPlaces.length === 0 ? [] : db.homestay.findMany({
      where: { ...publicHomestayWhere, OR: homestayPlaces },
      select: { slug: true, name: true, area: true, district: true, facilities: true },
      take: 4,
    }),
    regionIds.length
      ? db.guideProfile.findMany({
          where: { ...publicGuideWhere, regions: { some: { id: { in: regionIds } } } },
          select: { slug: true, displayName: true, languages: true },
          take: 4,
        })
      : [],
  ]);

  return {
    tours: tours.map((t) => ({ slug: t.slug, title: t.title, days: t.durationDays, fromUSD: Number(t.basePriceUSD) })),
    homestays: homestays.map((h) => ({ slug: h.slug, name: h.name, area: `${h.area}, ${h.district}`, firstNightBDT: stayQuote(h.facilities, 1).firstNightBDT })),
    guides: guides.map((g) => ({ slug: g.slug, name: g.displayName, languages: g.languages })),
  };
}
