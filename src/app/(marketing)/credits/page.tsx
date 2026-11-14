import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = {
  title: "Photo credits",
  description: "The photographers whose freely licensed photos appear on DeltaWay, with their licences.",
};

export default async function CreditsPage() {
  // Only credit photos that are actually on the site right now
  const [destinations, images, tours, districts, places] = await Promise.all([
    db.destination.findMany({ where: { isPublished: true }, select: { name: true, slug: true, featuredImage: true } }),
    db.destinationImage.findMany({ where: { destination: { isPublished: true } }, select: { url: true, destination: { select: { name: true, slug: true } } } }),
    db.tourPackage.findMany({ where: { isPublished: true }, select: { title: true, slug: true, featuredImage: true } }),
    db.district.findMany({ where: { photo: { not: null } }, select: { name: true, slug: true, photo: true } }),
    db.districtPlace.findMany({
      where: { isPublished: true, OR: [{ photo: { not: null } }, { gallery: { isEmpty: false } }] },
      select: { name: true, slug: true, photo: true, gallery: true, district: { select: { slug: true } } },
    }),
  ]);
  const usedOn = new Map<string, { label: string; href: string }>();
  for (const d of destinations) usedOn.set(d.featuredImage, { label: d.name, href: `/destinations/${d.slug}` });
  for (const i of images) if (!usedOn.has(i.url)) usedOn.set(i.url, { label: i.destination.name, href: `/destinations/${i.destination.slug}` });
  for (const t of tours) if (!usedOn.has(t.featuredImage)) usedOn.set(t.featuredImage, { label: t.title, href: `/packages/${t.slug}` });
  for (const d of districts) if (d.photo && !usedOn.has(d.photo)) usedOn.set(d.photo, { label: d.name, href: `/districts/${d.slug}` });
  for (const pl of places) {
    for (const url of [pl.photo, ...pl.gallery]) {
      if (url && !usedOn.has(url)) usedOn.set(url, { label: pl.name, href: `/districts/${pl.district.slug}/${pl.slug}` });
    }
  }
  const credits = await db.imageCredit.findMany({ where: { url: { in: [...usedOn.keys()] } }, orderBy: { author: "asc" } });

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <p className="eyebrow mb-4 text-forest-700">Thank you</p>
      <h1 className="font-display text-5xl leading-tight">Photo credits</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
        Many photos on DeltaWay were taken by photographers who share their work freely on Wikimedia Commons. Each is used under the
        licence shown. Photos may be cropped or resized. Photos of homestays are the hosts&rsquo; own.
      </p>
      {credits.length === 0 ? (
        <p className="mt-12 text-ink-soft">No credited photos yet.</p>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {credits.map((c) => {
            const where = usedOn.get(c.url);
            return (
              <li key={c.id} id={`photo-${c.id}`} className="flex scroll-mt-24 gap-4 rounded-md p-2 target:bg-forest-100">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-sm bg-forest-100">
                  <Image src={c.url} alt={c.title ?? ""} fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{c.title ?? "Untitled"}</p>
                  <p className="text-ink-soft">by {c.author}</p>
                  <p className="mt-1">
                    {c.license}
                  </p>
                  {where && <p className="mt-1 text-xs text-ink-mute">Used on <Link href={where.href} className="underline underline-offset-4">{where.label}</Link></p>}
                  {c.sourceUrl.startsWith("http") && (
                  <p className="mt-1 text-xs text-ink-mute">
                    Original on Wikimedia Commons:{" "}
                    <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">source</a>
                    {c.licenseUrl && (
                      <>
                        {" · "}
                        <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2">licence</a>
                      </>
                    )}{" "}
                    (opens another site)
                  </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
