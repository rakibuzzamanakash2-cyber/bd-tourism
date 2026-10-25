import type { Prisma, UserRole } from "@prisma/client";
import { RoleSelect } from "@/components/admin/role-select";
import { AdminPageHeader, FilterPills, Pagination, SearchBox, Table, Td } from "@/components/admin/ui";
import { dateTime, pagination } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Users" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ROLES: { value: UserRole; label: string }[] = [
  { value: "TOURIST", label: "Tourists" },
  { value: "GUIDE", label: "Guides" },
  { value: "HOST", label: "Hosts" },
  { value: "ADMIN", label: "Admins" },
];

export default async function AdminUsersPage({ searchParams }: Props) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const role = ROLES.some((r) => r.value === str("role")) ? (str("role") as UserRole) : undefined;
  const q = str("q")?.trim().slice(0, 100);
  const { page, skip, take } = pagination(sp.page);
  const params = { role, q };

  const where: Prisma.UserWhereInput = {
    ...(role && { role }),
    ...(q && {
      OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }],
    }),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        accounts: { select: { provider: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.user.count({ where }),
  ]);

  return (
    <div>
      <AdminPageHeader title="Users" description="Everyone with an account. Change a role to give staff access." />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills options={ROLES} current={role} param="role" basePath="/admin/users" params={params} />
        <SearchBox basePath="/admin/users" params={params} placeholder="Name or email" />
      </div>
      <Table head={["Name", "Email", "Sign-in", "Bookings", "Joined", "Role"]} empty={users.length === 0}>
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-paper-warm/60">
            <Td>{u.name ?? "—"}</Td>
            <Td>{u.email}</Td>
            <Td className="text-xs text-ink-mute">{u.accounts.some((a) => a.provider === "google") ? "Google" : "Email"}</Td>
            <Td>{u._count.bookings}</Td>
            <Td className="whitespace-nowrap text-xs text-ink-mute">{dateTime(u.createdAt)}</Td>
            <Td>
              <RoleSelect userId={u.id} role={u.role} isSelf={u.id === admin.id} />
            </Td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} total={total} take={take} basePath="/admin/users" params={params} />
    </div>
  );
}
