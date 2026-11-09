import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { WhatsAppLinkButton } from "@/components/admin/application-actions";
import { MarkHostPaidForm } from "@/components/admin/homestay-actions";
import { BookingStatusBadge, Table, Td } from "@/components/admin/ui";
import { HomestayListingForm } from "@/components/homestays/homestay-listing-form";
import { shortDate } from "@/lib/admin-format";
import { formatDateRange } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { bdt, dayKey } from "@/lib/guide-shared";
import { whatsappTo } from "@/lib/invites";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Homestay" };

export default async function AdminHomestayPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [h, regions] = await Promise.all([
    db.homestay.findUnique({
      where: { id },
      include: {
        host: { select: { name: true, email: true, applications: { where: { kind: "HOST" }, select: { id: true } } } },
        blockedDates: { where: { date: { gte: new Date(dayKey(new Date())) } }, orderBy: { date: "asc" }, take: 60 },
        bookings: { orderBy: { startDate: "desc" }, take: 100, include: { tourist: { select: { name: true, email: true } } } },
      },
    }),
    db.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!h) notFound();
  const application = h.host.applications[0];

  return (
    <div>
      <Link href="/admin/homestays" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800"><ArrowLeft className="size-4" /> All homestays</Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-tight">{h.name}</h1>
          <p className="mt-2 text-ink-soft">{h.host.name ?? "Host"} · {h.phone} · {h.host.email} · {h.language === "bn" ? "prefers Bangla" : "prefers English"}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <Link href={`/homestays/${h.slug}`} className="inline-flex items-center gap-1 underline underline-offset-4">Public page <ExternalLink className="size-3.5" /></Link>
            {application && <Link href={`/admin/applications/${application.id}`} className="underline underline-offset-4">Application</Link>}
          </div>
        </div>
        <WhatsAppLinkButton href={whatsappTo(h.phone)} label="WhatsApp host" />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-5">
        <div className="space-y-8 xl:col-span-3">
          <section>
            <h2 className="mb-4 font-display text-2xl">Stays</h2>
            <Table head={["Guest", "Dates", "Status", "Host gets", "Payout"]} empty={h.bookings.length === 0}>
              {h.bookings.map((b) => (
                <tr key={b.id}>
                  <Td>
                    <Link href={`/admin/bookings/${b.id}`} className="underline-offset-4 hover:underline">{b.tourist.name ?? b.tourist.email}</Link>
                    <div className="font-mono text-xs text-ink-mute">{b.bookingCode}</div>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{formatDateRange(b.startDate, b.endDate)}</Td>
                  <Td><BookingStatusBadge status={b.status} /></Td>
                  <Td>{b.hostPayoutBDT ? bdt(b.hostPayoutBDT) : "—"}</Td>
                  <Td className="text-xs">
                    {b.hostPayoutStatus === "PAID" ? <>Paid {shortDate(b.hostPaidAt)}{b.hostPayoutReference && <div className="text-ink-mute">{b.hostPayoutReference}</div>}</>
                      : b.hostPayoutStatus === "UNPAID" && b.status !== "CANCELLED" ? <MarkHostPaidForm bookingId={b.id} amountBDT={b.hostPayoutBDT ?? 0} />
                      : "—"}
                  </Td>
                </tr>
              ))}
            </Table>
          </section>
          <section>
            <h2 className="mb-2 font-display text-2xl">Closed nights</h2>
            <p className="text-sm text-ink-soft">{h.blockedDates.length ? h.blockedDates.map((b) => shortDate(b.date)).join(", ") : "None."}</p>
          </section>
        </div>
        <aside className="rounded-lg border border-forest-900/10 p-5 xl:col-span-2">
          <h2 className="mb-4 font-sans text-xs uppercase tracking-wider text-ink-mute">Listing</h2>
          <HomestayListingForm
            mode="admin"
            id={h.id}
            phone={h.phone}
            isActive={h.isActive}
            regions={regions}
            uploadsEnabled={features.uploads}
            initial={{
              name: h.name, regionId: h.regionId, district: h.district, area: h.area, address: h.address ?? "",
              description: h.description, houseRules: h.houseRules ?? "", rooms: String(h.rooms), maxGuests: String(h.maxGuests),
              facilities: h.facilities, languages: h.languages, pricePerNightBDT: String(h.pricePerNightBDT), photos: h.photos, isListed: h.isListed,
            }}
          />
        </aside>
      </div>
    </div>
  );
}
