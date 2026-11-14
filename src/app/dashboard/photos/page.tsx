import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DeleteMyPhoto } from "@/components/traveler-photos/delete-my-photo";
import { TRAVELER_PHOTO_STATUS_LABEL } from "@/lib/traveler-photo-shared";
import { cn } from "@/lib/utils";

export const metadata = { title: "My photos" };

const tone: Record<string, string> = {
  PENDING: "border-clay-600/40 text-clay-700",
  APPROVED: "border-forest-700/30 bg-forest-100 text-forest-800",
  REJECTED: "border-ink-mute/30 text-ink-mute",
};

export default async function MyPhotosPage() {
  const user = await requireUser("/dashboard/photos");
  const photos = await db.travelerPhoto.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { district: { select: { slug: true, name: true } }, place: { select: { slug: true, name: true } } },
  });

  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">My photos</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Photos you shared.</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
        We look at every photo before it goes on the site. You can remove any of them at any time; it comes off the site straight away.
      </p>
      <Link href="/share" className="mt-6 inline-flex rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper hover:bg-forest-800">
        Share more photos
      </Link>

      {photos.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="You haven't shared any photos yet." body="Been somewhere in Bangladesh? Show the next traveler what you saw." cta={{ label: "Share your photos", href: "/share" }} />
        </div>
      ) : (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((p) => {
            const page = p.place ? `/districts/${p.district.slug}/${p.place.slug}` : `/districts/${p.district.slug}`;
            return (
              <li key={p.id}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-forest-100">
                  <Image src={p.url} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 40vw, 100vw" className="object-cover" />
                  <span className={cn("absolute left-2 top-2 rounded-full border bg-paper/95 px-2.5 py-0.5 text-[11px]", tone[p.status])}>
                    {TRAVELER_PHOTO_STATUS_LABEL[p.status]}
                  </span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-wider text-forest-700">
                  {p.place?.name ?? p.placeName} · {p.district.name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.caption}</p>
                {p.status === "REJECTED" && p.reviewNote && <p className="mt-1 text-xs text-ink-mute">Note from our team: {p.reviewNote}</p>}
                <div className="mt-2 flex items-center gap-4">
                  {p.status === "APPROVED" && (
                    <Link href={page} className="text-xs underline underline-offset-4">See it on the site</Link>
                  )}
                  <DeleteMyPhoto id={p.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
