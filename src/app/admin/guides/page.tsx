import Link from "next/link";
import { CreateGuideProfileButton } from "@/components/admin/guide-actions";
import { AdminPageHeader, Table, Td } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { bdt } from "@/lib/guide-shared";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Guides" };

export default async function AdminGuidesPage() {
  await requireAdmin();
  const now = new Date();
  const [guides, withoutProfile] = await Promise.all([
    db.guideProfile.findMany({
      include: {
        regions: { select: { name: true } },
        user: { select: { email: true, role: true } },
        assignments: { select: { status: true, payoutStatus: true, feeBDT: true, booking: { select: { startDate: true, status: true } } } },
      },
      orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
    }),
    db.user.findMany({ where: { role: "GUIDE", guideProfile: null }, select: { id: true, name: true, email: true } }),
  ]);

  return (
    <div>
      <AdminPageHeader title="Guides" description="Approved guides, their upcoming trips and what they're owed. Assign guides from each booking's page." />
      {withoutProfile.length > 0 && (
        <div className="mb-6 rounded-lg border border-clay-600/30 bg-clay-500/10 p-4 text-sm">
          <p className="font-medium text-clay-700">Guide accounts without a profile</p>
          <ul className="mt-2 space-y-2">
            {withoutProfile.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{u.name ?? u.email} <span className="text-ink-mute">· {u.email}</span></span>
                <CreateGuideProfileButton userId={u.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <Table head={["Guide", "Regions", "Status", "Waiting", "Upcoming", "Owed"]} empty={guides.length === 0}>
        {guides.map((g) => {
          const live = g.assignments.filter((a) => a.booking.status !== "CANCELLED");
          const pending = live.filter((a) => a.status === "PENDING").length;
          const upcoming = live.filter((a) => a.status === "ACCEPTED" && a.booking.startDate >= now).length;
          const owed = live.filter((a) => a.status === "ACCEPTED" && a.payoutStatus === "UNPAID").reduce((n, a) => n + a.feeBDT, 0);
          const state = g.user.role !== "GUIDE" ? "Not a guide account" : !g.isActive ? "Paused" : !g.isListed ? "Hidden by guide" : "Active";
          return (
            <tr key={g.id} className="hover:bg-paper-warm/60">
              <Td>
                <Link href={`/admin/guides/${g.id}`} className="font-medium underline-offset-4 hover:underline">{g.displayName}</Link>
                <div className="text-xs text-ink-mute">{g.phone} · {g.user.email}</div>
              </Td>
              <Td className="text-xs">{g.regions.map((r) => r.name).join(", ")}</Td>
              <Td className="text-sm">{state}</Td>
              <Td>{pending || "—"}</Td>
              <Td>{upcoming || "—"}</Td>
              <Td>{owed ? bdt(owed) : "—"}</Td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
