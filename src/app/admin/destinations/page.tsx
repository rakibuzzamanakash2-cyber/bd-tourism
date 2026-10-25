import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminPageHeader, FilterPills, SearchBox, Table, Td } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Destinations" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminDestinationsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const regions = await db.region.findMany({ orderBy: { name: "asc" } });
  const region = regions.find((r) => r.slug === str("region"))?.slug;
  const q = str("q")?.trim().slice(0, 100);
  const params = { region, q };

  const where: Prisma.DestinationWhereInput = {
    ...(region && { region: { slug: region } }),
    ...(q && { name: { contains: q, mode: "insensitive" } }),
  };
  const destinations = await db.destination.findMany({
    where,
    include: {
      region: { select: { name: true, isRestricted: true } },
      _count: { select: { packageStops: true, savedBy: true, images: true } },
    },
    orderBy: [{ isPublished: "desc" }, { name: "asc" }],
  });

  return (
    <div>
      <AdminPageHeader
        title="Destinations"
        description="The places on the site. Hidden ones stay in the system but disappear from the website."
        actions={
          <Link href="/admin/destinations/new" className="rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800">
            New destination
          </Link>
        }
      />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          options={regions.map((r) => ({ value: r.slug, label: r.name }))}
          current={region}
          param="region"
          basePath="/admin/destinations"
          params={params}
        />
        <SearchBox basePath="/admin/destinations" params={params} placeholder="Search by name" />
      </div>
      <Table head={["Destination", "Region", "On site", "Tours", "Photos", "Saved by"]} empty={destinations.length === 0}>
        {destinations.map((d) => (
          <tr key={d.id} className="hover:bg-paper-warm/60">
            <Td>
              <Link href={`/admin/destinations/${d.id}`} className="font-medium underline-offset-4 hover:underline">
                {d.name}
              </Link>
              <div className="text-xs text-ink-mute">/{d.slug}</div>
            </Td>
            <Td>
              {d.region.name}
              {d.region.isRestricted && <span className="ml-1 text-xs text-clay-700">permit</span>}
            </Td>
            <Td>
              {d.isPublished ? "Published" : <span className="text-ink-mute">Hidden</span>}
              {d.isFeatured && <div className="text-xs text-forest-700">Featured</div>}
            </Td>
            <Td>{d._count.packageStops}</Td>
            <Td>{d._count.images + 1}</Td>
            <Td>{d._count.savedBy}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
