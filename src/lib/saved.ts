import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type SavedState = {
  signedIn: boolean;
  destinationIds: Set<string>;
  packageIds: Set<string>;
  districtIds: Set<string>;
  placeIds: Set<string>;
  homestayIds: Set<string>;
};

/** What the current visitor has saved, for showing filled hearts on cards. */
export async function getSavedState(): Promise<SavedState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { signedIn: false, destinationIds: new Set(), packageIds: new Set(), districtIds: new Set(), placeIds: new Set(), homestayIds: new Set() };
  }

  const [destinations, packages, districts, places, homestays] = await Promise.all([
    db.savedDestination.findMany({ where: { userId }, select: { destinationId: true } }),
    db.savedPackage.findMany({ where: { userId }, select: { packageId: true } }),
    db.savedDistrict.findMany({ where: { userId }, select: { districtId: true } }),
    db.savedPlace.findMany({ where: { userId }, select: { placeId: true } }),
    db.savedHomestay.findMany({ where: { userId }, select: { homestayId: true } }),
  ]);
  return {
    signedIn: true,
    destinationIds: new Set(destinations.map((d) => d.destinationId)),
    packageIds: new Set(packages.map((p) => p.packageId)),
    districtIds: new Set(districts.map((d) => d.districtId)),
    placeIds: new Set(places.map((p) => p.placeId)),
    homestayIds: new Set(homestays.map((h) => h.homestayId)),
  };
}
