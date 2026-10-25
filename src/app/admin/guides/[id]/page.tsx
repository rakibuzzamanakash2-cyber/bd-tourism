import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MarkGuidePaidForm, CancelAssignmentButton } from "@/components/admin/guide-actions";
import { WhatsAppLinkButton } from "@/components/admin/application-actions";
import { AssignmentStatusBadge, Table, Td } from "@/components/admin/ui";
import { GuideProfileForm } from "@/components/guides/guide-profile-form";
import { dateTime, shortDate } from "@/lib/admin-format";
import { formatDateRange } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { bdt, dayKey } from "@/lib/guide-shared";
import { whatsappTo } from "@/lib/invites";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Guide" };

export default async function AdminGuidePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const today = new Date(dayKey(new Date()));
  const [g, regions] = await Promise.all([
    db.guideProfile.findUnique({
      where: { id },
      include: {
        regions: { select: { id: true } },
        user: { select: { email: true, role: true, applications: { where: { kind: "GUIDE" }, select: { id: true } } } },
        blockedDates: { where: { date: { gte: today } }, orderBy: { date: "asc" }, take: 60 },
        assignments: {
          include: { booking: { select: { id: true, bookingCode: true, startDate: true, endDate: true, status: true, travelerCount: true, package: { select: { title: true } } } } },
          orderBy: { booking: { startDate: "desc" } },
        },
      },
    }),
    db.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!g) notFound();
  const owed = g.assignments.filter((a) => a.status === "ACCEPTED" && a.payoutStatus === "UNPAID" && a.booking.status !== "CANCELLED");
  const paid = g.assignments.filter((a) => a.payoutStatus === "PAID");
  const application = g.user.applications[0];

  return (
    <div>
      <Link href="/admin/guides" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All guides
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-tight">{g.displayName}</h1>
          <p className="mt-2 text-ink-soft">{g.phone} · {g.user.email} · {g.language === "bn" ? "prefers Bangla" : "prefers English"}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <Link href={`/guides/${g.slug}`} className="inline-flex items-center gap-1 underline underline-offset-4">Public profile <ExternalLink className="size-3.5" /></Link>
            {application && <Link href={`/admin/applications/${application.id}`} className="underline underline-offset-4">Application</Link>}
          </div>
        </div>
        <WhatsAppLinkButton href={whatsappTo(g.phone)} label="WhatsApp" />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          <section>
            <h2 className="mb-4 font-display text-2xl">Trips</h2>
            <Table head={["Trip", "Dates", "Status", "Fee", "Payout"]} empty={g.assignments.length === 0}>
              {g.assignments.map((a) => (
                <tr key={a.id}>
                  <Td>
                    <Link href={`/admin/bookings/${a.booking.id}`} className="underline-offset-4 hover:underline">{a.booking.package?.title ?? "Custom trip"}</Link>
                    <div className="font-mono text-xs text-ink-mute">{a.booking.bookingCode}{a.booking.status === "CANCELLED" && " · booking cancelled"}</div>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{formatDateRange(a.booking.startDate, a.booking.endDate)}</Td>
                  <Td>
                    <AssignmentStatusBadge status={a.status} />
                    {a.declineReason && <div className="mt-1 text-xs text-ink-mute">{a.declineReason}</div>}
                  </Td>
                  <Td>{bdt(a.feeBDT)}</Td>
                  <Td className="text-xs">
                    {a.payoutStatus === "PAID" ? (
                      <>Paid {shortDate(a.paidAt)}{a.payoutReference && <div className="text-ink-mute">{a.payoutReference}</div>}</>
                    ) : a.status === "ACCEPTED" && a.booking.status !== "CANCELLED" ? (
                      <MarkGuidePaidForm assignmentId={a.id} feeBDT={a.feeBDT} />
                    ) : a.status === "PENDING" ? (
                      <CancelAssignmentButton assignmentId={a.id} label="Withdraw request" />
                    ) : (
                      "—"
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
            <p className="mt-3 text-sm text-ink-soft">
              Owed now: <strong>{bdt(owed.reduce((n, a) => n + a.feeBDT, 0))}</strong> · Paid so far: {bdt(paid.reduce((n, a) => n + a.feeBDT, 0))}
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-2xl">Not available</h2>
            <p className="text-sm text-ink-soft">
              {g.blockedDates.length ? g.blockedDates.map((b) => shortDate(b.date)).join(", ") : "No days blocked."}
            </p>
          </section>
        </div>
        <aside className="rounded-lg border border-forest-900/10 p-5">
          <h2 className="mb-4 font-sans text-xs uppercase tracking-wider text-ink-mute">Profile</h2>
          <GuideProfileForm
            mode="admin"
            id={g.id}
            phone={g.phone}
            isActive={g.isActive}
            regions={regions}
            uploadsEnabled={features.uploads}
            initial={{
              displayName: g.displayName,
              photoUrl: g.photoUrl ?? "",
              bio: g.bio,
              languages: g.languages,
              regionIds: g.regions.map((r) => r.id),
              yearsExperience: String(g.yearsExperience),
              dayRateBDT: String(g.dayRateBDT),
              licenceNumber: g.licenceNumber ?? "",
              isListed: g.isListed,
            }}
          />
          <p className="mt-4 text-xs text-ink-mute">Created {dateTime(g.createdAt)}</p>
        </aside>
      </div>
    </div>
  );
}
