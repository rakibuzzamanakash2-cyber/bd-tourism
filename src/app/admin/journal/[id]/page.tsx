import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/article-form";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { bodyToText, readBody } from "@/lib/articles";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [a, districts] = await Promise.all([
    db.article.findUnique({ where: { id } }),
    db.district.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!a) notFound();

  return (
    <div>
      <AdminPageHeader title={a.title} description={a.isPublished ? `Live at /journal/${a.slug}` : "Draft — not visible on the site."} />
      <ArticleForm
        districts={districts}
        article={{
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          photo: a.photo ?? "",
          districtId: a.districtId ?? "",
          bodyText: bodyToText(readBody(a.body)),
          isPublished: a.isPublished,
        }}
      />
    </div>
  );
}
