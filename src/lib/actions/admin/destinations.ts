"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { getAdminOrNull } from "@/lib/session";
import { SLUG_PATTERN, slugify } from "@/lib/slug";

export type FormResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const imageUrl = z
  .string()
  .trim()
  .min(1, "A photo is required")
  .refine(isAllowedImageUrl, "Use a photo link from Unsplash, Pexels, Wikimedia Commons or Cloudinary");

const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && v >= min && v <= max), `Must be between ${min} and ${max}`);

const destinationSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is too short").max(120),
  slug: z.string().trim().max(80).optional(),
  shortDesc: z.string().trim().min(10, "Write at least a short sentence").max(300, "Keep it under 300 characters"),
  longDesc: z.string().trim().min(20, "Write a few sentences").max(10000),
  regionId: z.string().min(1, "Choose a region"),
  categoryIds: z.array(z.string()).max(20),
  bestSeason: z.string().trim().max(80).optional(),
  averageBudget: z.enum(["", "$", "$$", "$$$"]).optional(),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  featuredImage: imageUrl,
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
});

function fieldErrorsOf(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = i.path[0]?.toString();
    if (k && !out[k]) out[k] = i.message;
  }
  return out;
}

function revalidateDestination(slug: string, oldSlug?: string) {
  revalidatePath("/");
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${slug}`);
  if (oldSlug && oldSlug !== slug) revalidatePath(`/destinations/${oldSlug}`);
  revalidatePath("/admin/destinations");
}

export async function saveDestinationAction(formData: FormData): Promise<FormResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };

  const parsed = destinationSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    shortDesc: formData.get("shortDesc") ?? "",
    longDesc: formData.get("longDesc") ?? "",
    regionId: formData.get("regionId") ?? "",
    categoryIds: formData.getAll("categoryIds").map(String),
    bestSeason: formData.get("bestSeason") ?? "",
    averageBudget: formData.get("averageBudget") ?? "",
    latitude: formData.get("latitude") ?? "",
    longitude: formData.get("longitude") ?? "",
    featuredImage: formData.get("featuredImage") ?? "",
    isFeatured: formData.get("isFeatured") === "on",
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const d = parsed.data;
  const slug = d.slug ? d.slug : slugify(d.name);
  if (!SLUG_PATTERN.test(slug)) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { slug: "Use lowercase letters, numbers and dashes" } };
  }
  const clash = await db.destination.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== d.id) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another destination already uses this web address" } };
  }
  const region = await db.region.findUnique({ where: { id: d.regionId }, select: { id: true } });
  if (!region) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { regionId: "Choose a region" } };

  const data = {
    name: d.name,
    slug,
    shortDesc: d.shortDesc,
    longDesc: d.longDesc,
    regionId: d.regionId,
    bestSeason: d.bestSeason || null,
    averageBudget: d.averageBudget || null,
    latitude: d.latitude,
    longitude: d.longitude,
    featuredImage: d.featuredImage,
    isFeatured: d.isFeatured,
    isPublished: d.isPublished,
  };

  if (d.id) {
    const existing = await db.destination.findUnique({ where: { id: d.id }, select: { slug: true } });
    if (!existing) return { ok: false, error: "Destination not found." };
    await db.destination.update({
      where: { id: d.id },
      data: { ...data, categories: { set: d.categoryIds.map((id) => ({ id })) } },
    });
    await audit({ actorId: admin.id, action: "content.destination.update", targetType: "Destination", targetId: d.id, details: { name: d.name } });
    revalidateDestination(slug, existing.slug);
    return { ok: true, id: d.id, message: "Destination saved." };
  }

  const created = await db.destination.create({
    data: { ...data, categories: { connect: d.categoryIds.map((id) => ({ id })) } },
    select: { id: true },
  });
  await audit({ actorId: admin.id, action: "content.destination.create", targetType: "Destination", targetId: created.id, details: { name: d.name } });
  revalidateDestination(slug);
  return { ok: true, id: created.id, message: "Destination created." };
}

// ============================================================
// Gallery
// ============================================================
export type SimpleResult = { ok: true } | { ok: false; error: string };

async function revalidateGallery(destinationId: string) {
  const d = await db.destination.findUnique({ where: { id: destinationId }, select: { slug: true } });
  if (d) revalidatePath(`/destinations/${d.slug}`);
  revalidatePath(`/admin/destinations/${destinationId}`);
}

export async function addGalleryImageAction(input: { destinationId: string; url: string; caption: string }): Promise<SimpleResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = z
    .object({ destinationId: z.string().min(1), url: imageUrl, caption: z.string().trim().max(200) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid photo" };

  const last = await db.destinationImage.findFirst({
    where: { destinationId: parsed.data.destinationId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await db.destinationImage.create({
    data: {
      destinationId: parsed.data.destinationId,
      url: parsed.data.url,
      caption: parsed.data.caption || null,
      order: (last?.order ?? -1) + 1,
    },
  });
  await audit({ actorId: admin.id, action: "content.gallery.add", targetType: "Destination", targetId: parsed.data.destinationId });
  await revalidateGallery(parsed.data.destinationId);
  return { ok: true };
}

export async function removeGalleryImageAction(imageId: string): Promise<SimpleResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const img = await db.destinationImage.findUnique({ where: { id: imageId } });
  if (!img) return { ok: false, error: "Photo not found." };
  await db.destinationImage.delete({ where: { id: imageId } });
  await audit({ actorId: admin.id, action: "content.gallery.remove", targetType: "Destination", targetId: img.destinationId, details: { url: img.url } });
  await revalidateGallery(img.destinationId);
  return { ok: true };
}

/** Swaps a photo with its neighbour so it moves one place up or down. */
export async function moveGalleryImageAction(imageId: string, direction: "up" | "down"): Promise<SimpleResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const img = await db.destinationImage.findUnique({ where: { id: imageId } });
  if (!img) return { ok: false, error: "Photo not found." };
  const images = await db.destinationImage.findMany({
    where: { destinationId: img.destinationId },
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });
  const i = images.findIndex((x) => x.id === imageId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= images.length) return { ok: true };
  [images[i], images[j]] = [images[j], images[i]];
  // Rewrite 0..n so the order is always clean
  await db.$transaction(images.map((x, order) => db.destinationImage.update({ where: { id: x.id }, data: { order } })));
  await revalidateGallery(img.destinationId);
  return { ok: true };
}
