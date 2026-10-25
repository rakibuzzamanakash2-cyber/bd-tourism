import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { TourForm } from "@/components/admin/tour-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Edit tour" };

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [tour, destinations] = await Promise.all([
    db.tourPackage.findUnique({
      where: { id },
      include: { itinerary: { orderBy: { dayNumber: "asc" } }, _count: { select: { bookings: true } } },
    }),
    db.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, region: { select: { name: true, isRestricted: true } } },
    }),
  ]);
  if (!tour) notFound();

  return (
    <div>
      <Link href="/admin/tours" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All tours
      </Link>
      <div className="mt-4">
        <AdminPageHeader
          title={tour.title}
          description={`${tour.isPublished ? "Published" : "Hidden"} · ${tour._count.bookings} booking${tour._count.bookings === 1 ? "" : "s"}. Price changes apply to new bookings only.`}
          actions={
            tour.isPublished ? (
              <a
                href={`/packages/${tour.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100"
              >
                View on site <ExternalLink className="size-3.5" />
              </a>
            ) : undefined
          }
        />
      </div>
      <TourForm
        uploadsEnabled={features.uploads}
        destinations={destinations.map((d) => ({ id: d.id, name: d.name, regionName: d.region.name, isRestricted: d.region.isRestricted }))}
        initial={{
          id: tour.id,
          title: tour.title,
          slug: tour.slug,
          summary: tour.summary,
          description: tour.description,
          basePriceUSD: Number(tour.basePriceUSD).toFixed(2),
          maxTravelers: String(tour.maxTravelers),
          featuredImage: tour.featuredImage,
          includesGuide: tour.includesGuide,
          includesLodging: tour.includesLodging,
          includesTransport: tour.includesTransport,
          isPublished: tour.isPublished,
          itinerary: tour.itinerary.map((d) => ({ title: d.title, description: d.description, destinationId: d.destinationId })),
        }}
      />
    </div>
  );
}
