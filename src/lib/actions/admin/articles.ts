"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { articleBodySchema, parseBodyText } from "@/lib/articles";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { slugify } from "@/lib/slug";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5, "Give it a title.").max(140),
  slug: z.string().trim().max(140),
  excerpt: z.string().trim().min(20, "Write a line or two for the listing.").max(400),
  photo: z.string().trim().refine((v) => v === "" || isAllowedImageUrl(v), "Use a photo from one of our image hosts."),
  districtId: z.string().trim(),
  bodyText: z.string().trim().min(50, "The article is too short to publish."),
  isPublished: z.boolean(),
});

export async function saveArticleAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = schema.safeParse({
    id: (formData.get("id") as string) || undefined,
    title: formData.get("title") ?? "",
    slug: formData.get("slug") ?? "",
    excerpt: formData.get("excerpt") ?? "",
    photo: formData.get("photo") ?? "",
    districtId: formData.get("districtId") ?? "",
    bodyText: formData.get("bodyText") ?? "",
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const a = parsed.data;

  const body = articleBodySchema.safeParse(parseBodyText(a.bodyText));
  if (!body.success) return { ok: false, error: "The article needs at least one section of text." };

  const slug = slugify(a.slug || a.title).slice(0, 140);
  if (!slug) return { ok: false, error: "That title doesn't make a usable web address." };

  const clash = await db.article.findFirst({ where: { slug, ...(a.id && { id: { not: a.id } }) }, select: { id: true } });
  if (clash) return { ok: false, error: "Another article already uses that web address." };

  const data = {
    title: a.title,
    slug,
    excerpt: a.excerpt,
    photo: a.photo || null,
    districtId: a.districtId || null,
    body: body.data,
    isPublished: a.isPublished,
    // Set the first time it goes live, then left alone.
    ...(a.isPublished && { publishedAt: new Date() }),
  };

  const saved = a.id
    ? await db.article
        .update({
          where: { id: a.id },
          data: { ...data, publishedAt: a.isPublished ? undefined : null },
        })
        .catch(() => null)
    : await db.article.create({ data }).catch(() => null);
  if (!saved) return { ok: false, error: "Couldn't save that. Try again." };

  // Keep the original publish date rather than bumping it on every edit.
  if (a.id && a.isPublished && !saved.publishedAt) {
    await db.article.update({ where: { id: saved.id }, data: { publishedAt: new Date() } });
  }

  await audit({ actorId: admin.id, action: "content.article.save", targetType: "Article", targetId: saved.id, details: { slug, published: a.isPublished } });
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath(`/journal/${slug}`);
  return { ok: true, message: a.isPublished ? "Saved and live." : "Saved as a draft." };
}

export async function deleteArticleAction(id: string): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admins only." };
  const gone = await db.article.delete({ where: { id } }).catch(() => null);
  if (!gone) return { ok: false, error: "That article is already gone." };
  await audit({ actorId: admin.id, action: "content.article.delete", targetType: "Article", targetId: id, details: { slug: gone.slug } });
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  return { ok: true, message: `“${gone.title}” deleted.` };
}
