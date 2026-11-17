import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { readBody, readingMinutes } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Straight answers to what travellers ask before coming to Bangladesh: permits, seasons, getting around, and what a trip really costs.",
  alternates: { canonical: "/journal" },
};

export default async function JournalPage() {
  const articles = await db.article.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: { slug: true, title: true, excerpt: true, photo: true, publishedAt: true, body: true },
  });

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Journal</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl">
            The things worth knowing <em className="italic text-forest-700">before you come.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Permits, seasons, what a day costs, how to get from the airport to anywhere. Written by people who live
            here, and kept up to date because the answers change.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {articles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-forest-900/20 p-12 text-center text-ink-mute">
            The first pieces are being written. Check back soon.
          </p>
        ) : (
          <ul className="space-y-10">
            {articles.map((a) => (
              <li key={a.slug} className="border-b border-forest-900/10 pb-10 last:border-0">
                <Link href={`/journal/${a.slug}`} className="group grid gap-6 sm:grid-cols-[1fr_auto]">
                  <div>
                    <h2 className="font-display text-3xl leading-tight group-hover:text-forest-700">{a.title}</h2>
                    <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{a.excerpt}</p>
                    <p className="mt-3 text-xs text-ink-mute">
                      {a.publishedAt?.toISOString().slice(0, 10)} · {readingMinutes(readBody(a.body))} min read
                    </p>
                  </div>
                  {a.photo && (
                    <span className="relative hidden size-36 shrink-0 overflow-hidden rounded-lg bg-forest-100 sm:block">
                      <Image src={a.photo} alt="" fill sizes="144px" className="object-cover" />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
