import Link from "next/link";
import type { PermitStatus, Prisma } from "@prisma/client";
import {
  AdminPageHeader,
  FilterPills,
  PermitStatusBadge,
  Table,
  Td,
} from "@/components/admin/ui";
import { dateTime, daysUntil, shortDate } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { OPEN_PERMIT_STATUSES, PERMIT_STATUS } from "@/lib/permit-labels";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Permits" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPermitsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : undefined;
  const status =
    raw && raw in PERMIT_STATUS ? (raw as PermitStatus) : undefined;
  const params = { status };
  // Default view: the ones still needing work, for trips that aren't cancelled
  const where: Prisma.PermitWhereInput = {
    booking: { status: { not: "CANCELLED" } },
    ...(status ? { status } : { status: { in: OPEN_PERMIT_STATUSES } }),
  };

  const permits = await db.permit.findMany({
    where,
    include: {
      region: { select: { name: true } },
      booking: {
        select: {
          id: true,
          bookingCode: true,
          startDate: true,
          travelerCount: true,
          tourist: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { booking: { startDate: "asc" } },
    take: 200,
  });

  return (
    <div>
      <AdminPageHeader
        title="Permits"
        description="Open permits first, soonest trips at the top. Trips within 10 days without approval are highlighted."
      />
      <div className="mb-6">
        <FilterPills
          options={(Object.keys(PERMIT_STATUS) as PermitStatus[]).map((s) => ({
            value: s,
            label: PERMIT_STATUS[s].label,
          }))}
          current={status}
          param="status"
          basePath="/admin/permits"
          params={params}
        />
        {!status && (
          <p className="mt-2 text-xs text-ink-mute">
            &ldquo;All&rdquo; shows permits still in progress.
          </p>
        )}
      </div>
      <Table
        head={[
          "Trip starts",
          "Region",
          "Traveler",
          "Booking",
          "Status",
          "Reference",
          "Updated",
        ]}
        empty={permits.length === 0}
      >
        {permits.map((p) => {
          const days = daysUntil(p.booking.startDate);
          const urgent =
            days <= 10 && p.status !== "APPROVED" && p.status !== "REJECTED";
          return (
            <tr
              key={p.id}
              className={cn(
                "hover:bg-paper-warm/60",
                urgent && "bg-clay-500/10",
              )}
            >
              <Td className="whitespace-nowrap">
                {shortDate(p.booking.startDate)}
                <div
                  className={cn(
                    "text-xs",
                    urgent ? "font-medium text-clay-700" : "text-ink-mute",
                  )}
                >
                  {days < 0
                    ? "started"
                    : days === 0
                      ? "today"
                      : `in ${days} day${days === 1 ? "" : "s"}`}
                </div>
              </Td>
              <Td>{p.region.name}</Td>
              <Td>
                {p.booking.tourist.name ?? p.booking.tourist.email}
                <div className="text-xs text-ink-mute">
                  {p.booking.travelerCount} traveler(s)
                </div>
              </Td>
              <Td>
                <Link
                  href={`/admin/bookings/${p.booking.id}`}
                  className="font-mono text-xs underline-offset-4 hover:underline"
                >
                  {p.booking.bookingCode}
                </Link>
              </Td>
              <Td>
                <PermitStatusBadge status={p.status} />
              </Td>
              <Td className="font-mono text-xs">{p.referenceNumber ?? "—"}</Td>
              <Td className="whitespace-nowrap text-xs text-ink-mute">
                {dateTime(p.updatedAt)}
              </Td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
