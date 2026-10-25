import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { DestinationForm } from "@/components/admin/destination-form";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { AdminPageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Edit destination" };

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [destination, regions, categories] = await Promise.all([
    db.destination.findUnique({
      where: { id },
      include: { categories: { select: { id: true } }, images: { orderBy: [{ order: "asc" }, { id: "asc" }] } },
    }),
    db.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isRestricted: true } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!destination) notFound();

  return (
    <div>
      <Link href="/admin/destinations" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All destinations
      </Link>
      <div className="mt-4">
        <AdminPageHeader
          title={destination.name}
          description={destination.isPublished ? "Published on the website." : "Hidden from the website."}
          actions={
            destination.isPublished ? (
              <a
                href={`/destinations/${destination.slug}`}
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
      <DestinationForm
        regions={regions}
        categories={categories}
        uploadsEnabled={features.uploads}
        initial={{
          id: destination.id,
          name: destination.name,
          slug: destination.slug,
          shortDesc: destination.shortDesc,
          longDesc: destination.longDesc,
          regionId: destination.regionId,
          categoryIds: destination.categories.map((c) => c.id),
          bestSeason: destination.bestSeason ?? "",
          averageBudget: destination.averageBudget ?? "",
          latitude: destination.latitude?.toString() ?? "",
          longitude: destination.longitude?.toString() ?? "",
          featuredImage: destination.featuredImage,
          isFeatured: destination.isFeatured,
          isPublished: destination.isPublished,
        }}
      />
      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl">Gallery</h2>
        <GalleryManager destinationId={destination.id} images={destination.images} uploadsEnabled={features.uploads} />
      </section>
    </div>
  );
}
