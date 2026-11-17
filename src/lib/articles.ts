import { z } from "zod";

/**
 * An article's body is a list of sections, not free HTML or markdown.
 *
 * It means nothing we render can carry script, every article looks like the
 * rest of the site, and the admin editor is a few text boxes rather than a
 * rich text editor nobody maintains.
 */
export const articleSectionSchema = z.object({
  heading: z.string().trim().max(120),
  paragraphs: z.array(z.string().trim().min(1).max(4000)).max(20),
  bullets: z.array(z.string().trim().min(1).max(400)).max(20),
});

export const articleBodySchema = z.array(articleSectionSchema).min(1).max(30);

export type ArticleSection = z.infer<typeof articleSectionSchema>;

/** Anything unrecognised is dropped, so a bad row can't break the page. */
export function readBody(value: unknown): ArticleSection[] {
  const parsed = articleBodySchema.safeParse(value);
  if (parsed.success) return parsed.data;
  if (!Array.isArray(value)) return [];
  return value.flatMap((s) => {
    const one = articleSectionSchema.safeParse(s);
    return one.success ? [one.data] : [];
  });
}

/** Roughly how long it takes to read, for the listing. */
export function readingMinutes(body: ArticleSection[]): number {
  const words = body
    .flatMap((s) => [s.heading, ...s.paragraphs, ...s.bullets])
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Articles are written in a small plain-text shape and stored as sections:
 *
 *   ## A heading
 *   A paragraph.
 *
 *   Another paragraph.
 *   - a bullet
 *   - another bullet
 *
 * Only structure is parsed — never inline HTML — so nothing an author types
 * can inject markup into the page.
 */
export function parseBodyText(text: string): ArticleSection[] {
  const sections: ArticleSection[] = [];
  let current: ArticleSection | null = null;
  const push = () => {
    if (current && (current.paragraphs.length || current.bullets.length || current.heading)) sections.push(current);
  };

  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (line.startsWith("##")) {
      push();
      current = { heading: line.replace(/^#+/, "").trim().slice(0, 120), paragraphs: [], bullets: [] };
      continue;
    }
    if (!current) current = { heading: "", paragraphs: [], bullets: [] };
    if (!line) continue;
    if (/^[-*•]\s+/.test(line)) current.bullets.push(line.replace(/^[-*•]\s+/, "").slice(0, 400));
    else current.paragraphs.push(line.slice(0, 4000));
  }
  push();
  return sections;
}

/** The reverse, for loading an article back into the editor. */
export function bodyToText(body: ArticleSection[]): string {
  return body
    .map((s) =>
      [s.heading && `## ${s.heading}`, ...s.paragraphs, ...s.bullets.map((b) => `- ${b}`)]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}
