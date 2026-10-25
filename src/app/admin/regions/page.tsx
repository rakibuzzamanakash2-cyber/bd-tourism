import { CategoryForm, RegionForm } from "@/components/admin/region-forms";
import { AdminPageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Regions & types" };

export default async function AdminRegionsPage() {
  await requireAdmin();
  const [regions, categories] = await Promise.all([
    db.region.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { destinations: true } } } }),
    db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { destinations: true } } } }),
  ]);
  return (
    <div>
      <AdminPageHeader
        title="Regions & types"
        description="Regions group destinations and decide whether a permit is needed. Types are the filters on the destinations page."
      />
      <div className="grid gap-10 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          <h2 className="font-display text-2xl">Regions</h2>
          {regions.map((r) => (
            <RegionForm
              key={r.id}
              region={{
                id: r.id,
                name: r.name,
                description: r.description ?? "",
                isRestricted: r.isRestricted,
                permitFeeBDT: r.permitFeeBDT?.toString() ?? "",
                destinations: r._count.destinations,
              }}
            />
          ))}
          <p className="pt-4 text-sm font-medium">Add a region</p>
          <RegionForm region={{ name: "", description: "", isRestricted: false, permitFeeBDT: "" }} />
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Types</h2>
          {categories.map((c) => (
            <CategoryForm key={c.id} id={c.id} name={c.name} count={c._count.destinations} />
          ))}
          <p className="pt-4 text-sm font-medium">Add a type</p>
          <CategoryForm />
        </section>
      </div>
    </div>
  );
}
