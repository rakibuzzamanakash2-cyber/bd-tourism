import Link from "next/link";
import type { ApplicationKind, ApplicationStatus, Prisma } from "@prisma/client";
import { AdminPageHeader, ApplicationStatusBadge, FilterPills, Pagination, SearchBox, Table, Td } from "@/components/admin/ui";
import { dateTime, pagination } from "@/lib/admin-format";
import { APPLICATION_STATUS_LABEL } from "@/lib/applications";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Applications" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TO_REVIEW: ApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW", "HOME_VISIT"];

export default async function AdminApplicationsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const kind = str("kind") === "GUIDE" || str("kind") === "HOST" ? (str("kind") as ApplicationKind) : undefined;
  const status = str("status") && str("status")! in APPLICATION_STATUS_LABEL ? (str("status") as ApplicationStatus) : undefined;
  const q = str("q")?.trim().slice(0, 100);
  const { page, skip, take } = pagination(sp.page);
  const params = { kind, status, q };

  const where: Prisma.PartnerApplicationWhereInput = {
    ...(kind && { kind }),
    // Default view: the ones waiting on the team
    status: status ?? { in: TO_REVIEW },
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const [apps, total, drafts, regions] = await Promise.all([
    db.partnerApplication.findMany({
      where,
      include: { user: { select: { email: true } }, invite: { select: { id: true } } },
      orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
      skip,
      take,
    }),
    db.partnerApplication.count({ where }),
    db.partnerApplication.count({ where: { status: "DRAFT", ...(kind && { kind }) } }),
    db.region.findMany({ select: { id: true, name: true } }),
  ]);
  const regionName = new Map(regions.map((r) => [r.id, r.name]));

  return (
    <div>
      <AdminPageHeader
        title="Applications"
        description={`Guides and homestay hosts who want to work with DeltaWay. ${drafts} more started but haven't submitted yet.`}
        actions={
          <Link href="/admin/applications/invites" className="rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800">
            Invite someone
          </Link>
        }
      />
      <div className="mb-6 space-y-3">
        <FilterPills
          options={[
            { value: "GUIDE", label: "Guides" },
            { value: "HOST", label: "Hosts" },
          ]}
          current={kind}
          param="kind"
          basePath="/admin/applications"
          params={params}
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterPills
            options={Object.entries(APPLICATION_STATUS_LABEL).map(([value, label]) => ({ value, label }))}
            current={status}
            param="status"
            basePath="/admin/applications"
            params={params}
          />
          <SearchBox basePath="/admin/applications" params={params} placeholder="Name, phone or email" />
        </div>
        {!status && <p className="text-xs text-ink-mute">&ldquo;All&rdquo; shows applications waiting on the team, oldest first.</p>}
      </div>
      <Table head={["Applicant", "Type", "Regions", "Status", "Submitted", "Source"]} empty={apps.length === 0}>
        {apps.map((a) => (
          <tr key={a.id} className="hover:bg-paper-warm/60">
            <Td>
              <Link href={`/admin/applications/${a.id}`} className="font-medium underline-offset-4 hover:underline">
                {a.fullName}
              </Link>
              <div className="text-xs text-ink-mute">
                {a.phone} · {a.user.email}
              </div>
            </Td>
            <Td>{a.kind === "GUIDE" ? "Guide" : "Host"}</Td>
            <Td className="text-xs">{a.regionIds.map((id) => regionName.get(id) ?? "?").join(", ")}</Td>
            <Td>
              <ApplicationStatusBadge status={a.status} />
            </Td>
            <Td className="whitespace-nowrap text-xs text-ink-mute">{a.submittedAt ? dateTime(a.submittedAt) : "—"}</Td>
            <Td className="text-xs">{a.invite ? "Invited" : "Website"}</Td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} total={total} take={take} basePath="/admin/applications" params={params} />
    </div>
  );
}
