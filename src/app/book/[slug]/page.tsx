import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { SiteHeader } from "@/components/layout/site-header";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const pkg = await db.tourPackage.findUnique({
    where: { slug },
    select: { title: true },
  });
  return {
    title: pkg ? `Book · ${pkg.title}` : "Book",
  };
}

export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/book/${slug}`);
  }

  const [pkg, user] = await Promise.all([
    db.tourPackage.findUnique({
      where: { slug },
      include: {
        itinerary: {
          include: {
            destination: {
              include: { region: true },
            },
          },
        },
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      include: { touristProfile: true },
    }),
  ]);

  if (!pkg || !pkg.isPublished) notFound();
  if (!user) notFound();

  // Determine unique restricted regions visited on this tour
  const restrictedRegions = Array.from(
    new Map(
      pkg.itinerary
        .flatMap((d) => (d.destination?.region ? [d.destination.region] : []))
        .filter((r) => r.isRestricted)
        .map((r) => [r.id, r]),
    ).values(),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <BookingWizard
          package={{
            id: pkg.id,
            slug: pkg.slug,
            title: pkg.title,
            durationDays: pkg.durationDays,
            basePriceUSD: Number(pkg.basePriceUSD),
            maxTravelers: pkg.maxTravelers,
          }}
          user={{
            name: user.name,
            email: user.email,
            phone: user.touristProfile?.phoneNumber ?? null,
            passportNumber: user.touristProfile?.passportNumber ?? null,
            nationality: user.touristProfile?.nationality ?? null,
          }}
          restrictedRegions={restrictedRegions.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
          }))}
        />
      </main>
    </>
  );
}
