import Link from "next/link";
import { AdminPageHeader, Table, Td } from "@/components/admin/ui";
import { money } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Tours" };

export default async function AdminToursPage() {
  await requireAdmin();
  const tours = await db.tourPackage.findMany({
    include: {
      _count: { select: { bookings: true, savedBy: true } },
      itinerary: { select: { destination: { select: { region: { select: { isRestricted: true } } } } } },
    },
    orderBy: [{ isPublished: "desc" }, { durationDays: "asc" }, { title: "asc" }],
  });

  return (
    <div>
      <AdminPageHeader
        title="Tours"
        description="Ready-made itineraries travelers can book."
        actions={
          <Link href="/admin/tours/new" className="rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800">
            New tour
          </Link>
        }
      />
      <Table head={["Tour", "Days", "Price / person", "Group", "On site", "Bookings", "Saved by"]} empty={tours.length === 0}>
        {tours.map((t) => (
          <tr key={t.id} className="hover:bg-paper-warm/60">
            <Td>
              <Link href={`/admin/tours/${t.id}`} className="font-medium underline-offset-4 hover:underline">
                {t.title}
              </Link>
              <div className="text-xs text-ink-mute">
                /{t.slug}
                {t.itinerary.some((d) => d.destination?.region.isRestricted) && <span className="ml-2 text-clay-700">permit</span>}
              </div>
            </Td>
            <Td>{t.durationDays}</Td>
            <Td>{money(t.basePriceUSD)}</Td>
            <Td>up to {t.maxTravelers}</Td>
            <Td>{t.isPublished ? "Published" : <span className="text-ink-mute">Hidden</span>}</Td>
            <Td>{t._count.bookings}</Td>
            <Td>{t._count.savedBy}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
