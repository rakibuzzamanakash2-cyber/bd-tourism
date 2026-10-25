import { AdminPageHeader, Pagination, Table, Td } from "@/components/admin/ui";
import { dateTime, pagination } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Waitlist" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminWaitlistPage({ searchParams }: Props) {
  await requireAdmin();
  const { page, skip, take } = pagination((await searchParams).page, 50);
  const [entries, total] = await Promise.all([
    db.waitlistEntry.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
    db.waitlistEntry.count(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Homestay waitlist"
        description={`${total} ${total === 1 ? "person wants" : "people want"} an email when homestays open.`}
        actions={
          <a
            href="/admin/waitlist/export"
            className="rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800"
          >
            Download CSV
          </a>
        }
      />
      <Table head={["Email", "Joined", "Notified"]} empty={entries.length === 0}>
        {entries.map((e) => (
          <tr key={e.id}>
            <Td>{e.email}</Td>
            <Td className="text-xs text-ink-mute">{dateTime(e.createdAt)}</Td>
            <Td className="text-xs text-ink-mute">{e.notifiedAt ? dateTime(e.notifiedAt) : "Not yet"}</Td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} total={total} take={take} basePath="/admin/waitlist" params={{}} />
    </div>
  );
}
