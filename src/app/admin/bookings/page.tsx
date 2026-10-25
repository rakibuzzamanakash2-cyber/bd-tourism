import Link from "next/link";
import type { BookingStatus, Prisma } from "@prisma/client";
import {
  AdminPageHeader,
  BOOKING_STATUS_LABEL,
  BookingStatusBadge,
  FilterPills,
  Pagination,
  SearchBox,
  Table,
  Td,
} from "@/components/admin/ui";
import { dateTime, money, pagination, shortDate } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { needsGuideWhere } from "@/lib/guide-shared";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Bookings" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATUSES = Object.keys(BOOKING_STATUS_LABEL).filter((s) => s !== "DRAFT") as BookingStatus[];

export default async function AdminBookingsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const status = STATUSES.includes(str("status") as BookingStatus) ? (str("status") as BookingStatus) : undefined;
  const q = str("q")?.trim().slice(0, 100);
  const { page, skip, take } = pagination(sp.page);
  const needsGuide = str("needsGuide") === "1";
  const params = { status, q, ...(needsGuide && { needsGuide: "1" }) };

  const where: Prisma.BookingWhereInput = {
    ...(status && { status }),
    ...(needsGuide && needsGuideWhere(new Date())),
    ...(q && {
      OR: [
        { bookingCode: { contains: q, mode: "insensitive" } },
        { tourist: { email: { contains: q, mode: "insensitive" } } },
        { tourist: { name: { contains: q, mode: "insensitive" } } },
        { package: { title: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      include: {
        package: { select: { title: true } },
        tourist: { select: { name: true, email: true } },
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.booking.count({ where }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title={needsGuide ? "Trips that need a guide" : "Bookings"}
        description={needsGuide ? "Paid tours that include a guide, with nobody asked yet (or the guide declined)." : "Every booking, newest first. Click one to manage it."}
      />
      {needsGuide && (
        <Link href="/admin/bookings" className="mb-4 inline-block text-sm text-ink-soft underline underline-offset-4">Show all bookings</Link>
      )}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          options={STATUSES.map((s) => ({ value: s, label: BOOKING_STATUS_LABEL[s] }))}
          current={status}
          param="status"
          basePath="/admin/bookings"
          params={params}
        />
        <SearchBox basePath="/admin/bookings" params={params} placeholder="Code, name, email or tour" />
      </div>

      <Table head={["Booking", "Traveler", "Trip dates", "Group", "Total", "Status", "Created"]} empty={bookings.length === 0}>
        {bookings.map((b) => (
          <tr key={b.id} className="hover:bg-paper-warm/60">
            <Td>
              <Link href={`/admin/bookings/${b.id}`} className="font-medium underline-offset-4 hover:underline">
                {b.package?.title ?? "Custom trip"}
              </Link>
              <div className="font-mono text-xs text-ink-mute">{b.bookingCode}</div>
            </Td>
            <Td>
              <div>{b.tourist.name ?? "—"}</div>
              <div className="text-xs text-ink-mute">{b.tourist.email}</div>
            </Td>
            <Td className="whitespace-nowrap">
              {shortDate(b.startDate)}
              {b.endDate.getTime() !== b.startDate.getTime() && (
                <div className="text-xs text-ink-mute">to {shortDate(b.endDate)}</div>
              )}
            </Td>
            <Td>{b.travelerCount}</Td>
            <Td className="whitespace-nowrap">
              {money(b.totalAmountUSD)}
              {b.refundAmountUSD !== null && Number(b.refundAmountUSD) > 0 && (
                <div className="text-xs text-clay-700">
                  refund {money(b.refundAmountUSD)}
                  {b.payment?.status === "REFUNDED" || b.payment?.status === "PARTIAL_REFUND" ? " ✓" : " owed"}
                </div>
              )}
            </Td>
            <Td>
              <BookingStatusBadge status={b.status} />
            </Td>
            <Td className="whitespace-nowrap text-xs text-ink-mute">{dateTime(b.createdAt)}</Td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} total={total} take={take} basePath="/admin/bookings" params={params} />
    </div>
  );
}
