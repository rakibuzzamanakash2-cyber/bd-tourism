/**
 * Drops a JSON-LD block into the page for search engines. Invisible to people.
 *
 * The JSON is built by us from our own database (see @/lib/structured-data),
 * never from anything a visitor typed, and `<` is escaped so a stray character
 * in a description can't close the script tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
