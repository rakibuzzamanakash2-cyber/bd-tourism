import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { SiteHeader } from "@/components/layout/site-header";

// The same booking wizard as a tour, for a custom trip to a district, a place
// or a destination:
//   /book/custom?district=sylhet
//   /book/custom?place=sylhet/ratargul-swamp-forest
//   /book/custom?destination=jaflong

type Search = { destination?: string; district?: string; place?: string };
type PageProps = { searchParams: Promise<Search> };

export const metadata = { title: "Book a custom trip", robots: { index: false } };

async function resolve(sp: Search) {
  if (sp.place) {
    const [districtSlug, placeSlug] = sp.place.split("/");
    const pl = await db.districtPlace.findFirst({
      where: { slug: placeSlug ?? "", isPublished: true, district: { slug: districtSlug ?? "" } },
      select: { id: true, slug: true, name: true, district: { select: { id: true, slug: true, name: true, permitRequired: true } } },
    });
    return pl && {
      title: `${pl.name}, ${pl.district.name}`,
      backHref: `/districts/${pl.district.slug}/${pl.slug}`,
      target: { placeId: pl.id, districtId: pl.district.id },
      permitNote: pl.district.permitRequired,
    };
  }
  if (sp.destination) {
    const d = await db.destination.findFirst({
      where: { slug: sp.destination, isPublished: true },
      select: { id: true, slug: true, name: true, districtId: true, region: { select: { isRestricted: true } }, district: { select: { permitRequired: true } } },
    });
    return d && {
      title: d.name,
      backHref: `/destinations/${d.slug}`,
      target: { destinationId: d.id, districtId: d.districtId ?? undefined },
      permitNote: d.region.isRestricted || Boolean(d.district?.permitRequired),
    };
  }
  if (sp.district) {
    const d = await db.district.findUnique({ where: { slug: sp.district }, select: { id: true, slug: true, name: true, permitRequired: true } });
    return d && { title: d.name, backHref: `/districts/${d.slug}`, target: { districtId: d.id }, permitNote: d.permitRequired };
  }
  return null;
}

export default async function CustomBookingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) {
    const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => ["destination", "district", "place"].includes(k) && typeof v === "string") as [string, string][]);
    redirect(`/login?callbackUrl=${encodeURIComponent(`/book/custom?${qs}`)}`);
  }

  const [what, user] = await Promise.all([
    resolve(sp),
    db.user.findUnique({ where: { id: session.user.id }, include: { touristProfile: true } }),
  ]);
  if (!what || !user) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <BookingWizard
          trip={{ kind: "custom", maxTravelers: 20, ...what }}
          user={{
            name: user.name,
            email: user.email,
            phone: user.touristProfile?.phoneNumber ?? null,
            // Their own saved passport, to pre-fill the form for them
            passportNumber: decrypt(user.touristProfile?.passportNumber) ?? null,
            nationality: user.touristProfile?.nationality ?? null,
          }}
          restrictedRegions={[]}
        />
      </main>
    </>
  );
}
