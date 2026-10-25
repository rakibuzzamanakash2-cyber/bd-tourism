import Link from "next/link";
import type { ContactStatus, Prisma } from "@prisma/client";
import { AdminPageHeader, ContactStatusBadge, FilterPills, Pagination, Table, Td } from "@/components/admin/ui";
import { dateTime, pagination } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "READ", label: "Read" },
  { value: "REPLIED", label: "Replied" },
  { value: "ARCHIVED", label: "Archived" },
];

export default async function AdminMessagesPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : undefined;
  const status = OPTIONS.some((o) => o.value === raw) ? (raw as ContactStatus) : undefined;
  const { page, skip, take } = pagination(sp.page);
  const params = { status };
  // "All" hides archived messages; pick "Archived" to see them
  const where: Prisma.ContactMessageWhereInput = status ? { status } : { status: { not: "ARCHIVED" } };

  const [messages, total] = await Promise.all([
    db.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.contactMessage.count({ where }),
  ]);

  return (
    <div>
      <AdminPageHeader title="Messages" description="Everything sent through the contact form." />
      <div className="mb-6">
        <FilterPills options={OPTIONS} current={status} param="status" basePath="/admin/messages" params={params} />
      </div>
      <Table head={["From", "Subject", "Status", "Received"]} empty={messages.length === 0}>
        {messages.map((m) => (
          <tr key={m.id} className={cn("hover:bg-paper-warm/60", m.status === "NEW" && "font-medium")}>
            <Td>
              {m.name}
              <div className="text-xs font-normal text-ink-mute">{m.email}</div>
            </Td>
            <Td>
              <Link href={`/admin/messages/${m.id}`} className="underline-offset-4 hover:underline">
                {m.subject}
              </Link>
              <div className="line-clamp-1 text-xs font-normal text-ink-mute">{m.message}</div>
            </Td>
            <Td>
              <ContactStatusBadge status={m.status} />
            </Td>
            <Td className="whitespace-nowrap text-xs font-normal text-ink-mute">{dateTime(m.createdAt)}</Td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} total={total} take={take} basePath="/admin/messages" params={params} />
    </div>
  );
}
