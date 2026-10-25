import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DestinationForm } from "@/components/admin/destination-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "New destination" };

export default async function NewDestinationPage() {
  await requireAdmin();
  const [regions, categories] = await Promise.all([
    db.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isRestricted: true } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <div>
      <Link href="/admin/destinations" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All destinations
      </Link>
      <div className="mt-4">
        <AdminPageHeader title="New destination" description="It's saved as hidden until you tick Published." />
      </div>
      <DestinationForm
        regions={regions}
        categories={categories}
        uploadsEnabled={features.uploads}
        initial={{
          name: "",
          slug: "",
          shortDesc: "",
          longDesc: "",
          regionId: "",
          categoryIds: [],
          bestSeason: "",
          averageBudget: "",
          latitude: "",
          longitude: "",
          featuredImage: "",
          isFeatured: false,
          isPublished: false,
        }}
      />
    </div>
  );
}
