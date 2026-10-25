import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { GuideCard } from "@/components/guides/guide-card";
import { db } from "@/lib/db";
import { publicGuideWhere } from "@/lib/guides";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Local guides",
  description: "Meet DeltaWay's local guides across Bangladesh: ID-checked, interviewed and reference-checked. Filter by region and language.",
};

type Props = { searchParams: Promise<{ region?: string; language?: string }> };

export default async function GuidesPage({ searchParams }: Props) {
  const params = await searchParams;
  const where: Prisma.GuideProfileWhereInput = {
    ...publicGuideWhere,
    ...(params.region && { regions: { some: { slug: params.region } } }),
    ...(params.language && { languages: { has: params.language } }),
  };
  const [guides, regions, allLanguages] = await Promise.all([
    db.guideProfile.findMany({
      where,
      include: { regions: { select: { name: true }, orderBy: { name: "asc" } } },
      orderBy: [{ yearsExperience: "desc" }, { displayName: "asc" }],
      take: 60,
    }),
    db.region.findMany({ where: { guides: { some: publicGuideWhere } }, orderBy: { name: "asc" } }),
    db.guideProfile.findMany({ where: publicGuideWhere, select: { languages: true } }),
  ]);
  const languages = [...new Set(allLanguages.flatMap((g) => g.languages))].sort();
  const url = (key: "region" | "language", value?: string) => {
    const q = new URLSearchParams();
    if (key !== "region" && params.region) q.set("region", params.region);
    if (key !== "language" && params.language) q.set("language", params.language);
    if (value) q.set(key, value);
    return q.size ? `/guides?${q}` : "/guides";
  };

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Local guides</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">People who know the way.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Every DeltaWay guide has had their ID checked, been interviewed by us, and had two references called. Your tour comes
            with one. Here&rsquo;s who you might be travelling with.
          </p>
        </div>
      </section>

      {(regions.length > 1 || languages.length > 1) && (
        <section className="sticky top-16 z-30 border-b border-forest-900/10 bg-paper/85 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {regions.length > 1 && (
              <Row label="Region">
                <Pill href={url("region")} active={!params.region}>All regions</Pill>
                {regions.map((r) => (
                  <Pill key={r.id} href={url("region", r.slug)} active={params.region === r.slug}>{r.name}</Pill>
                ))}
              </Row>
            )}
            {languages.length > 1 && (
              <Row label="Speaks">
                <Pill href={url("language")} active={!params.language}>Any language</Pill>
                {languages.map((l) => (
                  <Pill key={l} href={url("language", l)} active={params.language === l}>{l}</Pill>
                ))}
              </Row>
            )}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {guides.length === 0 ? (
          <div className="rounded-lg border border-forest-900/10 bg-paper-warm px-8 py-20 text-center">
            <p className="font-display text-4xl">{params.region || params.language ? "No guides match that yet." : "Our first guides are joining now."}</p>
            <p className="mt-4 text-ink-soft">
              {params.region || params.language ? (
                <Link href="/guides" className="underline underline-offset-4">See all guides</Link>
              ) : (
                <>Every tour still comes with a local guide. <Link href="/become-a-guide" className="underline underline-offset-4">Are you a guide?</Link></>
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-forest-900/5 py-3 last:border-b-0">
      <span className="eyebrow shrink-0 text-ink-mute">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 bg-paper text-ink-soft hover:border-forest-900/40 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
