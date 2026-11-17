import { describePlan, parsePlan } from "@/lib/trip-plan";
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
//   /book/custom?plan=sylhet:3,bandarban:2&people=2&level=comfortable  (from /planner)

type Search = { destination?: string; district?: string; place?: string; plan?: string; people?: string; level?: string };
type PageProps = { searchParams: Promise<Search> };

export const metadata = { title: "Book a custom trip", robots: { index: false } };

async function resolve(sp: Search) {
  // A trip sketched in the planner: several districts with nights in each.
  if (sp.plan) {
    const stops = parsePlan(sp.plan);
    if (stops.length === 0) return null;
    const found = await db.district.findMany({
      where: { slug: { in: stops.map((st) => st.slug) } },
      select: { id: true, slug: true, name: true, permitRequired: true },
    });
    // Keep the traveller's order, not the database's.
    const ordered = stops.flatMap((st) => {
      const d = found.find((f) => f.slug === st.slug);
      return d ? [{ ...d, nights: st.nights }] : [];
    });
    if (ordered.length === 0) return null;
    const nights = ordered.reduce((n, d) => n + d.nights, 0);
    return {
      title: describePlan(ordered),
      backHref: `/planner?plan=${encodeURIComponent(sp.plan)}`,
      // A booking points at one district; the rest of the route is written
      // into the notes below so whoever quotes it sees the whole trip.
      target: { districtId: ordered[0].id },
      permitNote: ordered.some((d) => d.permitRequired),
      prefill: {
        days: nights,
        travelerCount: Number.parseInt(sp.people ?? "", 10) || undefined,
        specialRequests: `My plan: ${ordered.map((d) => `${d.name} ${d.nights} night${d.nights === 1 ? "" : "s"}`).join(", ")}.${sp.level ? ` Travelling: ${sp.level}.` : ""}`,
      },
    };
  }
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
    const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => ["destination", "district", "place", "plan", "people", "level"].includes(k) && typeof v === "string") as [string, string][]);
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
          prefill={"prefill" in what ? what.prefill : undefined}
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
