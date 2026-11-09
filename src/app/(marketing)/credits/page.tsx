import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = {
  title: "Photo credits",
  description: "The photographers whose freely licensed photos appear on DeltaWay, with their licences.",
};

export default async function CreditsPage() {
  // Only credit photos that are actually on the site right now
  const [destinations, images, tours] = await Promise.all([
    db.destination.findMany({ where: { isPublished: true }, select: { name: true, slug: true, featuredImage: true } }),
    db.destinationImage.findMany({ where: { destination: { isPublished: true } }, select: { url: true, destination: { select: { name: true, slug: true } } } }),
    db.tourPackage.findMany({ where: { isPublished: true }, select: { title: true, slug: true, featuredImage: true } }),
  ]);
  const usedOn = new Map<string, { label: string; href: string }>();
  for (const d of destinations) usedOn.set(d.featuredImage, { label: d.name, href: `/destinations/${d.slug}` });
  for (const i of images) if (!usedOn.has(i.url)) usedOn.set(i.url, { label: i.destination.name, href: `/destinations/${i.destination.slug}` });
  for (const t of tours) if (!usedOn.has(t.featuredImage)) usedOn.set(t.featuredImage, { label: t.title, href: `/packages/${t.slug}` });
  const credits = await db.imageCredit.findMany({ where: { url: { in: [...usedOn.keys()] } }, orderBy: { author: "asc" } });

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <p className="eyebrow mb-4 text-forest-700">Thank you</p>
      <h1 className="font-display text-5xl leading-tight">Photo credits</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
        Many photos on DeltaWay were taken by photographers who share their work freely on Wikimedia Commons. Each is used under the
        licence shown, which you can follow for the full terms. Photos may be cropped or resized. Photos of homestays are the hosts&rsquo; own.
      </p>
      {credits.length === 0 ? (
        <p className="mt-12 text-ink-soft">No credited photos yet.</p>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {credits.map((c) => {
            const where = usedOn.get(c.url);
            return (
              <li key={c.id} className="flex gap-4">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-sm bg-forest-100">
                  <Image src={c.url} alt={c.title ?? ""} fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{c.title ?? "Untitled"}</p>
                  <p className="text-ink-soft">by {c.author}</p>
                  <p className="mt-1">
                    {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-4">{c.license}</a> : c.license}
                    {" · "}
                    <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Source</a>
                  </p>
                  {where && <p className="mt-1 text-xs text-ink-mute">Used on <Link href={where.href} className="underline underline-offset-4">{where.label}</Link></p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
