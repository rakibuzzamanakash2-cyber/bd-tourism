import Link from "next/link";
import type { PaymentStatus, Prisma } from "@prisma/client";
import {
  AdminPageHeader,
  FilterPills,
  Pagination,
  PaymentStatusBadge,
  StatCard,
  Table,
  Td,
} from "@/components/admin/ui";
import { dateTime, daysAgo, money, pagination, paymentMethod } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Payments" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "SUCCEEDED", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "PARTIAL_REFUND", label: "Partly refunded" },
];

export default async function AdminPaymentsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const view = str("view") === "refunds" ? "refunds" : "all";
  const status = STATUS_OPTIONS.some((o) => o.value === str("status")) ? (str("status") as PaymentStatus) : undefined;
  const { page, skip, take } = pagination(sp.page);
  const params = { view: view === "refunds" ? "refunds" : undefined, status };

  const owedWhere: Prisma.BookingWhereInput = {
    status: "CANCELLED",
    refundAmountUSD: { gt: 0 },
    payment: { status: "SUCCEEDED" },
  };
  const since30 = daysAgo(30);

  const [collected30, owedSum, owedCount] = await Promise.all([
    db.payment.aggregate({
      _sum: { amountUSD: true },
      where: { status: { in: ["SUCCEEDED", "PARTIAL_REFUND", "REFUNDED"] }, paidAt: { gte: since30 } },
    }),
    db.booking.aggregate({ _sum: { refundAmountUSD: true }, where: owedWhere }),
    db.booking.count({ where: owedWhere }),
  ]);

  return (
    <div>
      <AdminPageHeader title="Payments" description="Money in, and refunds the team still has to send." />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected, 30 days" value={money(collected30._sum.amountUSD ?? 0)} />
        <StatCard
          label="Refunds owed"
          value={money(owedSum._sum.refundAmountUSD ?? 0)}
          hint={`${owedCount} booking${owedCount === 1 ? "" : "s"}`}
          href="/admin/payments?view=refunds"
          tone={owedCount > 0 ? "attention" : "default"}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-forest-900/10">
        <Tab href="/admin/payments" active={view === "all"}>
          All payments
        </Tab>
        <Tab href="/admin/payments?view=refunds" active={view === "refunds"}>
          Refunds owed ({owedCount})
        </Tab>
      </div>

      {view === "refunds" ? <RefundsOwed where={owedWhere} /> : <AllPayments status={status} page={page} skip={skip} take={take} params={params} />}
    </div>
  );
}

async function AllPayments({
  status,
  page,
  skip,
  take,
  params,
}: {
  status?: PaymentStatus;
  page: number;
  skip: number;
  take: number;
  params: Record<string, string | undefined>;
}) {
  const where: Prisma.PaymentWhereInput = status ? { status } : {};
  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: { booking: { select: { id: true, bookingCode: true, tourist: { select: { name: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.payment.count({ where }),
  ]);
  return (
    <>
      <div className="mb-4">
        <FilterPills options={STATUS_OPTIONS} current={status} param="status" basePath="/admin/payments" params={params} />
      </div>
      <Table head={["Booking", "Traveler", "Amount", "Method", "Status", "Paid", "Transaction"]} empty={payments.length === 0}>
        {payments.map((p) => (
          <tr key={p.id} className="hover:bg-paper-warm/60">
            <Td>
              <Link href={`/admin/bookings/${p.booking.id}`} className="font-mono text-xs underline-offset-4 hover:underline">
                {p.booking.bookingCode}
              </Link>
            </Td>
            <Td>{p.booking.tourist.name ?? p.booking.tourist.email}</Td>
            <Td className="whitespace-nowrap">{money(p.amountUSD)}</Td>
            <Td>{paymentMethod(p.provider)}</Td>
            <Td>
              <PaymentStatusBadge status={p.status} />
            </Td>
            <Td className="whitespace-nowrap text-xs text-ink-mute">{dateTime(p.paidAt)}</Td>
            <Td className="max-w-[180px] truncate font-mono text-xs text-ink-mute">{p.providerTxnId ?? "—"}</Td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} total={total} take={take} basePath="/admin/payments" params={params} />
    </>
  );
}

async function RefundsOwed({ where }: { where: Prisma.BookingWhereInput }) {
  const bookings = await db.booking.findMany({
    where,
    include: { tourist: { select: { name: true, email: true } }, package: { select: { title: true } }, payment: true },
    orderBy: { cancelledAt: "asc" },
  });
  return (
    <Table head={["Booking", "Traveler", "Paid", "Refund owed", "Cancelled", ""]} empty={bookings.length === 0}>
      {bookings.map((b) => (
        <tr key={b.id} className="hover:bg-paper-warm/60">
          <Td>
            {b.package?.title ?? "Custom trip"}
            <div className="font-mono text-xs text-ink-mute">{b.bookingCode}</div>
          </Td>
          <Td>
            {b.tourist.name ?? "—"}
            <div className="text-xs text-ink-mute">{b.tourist.email}</div>
          </Td>
          <Td className="whitespace-nowrap">
            {money(b.payment?.amountUSD)}
            <div className="text-xs text-ink-mute">{b.payment ? paymentMethod(b.payment.provider) : ""}</div>
          </Td>
          <Td className="whitespace-nowrap font-medium text-clay-700">{money(b.refundAmountUSD)}</Td>
          <Td className="whitespace-nowrap text-xs text-ink-mute">{dateTime(b.cancelledAt)}</Td>
          <Td>
            <Link href={`/admin/bookings/${b.id}`} className="text-sm underline underline-offset-4">
              Record refund
            </Link>
          </Td>
        </tr>
      ))}
    </Table>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-3 py-2 text-sm ${active ? "border-forest-900 font-medium text-forest-900" : "border-transparent text-ink-soft"}`}
    >
      {children}
    </Link>
  );
}
