import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TourForm } from "@/components/admin/tour-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "New tour" };

export default async function NewTourPage() {
  await requireAdmin();
  const destinations = await db.destination.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, region: { select: { name: true, isRestricted: true } } },
  });
  return (
    <div>
      <Link href="/admin/tours" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All tours
      </Link>
      <div className="mt-4">
        <AdminPageHeader title="New tour" description="It's saved as hidden until you tick Published." />
      </div>
      <TourForm
        uploadsEnabled={features.uploads}
        destinations={destinations.map((d) => ({ id: d.id, name: d.name, regionName: d.region.name, isRestricted: d.region.isRestricted }))}
        initial={{
          title: "",
          slug: "",
          summary: "",
          description: "",
          basePriceUSD: "",
          maxTravelers: "10",
          featuredImage: "",
          includesGuide: true,
          includesLodging: true,
          includesTransport: true,
          isPublished: false,
          itinerary: [],
        }}
      />
    </div>
  );
}
