import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ContentSection = {
  heading: string;
  /** Each string is one paragraph. */
  paragraphs?: string[];
  /** Optional bullet list shown after the paragraphs. */
  bullets?: string[];
};

type Props = {
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  sections: ContentSection[];
  cta?: { label: string; href: string; note?: string };
};

/**
 * Shared layout for simple text pages (terms, privacy, help, safety, …)
 * so they all match the About page's look.
 */
export function ContentPage({ eyebrow, title, intro, updated, sections, cta }: Props) {
  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">{eyebrow}</p>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.98] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {intro}
          </p>
          {updated && (
            <p className="mt-6 text-sm text-ink-mute">Last updated: {updated}</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-3xl space-y-14">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-display text-3xl sm:text-4xl">{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-5 text-lg leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-5 space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-lg leading-relaxed text-ink-soft">
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-forest-700" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {cta && (
            <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-8">
              {cta.note && <p className="text-ink-soft">{cta.note}</p>}
              <Link
                href={cta.href}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-5 rounded-full bg-forest-900 px-8 text-paper hover:bg-forest-800",
                )}
              >
                {cta.label}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
