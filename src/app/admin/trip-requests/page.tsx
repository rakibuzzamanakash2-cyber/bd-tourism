import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui";
import { TripRequestForm } from "@/components/admin/trip-request-form";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { TripRequestStatus } from "@prisma/client";

export const metadata = { title: "Trip requests" };

const STATUSES: { value: TripRequestStatus | "ALL"; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "REPLIED", label: "Replied" },
  { value: "BOOKED", label: "Booked" },
  { value: "CLOSED", label: "Closed" },
  { value: "ALL", label: "All" },
];

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminTripRequestsPage({ searchParams }: Props) {
  await requireAdmin();
  const { status = "NEW" } = await searchParams;
  const current = STATUSES.find((s) => s.value === status)?.value ?? "NEW";
  const [requests, counts] = await Promise.all([
    db.tripRequest.findMany({
      where: current === "ALL" ? {} : { status: current },
      include: {
        district: { select: { slug: true, name: true } },
        place: { select: { slug: true, name: true, district: { select: { slug: true } } } },
        destination: { select: { slug: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.tripRequest.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div>
      <AdminPageHeader
        title="Trip requests"
        description="Travelers who clicked “Plan a trip” on a district, place or destination page. Reply by email with a plan and a price, then mark it as replied."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/admin/trip-requests?status=${s.value}`}
            className={cn("rounded-full border px-4 py-1.5 text-sm", current === s.value ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 hover:border-forest-900/40")}
          >
            {s.label}
            {s.value !== "ALL" && <span className="ml-1 opacity-70">{count(s.value)}</span>}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-forest-900/20 p-10 text-center text-ink-mute">No requests here.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const where = r.place
              ? { label: r.place.name, href: `/districts/${r.place.district.slug}/${r.place.slug}` }
              : r.destination
                ? { label: r.destination.name, href: `/destinations/${r.destination.slug}` }
                : r.district
                  ? { label: r.district.name, href: `/districts/${r.district.slug}` }
                  : null;
            const subject = `Your trip${where ? ` to ${where.label}` : ""} with DeltaWay`;
            return (
              <article key={r.id} className="rounded-lg border border-forest-900/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {r.name} <span className="font-normal text-ink-mute">· {r.country ?? "country not given"}</span>
                    </p>
                    <p className="text-sm text-ink-soft">
                      {where ? <Link href={where.href} className="underline underline-offset-4" target="_blank">{where.label}</Link> : "Anywhere"}
                      {" · "}
                      {r.travelers} {r.travelers === 1 ? "person" : "people"}
                      {r.startDate && ` · from ${r.startDate.toISOString().slice(0, 10)}`}
                      {r.days && ` · ${r.days} days`}
                    </p>
                  </div>
                  <p className="text-xs text-ink-mute">{r.createdAt.toISOString().slice(0, 16).replace("T", " ")}</p>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm">{r.message}</p>
                <p className="mt-3 flex flex-wrap gap-4 text-sm">
                  <a href={`mailto:${r.email}?subject=${encodeURIComponent(subject)}`} className="text-forest-800 underline underline-offset-4">Reply to {r.email}</a>
                  {r.phone && (
                    <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-forest-800 underline underline-offset-4">WhatsApp {r.phone}</a>
                  )}
                </p>
                <TripRequestForm id={r.id} status={r.status} adminNote={r.adminNote ?? ""} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
