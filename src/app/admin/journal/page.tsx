import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { readBody, readingMinutes } from "@/lib/articles";

export const metadata = { title: "Journal" };

export default async function AdminJournalPage() {
  await requireAdmin();
  const articles = await db.article.findMany({ orderBy: [{ isPublished: "asc" }, { updatedAt: "desc" }], take: 100 });

  return (
    <div>
      <AdminPageHeader
        title="Journal"
        description="Articles answering what travellers ask before they book. These are what bring people to the site from a search, so they are worth getting right."
      />
      <Link href="/admin/journal/new" className="mb-6 inline-block rounded-full bg-forest-900 px-5 py-2 text-sm text-paper hover:bg-forest-800">
        Write an article
      </Link>

      {articles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-forest-900/20 p-10 text-center text-ink-mute">Nothing written yet.</p>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-forest-900/10 p-4">
              <div className="min-w-0">
                <Link href={`/admin/journal/${a.id}`} className="font-medium underline-offset-4 hover:underline">{a.title}</Link>
                <p className="mt-1 text-xs text-ink-mute">
                  /journal/{a.slug} · {readingMinutes(readBody(a.body))} min ·{" "}
                  {a.isPublished ? `live since ${a.publishedAt?.toISOString().slice(0, 10)}` : "draft"}
                </p>
              </div>
              {a.isPublished && (
                <Link href={`/journal/${a.slug}`} target="_blank" className="text-xs underline underline-offset-4">View</Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
