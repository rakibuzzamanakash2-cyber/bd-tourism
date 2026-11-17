import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { db } from "@/lib/db";
import { readBody, readingMinutes } from "@/lib/articles";
import { absolute, breadcrumbLd } from "@/lib/structured-data";
import { site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

const find = (slug: string) =>
  db.article.findFirst({
    where: { slug, isPublished: true },
    include: { district: { select: { slug: true, name: true } } },
  });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await find((await params).slug);
  if (!a) return { title: "Not found" };
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/journal/${a.slug}` },
    openGraph: {
      type: "article",
      publishedTime: a.publishedAt?.toISOString(),
      modifiedTime: a.updatedAt.toISOString(),
      ...(a.photo && { images: [a.photo] }),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const a = await find((await params).slug);
  if (!a) notFound();
  const body = readBody(a.body);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.excerpt,
            url: absolute(`/journal/${a.slug}`),
            ...(a.photo && { image: absolute(a.photo) }),
            datePublished: a.publishedAt?.toISOString(),
            dateModified: a.updatedAt.toISOString(),
            publisher: { "@type": "Organization", name: site.name },
          },
          breadcrumbLd([
            { name: "Journal", path: "/journal" },
            { name: a.title, path: `/journal/${a.slug}` },
          ]),
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Link href="/journal" className="eyebrow text-forest-700 hover:underline">
          ← Journal
        </Link>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl">{a.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">{a.excerpt}</p>
        <p className="mt-4 text-xs text-ink-mute">
          {a.publishedAt?.toISOString().slice(0, 10)} · {readingMinutes(body)} min read
          {a.updatedAt > (a.publishedAt ?? a.updatedAt) &&
            ` · updated ${a.updatedAt.toISOString().slice(0, 10)}`}
        </p>

        {a.photo && (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-lg bg-forest-100">
            <Image src={a.photo} alt="" fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" priority />
          </div>
        )}

        <div className="mt-12 space-y-10">
          {body.map((s, i) => (
            <section key={`${s.heading}-${i}`}>
              {s.heading && <h2 className="font-display text-2xl sm:text-3xl">{s.heading}</h2>}
              {s.paragraphs.map((p, j) => (
                <p key={j} className="mt-4 leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
              {s.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="flex gap-3 leading-relaxed text-ink-soft">
                      <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-forest-700" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-lg border border-forest-900/10 bg-paper-warm p-6">
          <p className="font-display text-2xl">Thinking about a trip?</p>
          <p className="mt-2 leading-relaxed text-ink-soft">
            {a.district
              ? `We run trips to ${a.district.name} and the rest of the country.`
              : "Tell us roughly where you'd like to go and we'll come back with a plan and a price."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/planner" className="rounded-full bg-forest-900 px-5 py-2.5 text-sm text-paper hover:bg-forest-800">
              Plan a trip
            </Link>
            {a.district && (
              <Link
                href={`/districts/${a.district.slug}`}
                className="rounded-full border border-forest-900/20 px-5 py-2.5 text-sm hover:bg-forest-100"
              >
                About {a.district.name}
              </Link>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
