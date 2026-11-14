import Image from "next/image";
import Link from "next/link";
import type { TravelerPhotoStatus } from "@prisma/client";
import { AdminPageHeader } from "@/components/admin/ui";
import { TravelerPhotoActions } from "@/components/admin/traveler-photo-actions";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Traveler photos" };

const STATUSES: { value: TravelerPhotoStatus; label: string }[] = [
  { value: "PENDING", label: "To review" },
  { value: "APPROVED", label: "On the site" },
  { value: "REJECTED", label: "Not used" },
];
const PER_PAGE = 24;

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

export default async function AdminTravelerPhotosPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s.value === sp.status)?.value ?? "PENDING";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [photos, counts] = await Promise.all([
    db.travelerPhoto.findMany({
      where: { status },
      // Oldest first for the review queue, newest first otherwise
      orderBy: status === "PENDING" ? { createdAt: "asc" } : { reviewedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        user: { select: { name: true, email: true } },
        district: { select: { slug: true, name: true, photo: true } },
        place: { select: { slug: true, name: true, photo: true, gallery: true } },
      },
    }),
    db.travelerPhoto.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const pages = Math.max(1, Math.ceil(count(status) / PER_PAGE));

  return (
    <div>
      <AdminPageHeader
        title="Traveler photos"
        description="Photos travelers shared from /share, each with their own description. Approve the good ones to show them on the district and place pages. An approved photo can also become the main photo of a place or a district."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/admin/traveler-photos?status=${s.value}`}
            className={cn("rounded-full border px-4 py-1.5 text-sm", status === s.value ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 hover:border-forest-900/40")}
          >
            {s.label} <span className="ml-1 opacity-70">{count(s.value)}</span>
          </Link>
        ))}
      </div>

      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-forest-900/20 p-10 text-center text-ink-mute">
          {status === "PENDING" ? "Nothing to review. New photos appear here when travelers share them." : "No photos here."}
        </p>
      ) : (
        <ul className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {photos.map((p) => (
            <li key={p.id} className="rounded-lg border border-forest-900/10 p-4">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] overflow-hidden rounded-md bg-forest-100" title="Open the full photo">
                <Image src={p.url} alt="" fill sizes="(min-width: 1536px) 30vw, (min-width: 1024px) 45vw, 100vw" className="object-cover" />
              </a>
              <p className="mt-3 text-sm font-medium">
                {p.place ? (
                  <Link href={`/districts/${p.district.slug}/${p.place.slug}`} target="_blank" className="underline underline-offset-4">{p.place.name}</Link>
                ) : (
                  <span>
                    {p.placeName} <span className="font-normal text-clay-700">(not one of our listed places)</span>
                  </span>
                )}{" "}
                · {p.district.name}
              </p>
              <p className="mt-1 text-xs text-ink-mute">
                By {p.creditName} ({p.user.name ?? "no name"}, <a href={`mailto:${p.user.email}`} className="underline underline-offset-2">{p.user.email}</a>) ·{" "}
                {p.createdAt.toISOString().slice(0, 10)}
              </p>
              {p.status === "REJECTED" && <p className="mt-2 text-sm text-ink-soft">{p.caption}</p>}
              {p.status === "REJECTED" && p.reviewNote && <p className="mt-1 text-xs text-ink-mute">Reason given: {p.reviewNote}</p>}
              <TravelerPhotoActions
                id={p.id}
                status={p.status}
                caption={p.caption}
                placeName={p.place?.name ?? null}
                districtName={p.district.name}
                usedAs={{ place: p.place?.photo === p.url, gallery: Boolean(p.place?.gallery.includes(p.url)), district: p.district.photo === p.url }}
              />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex justify-center gap-2">
          {page > 1 && <Link href={`/admin/traveler-photos?status=${status}&page=${page - 1}`} className="rounded-full border border-forest-900/15 px-4 py-2 text-sm">← Previous</Link>}
          <span className="px-3 py-2 text-sm text-ink-mute">Page {page} of {pages}</span>
          {page < pages && <Link href={`/admin/traveler-photos?status=${status}&page=${page + 1}`} className="rounded-full border border-forest-900/15 px-4 py-2 text-sm">Next →</Link>}
        </nav>
      )}
    </div>
  );
}
