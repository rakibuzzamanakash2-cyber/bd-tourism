import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type SavedState = {
  signedIn: boolean;
  destinationIds: Set<string>;
  packageIds: Set<string>;
};

/** What the current visitor has saved, for showing filled hearts on cards. */
export async function getSavedState(): Promise<SavedState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { signedIn: false, destinationIds: new Set(), packageIds: new Set() };

  const [destinations, packages] = await Promise.all([
    db.savedDestination.findMany({ where: { userId }, select: { destinationId: true } }),
    db.savedPackage.findMany({ where: { userId }, select: { packageId: true } }),
  ]);
  return {
    signedIn: true,
    destinationIds: new Set(destinations.map((d) => d.destinationId)),
    packageIds: new Set(packages.map((p) => p.packageId)),
  };
}
