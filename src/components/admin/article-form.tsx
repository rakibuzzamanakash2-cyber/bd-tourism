"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteArticleAction, saveArticleAction } from "@/lib/actions/admin/articles";

const input = "w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm";

export type ArticleDraft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  photo: string;
  districtId: string;
  bodyText: string;
  isPublished: boolean;
};

export function ArticleForm({ article, districts }: { article: ArticleDraft; districts: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await saveArticleAction(fd);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message ?? "Saved");
      router.push("/admin/journal");
      router.refresh();
    });
  };

  const remove = () =>
    start(async () => {
      const r = await deleteArticleAction(article.id!);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message ?? "Deleted");
      router.push("/admin/journal");
      router.refresh();
    });

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
      {article.id && <input type="hidden" name="id" value={article.id} />}

      <label className="block text-sm">
        Title
        <input name="title" defaultValue={article.title} className={`${input} mt-1`} />
      </label>

      <label className="block text-sm">
        Web address
        <span className="block text-xs text-ink-mute">Leave empty to make one from the title. Don&rsquo;t change it once people link to it.</span>
        <input name="slug" defaultValue={article.slug} placeholder="chittagong-hill-tracts-permit" className={`${input} mt-1`} />
      </label>

      <label className="block text-sm">
        Summary
        <span className="block text-xs text-ink-mute">Shown in the listing and to Google. One or two sentences.</span>
        <textarea name="excerpt" rows={2} defaultValue={article.excerpt} className={`${input} mt-1`} />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          Photo link (optional)
          <input name="photo" defaultValue={article.photo} className={`${input} mt-1`} />
        </label>
        <label className="block text-sm">
          About a district (optional)
          <span className="block text-xs text-ink-mute">Adds a link to it at the end.</span>
          <select name="districtId" defaultValue={article.districtId} className={`${input} mt-1`}>
            <option value="">No particular district</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        The article
        <span className="block text-xs text-ink-mute">
          Start a section with ## and its heading. One paragraph per line. Start a line with - for a bullet.
        </span>
        <textarea name="bodyText" rows={24} defaultValue={article.bodyText} className={`${input} mt-1 font-mono text-xs leading-relaxed`} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublished" defaultChecked={article.isPublished} className="size-4" />
        Live on the site
      </label>

      <div className="flex flex-wrap items-center gap-4 border-t border-forest-900/10 pt-5">
        <button type="submit" disabled={pending} className="rounded-full bg-forest-900 px-5 py-2 text-sm text-paper hover:bg-forest-800 disabled:opacity-50">
          Save
        </button>
        {article.id && (
          <button type="button" onClick={remove} disabled={pending} className="text-xs text-ink-mute underline underline-offset-4 hover:text-clay-700">
            Delete this article
          </button>
        )}
      </div>
    </form>
  );
}
