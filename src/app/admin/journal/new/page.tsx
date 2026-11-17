import { AdminPageHeader } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/article-form";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Write an article" };

export default async function NewArticlePage() {
  await requireAdmin();
  const districts = await db.district.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <div>
      <AdminPageHeader title="Write an article" description="It saves as a draft unless you tick “Live on the site”." />
      <ArticleForm
        districts={districts}
        article={{ title: "", slug: "", excerpt: "", photo: "", districtId: "", bodyText: "", isPublished: false }}
      />
    </div>
  );
}
