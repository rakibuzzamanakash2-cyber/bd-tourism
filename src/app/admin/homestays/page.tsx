import Link from "next/link";
import { CreateHomestayButton, EmailWaitlistButton } from "@/components/admin/homestay-actions";
import { AdminPageHeader, Table, Td } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { bdt } from "@/lib/guide-shared";
import { stayQuote } from "@/lib/homestay-shared";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Homestays" };

export default async function AdminHomestaysPage() {
  await requireAdmin();
  const now = new Date();
  const [homestays, withoutListing, waiting] = await Promise.all([
    db.homestay.findMany({
      include: {
        region: { select: { name: true } },
        host: { select: { email: true, role: true } },
        bookings: { where: { status: { not: "CANCELLED" } }, select: { status: true, startDate: true, endDate: true, hostPayoutStatus: true, hostPayoutBDT: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    }),
    db.user.findMany({ where: { role: "HOST", homestay: null }, select: { id: true, name: true, email: true } }),
    db.waitlistEntry.count({ where: { kind: "HOMESTAY", notifiedAt: null } }),
  ]);
  const live = homestays.filter((h) => h.isActive && h.isListed && h.host.role === "HOST").length;

  return (
    <div>
      <AdminPageHeader
        title="Homestays"
        description={`${live} live. Approving a host application creates its listing. Stays show up in Bookings like tours.`}
        actions={live > 0 && waiting > 0 ? <EmailWaitlistButton count={waiting} /> : undefined}
      />
      {withoutListing.length > 0 && (
        <div className="mb-6 rounded-lg border border-clay-600/30 bg-clay-500/10 p-4 text-sm">
          <p className="font-medium text-clay-700">Host accounts without a listing</p>
          <ul className="mt-2 space-y-2">
            {withoutListing.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{u.name ?? u.email} <span className="text-ink-mute">· {u.email}</span></span>
                <CreateHomestayButton userId={u.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <Table head={["Homestay", "Where", "Status", "Price", "Upcoming", "Owed to host"]} empty={homestays.length === 0}>
        {homestays.map((h) => {
          const upcoming = h.bookings.filter((b) => ["PAID", "CONFIRMED", "IN_PROGRESS"].includes(b.status) && b.endDate >= now).length;
          const owed = h.bookings.filter((b) => b.hostPayoutStatus === "UNPAID" && b.endDate <= now).reduce((n, b) => n + (b.hostPayoutBDT ?? 0), 0);
          const state = h.host.role !== "HOST" ? "Not a host account" : !h.isActive ? "Paused" : !h.isListed ? "Hidden by host" : h.photos.length === 0 ? "Live, no photos" : "Live";
          return (
            <tr key={h.id} className="hover:bg-paper-warm/60">
              <Td>
                <Link href={`/admin/homestays/${h.id}`} className="font-medium underline-offset-4 hover:underline">{h.name}</Link>
                <div className="text-xs text-ink-mute">{h.phone} · {h.host.email}</div>
              </Td>
              <Td className="text-xs">{h.district} · {h.region.name}</Td>
              <Td className="text-sm">{state}</Td>
              <Td className="text-sm">{bdt(stayQuote(h.facilities, 1).firstNightBDT)}<div className="text-xs text-ink-mute">+{bdt(stayQuote(h.facilities, 2).extraNightBDT)} / extra night ({stayQuote(h.facilities, 2).extraNightPercent}%)</div></Td>
              <Td>{upcoming || "—"}</Td>
              <Td>{owed ? bdt(owed) : "—"}</Td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
