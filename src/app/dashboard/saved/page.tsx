import { EmptyState } from "@/components/dashboard/empty-state";
import { DestinationCard } from "@/components/destinations/destination-card";
import { PackageCard } from "@/components/packages/package-card";
import { DistrictCard } from "@/components/districts/district-card";
import { PlaceCard } from "@/components/districts/place-card";
import { HomestayCard } from "@/components/homestays/homestay-card";
import { publicHomestayWhere } from "@/lib/homestays";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata = {
  title: "Saved",
};

export default async function SavedPage() {
  const user = await requireUser("/dashboard/saved");

  const [destinations, packages, districts, places, homestays] = await Promise.all([
    db.savedDestination.findMany({
      where: { userId: user.id, destination: { isPublished: true } },
      include: { destination: { include: { region: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.savedPackage.findMany({
      where: { userId: user.id, package: { isPublished: true } },
      include: { package: true },
      orderBy: { createdAt: "desc" },
    }),
    db.savedDistrict.findMany({ where: { userId: user.id }, include: { district: true }, orderBy: { createdAt: "desc" } }),
    db.savedPlace.findMany({
      where: { userId: user.id, place: { isPublished: true } },
      include: { place: { include: { district: { select: { slug: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.savedHomestay.findMany({
      where: { userId: user.id, homestay: publicHomestayWhere },
      include: { homestay: { include: { region: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const nothingSaved = destinations.length + packages.length + districts.length + places.length + homestays.length === 0;

  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Saved</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Your wishlist.</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
        Places, districts, homestays and tours you&rsquo;ve saved. Tap the heart
        on any of them to add it here.
      </p>

      {nothingSaved ? (
        <EmptyState
          title="Nothing saved yet."
          body="Tap the heart on a district, place, homestay or tour and it will appear here."
          cta={{ label: "Explore the 64 districts", href: "/districts" }}
          alt={{ label: "Or see tours", href: "/packages" }}
        />
      ) : (
        <div className="mt-12 space-y-16">
          {packages.length > 0 && (
            <section>
              <h2 className="eyebrow mb-6 font-sans text-forest-700">
                Tours · {packages.length}
              </h2>
              <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {packages.map(({ package: p }) => (
                  <PackageCard key={p.id} package={p} saved signedIn />
                ))}
              </div>
            </section>
          )}
          {places.length > 0 && (
            <section>
              <h2 className="eyebrow mb-6 font-sans text-forest-700">Places to visit · {places.length}</h2>
              <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {places.map(({ place: pl }) => (
                  <div key={pl.id}>
                    <PlaceCard place={pl} districtSlug={pl.district.slug} saved signedIn />
                    <p className="mt-1 text-xs text-ink-mute">{pl.district.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {districts.length > 0 && (
            <section>
              <h2 className="eyebrow mb-6 font-sans text-forest-700">Districts · {districts.length}</h2>
              <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {districts.map(({ district: d }) => (
                  <DistrictCard key={d.id} district={d} saved signedIn />
                ))}
              </div>
            </section>
          )}
          {homestays.length > 0 && (
            <section>
              <h2 className="eyebrow mb-6 font-sans text-forest-700">Homestays · {homestays.length}</h2>
              <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {homestays.map(({ homestay: h }) => (
                  <HomestayCard key={h.id} h={h} saved signedIn />
                ))}
              </div>
            </section>
          )}
          {destinations.length > 0 && (
            <section>
              <h2 className="eyebrow mb-6 font-sans text-forest-700">
                Destinations · {destinations.length}
              </h2>
              <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
                {destinations.map(({ destination: d }) => (
                  <DestinationCard key={d.id} destination={d} saved signedIn />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
