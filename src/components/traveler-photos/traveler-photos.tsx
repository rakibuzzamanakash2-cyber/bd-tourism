import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";

type Photo = {
  id: string;
  url: string;
  caption: string;
  creditName: string;
  placeName: string | null;
  place: { name: string; slug: string } | null;
};

type Props = {
  photos: Photo[];
  /** "Sylhet" or "Ratargul swamp forest" */
  subject: string;
  shareHref: string;
  /** On a district page, each photo links to its place */
  districtSlug?: string;
};

/** Approved traveler photos with their descriptions, plus the invitation to share. */
export function TravelerPhotos({ photos, subject, shareHref, districtSlug }: Props) {
  return (
    <section className="border-t border-forest-900/10 bg-paper-warm">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3 text-forest-700">From travelers</p>
            <h2 className="font-display text-3xl sm:text-4xl">{photos.length > 0 ? `${subject}, as travelers saw it` : `Been to ${subject}?`}</h2>
            {photos.length === 0 && <p className="mt-2 max-w-xl text-ink-soft">Share your photos and a few words about each one. The best go on this page, with your name.</p>}
          </div>
          <Link href={shareHref} className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 bg-paper px-5 py-2.5 text-sm font-medium hover:bg-forest-100">
            <Camera className="size-4" aria-hidden /> Share your photos
          </Link>
        </div>
        {photos.length > 0 && (
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => {
              const where = p.place?.name ?? p.placeName;
              return (
                <li key={p.id}>
                  <figure>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-forest-100">
                      <Image src={p.url} alt={where ? `${where}: photo by ${p.creditName}` : `Photo by ${p.creditName}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                    </div>
                    <figcaption className="mt-3">
                      {districtSlug && where && (
                        <p className="text-xs uppercase tracking-wider text-forest-700">
                          {p.place ? <Link href={`/districts/${districtSlug}/${p.place.slug}`} className="hover:underline">{where}</Link> : where}
                        </p>
                      )}
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.caption}</p>
                      <p className="mt-1.5 text-[11px] text-ink-mute">Photo: {p.creditName}</p>
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
