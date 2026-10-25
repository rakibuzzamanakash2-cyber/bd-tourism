import Link from "next/link";
import { AdminPageHeader, BookingStatusBadge, StatCard, Table, Td } from "@/components/admin/ui";
import { describeAction, money, shortDate, timeAgo } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Overview" };

const DAY = 24 * 60 * 60 * 1000;

export default async function AdminOverviewPage() {
  await requireAdmin();
  const now = new Date();
  const startOfToday = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }) + "T00:00:00+06:00");

  const [
    bookingsToday,
    bookingsWeek,
    revenue30,
    awaitingPayment,
    toConfirm,
    refundsOwed,
    newMessages,
    waitlist,
    users,
    permitsToDo,
    applicationsToReview,
    upcoming,
    recent,
    activity,
  ] = await Promise.all([
    db.booking.count({ where: { createdAt: { gte: startOfToday } } }),
    db.booking.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * DAY) } } }),
    db.payment.aggregate({
      _sum: { amountUSD: true },
      where: { status: { in: ["SUCCEEDED", "PARTIAL_REFUND"] }, paidAt: { gte: new Date(now.getTime() - 30 * DAY) } },
    }),
    db.booking.count({ where: { status: "PAYMENT_PENDING" } }),
    db.booking.count({ where: { status: "PAID" } }),
    db.booking.count({
      where: { status: "CANCELLED", refundAmountUSD: { gt: 0 }, payment: { status: "SUCCEEDED" } },
    }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.waitlistEntry.count(),
    db.user.count(),
    db.permit.count({
      where: { status: { in: ["NOT_STARTED", "DOCUMENTS_NEEDED"] }, booking: { status: { not: "CANCELLED" } } },
    }),
    db.partnerApplication.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW", "HOME_VISIT"] } } }),
    db.booking.findMany({
      where: {
        status: { in: ["PAID", "CONFIRMED", "IN_PROGRESS"] },
        startDate: { gte: new Date(now.getTime() - DAY), lte: new Date(now.getTime() + 14 * DAY) },
      },
      include: { package: { select: { title: true } }, tourist: { select: { name: true, email: true } } },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    db.booking.findMany({
      include: { package: { select: { title: true } }, tourist: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <AdminPageHeader title="Overview" description="What needs attention today, and how things are going." />

      <h2 className="mb-3 font-sans text-xs uppercase tracking-wider text-ink-mute">Needs attention</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Paid, to confirm"
          value={toConfirm}
          hint="Check details and confirm"
          href="/admin/bookings?status=PAID"
          tone={toConfirm > 0 ? "attention" : "default"}
        />
        <StatCard
          label="Refunds owed"
          value={refundsOwed}
          hint="Cancelled after payment"
          href="/admin/payments?view=refunds"
          tone={refundsOwed > 0 ? "attention" : "default"}
        />
        <StatCard
          label="New messages"
          value={newMessages}
          hint="From the contact form"
          href="/admin/messages?status=NEW"
          tone={newMessages > 0 ? "attention" : "default"}
        />
        <StatCard
          label="Permits to process"
          value={permitsToDo}
          hint="Not started or waiting on documents"
          href="/admin/permits"
          tone={permitsToDo > 0 ? "attention" : "default"}
        />
        <StatCard
          label="Applications"
          value={applicationsToReview}
          hint="Guides and hosts to review"
          href="/admin/applications"
          tone={applicationsToReview > 0 ? "attention" : "default"}
        />
        <StatCard
          label="Awaiting payment"
          value={awaitingPayment}
          hint="Expire after 24 hours"
          href="/admin/bookings?status=PAYMENT_PENDING"
        />
      </div>

      <h2 className="mb-3 mt-10 font-sans text-xs uppercase tracking-wider text-ink-mute">Numbers</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bookings today" value={bookingsToday} hint={`${bookingsWeek} in the last 7 days`} href="/admin/bookings" />
        <StatCard label="Revenue, 30 days" value={money(revenue30._sum.amountUSD ?? 0)} hint="Successful payments" href="/admin/payments" />
        <StatCard label="Homestay waitlist" value={waitlist} href="/admin/waitlist" />
        <StatCard label="Accounts" value={users} href="/admin/users" />
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-2xl">Trips in the next 14 days</h2>
        <Table head={["Start", "Tour", "Traveler", "Group", "Status"]} empty={upcoming.length === 0}>
          {upcoming.map((b) => (
            <tr key={b.id} className="hover:bg-paper-warm/60">
              <Td>{shortDate(b.startDate)}</Td>
              <Td>
                <Link href={`/admin/bookings/${b.id}`} className="font-medium underline-offset-4 hover:underline">
                  {b.package?.title ?? "Custom trip"}
                </Link>
                <div className="font-mono text-xs text-ink-mute">{b.bookingCode}</div>
              </Td>
              <Td>{b.tourist.name ?? b.tourist.email}</Td>
              <Td>{b.travelerCount}</Td>
              <Td>
                <BookingStatusBadge status={b.status} />
              </Td>
            </tr>
          ))}
        </Table>
      </section>

      <div className="mt-12 grid gap-10 xl:grid-cols-2">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Latest bookings</h2>
            <Link href="/admin/bookings" className="text-sm underline underline-offset-4">
              All bookings
            </Link>
          </div>
          <ul className="divide-y divide-forest-900/10 rounded-lg border border-forest-900/10">
            {recent.length === 0 && <li className="p-6 text-center text-sm text-ink-mute">No bookings yet.</li>}
            {recent.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/bookings/${b.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-paper-warm/60">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.package?.title ?? "Custom trip"}</p>
                    <p className="truncate text-xs text-ink-mute">
                      {b.tourist.name ?? b.tourist.email} · {timeAgo(b.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <BookingStatusBadge status={b.status} />
                    <p className="mt-1 text-xs text-ink-mute">{money(b.totalAmountUSD)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl">Recent admin activity</h2>
          <ul className="divide-y divide-forest-900/10 rounded-lg border border-forest-900/10 text-sm">
            {activity.length === 0 && <li className="p-6 text-center text-ink-mute">Nothing yet.</li>}
            {activity.map((a) => (
              <li key={a.id} className="flex justify-between gap-4 p-4">
                <span>
                  <span className="font-medium">{a.actor?.name ?? a.actor?.email ?? "System"}</span>{" "}
                  <span className="text-ink-soft">{describeAction(a.action)}</span>
                </span>
                <span className="shrink-0 text-xs text-ink-mute">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
