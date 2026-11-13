"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { slugify } from "@/lib/slug";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const schema = z.object({
  id: z.string().min(1),
  photo: z
    .string()
    .trim()
    .refine((v) => v === "" || isAllowedImageUrl(v), "Use a photo from Cloudinary, Unsplash, Pexels or Wikimedia."),
  knownFor: z.string().trim().min(10, "Write a short line about the district.").max(200),
  highlights: z
    .string()
    .transform((v) => v.split("\n").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(80)).min(1, "Add at least one place.").max(8, "Up to 8 places.")),
});

export async function saveDistrictAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = schema.safeParse({
    id: formData.get("id") ?? "",
    photo: formData.get("photo") ?? "",
    knownFor: formData.get("knownFor") ?? "",
    highlights: formData.get("highlights") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  const updated = await db.district
    .update({ where: { id: d.id }, data: { photo: d.photo || null, knownFor: d.knownFor, highlights: d.highlights } })
    .catch(() => null);
  if (!updated) return { ok: false, error: "District not found." };
  await audit({ actorId: admin.id, action: "content.district.update", targetType: "District", targetId: d.id, details: { name: updated.name } });
  revalidatePath("/admin/districts");
  revalidatePath("/destinations");
  revalidatePath(`/districts/${updated.slug}`);
  return { ok: true, message: `${updated.name} saved.` };
}

// ---- Places to visit ----------------------------------------------

const KINDS = ["SIGHT", "NATURE", "RELIGIOUS", "MARKET", "FOOD", "EXPERIENCE"] as const;

const placeSchema = z.object({
  id: z.string().optional(),
  districtId: z.string().min(1),
  name: z.string().trim().min(2, "Name is too short").max(100),
  kind: z.enum(KINDS, "Pick a type"),
  description: z.string().trim().min(10, "Write a sentence or two about the place.").max(600),
  tip: z.string().trim().max(300),
  about: z.string().trim().max(4000),
  bestTime: z.string().trim().max(200),
  gettingThere: z.string().trim().max(500),
  goodToKnow: z.string().trim().max(500),
  photo: z
    .string()
    .trim()
    .refine((v) => v === "" || isAllowedImageUrl(v), "Use a photo from Cloudinary, Unsplash, Pexels or Wikimedia."),
  isPublished: z.boolean(),
});

export async function savePlaceAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = placeSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    districtId: formData.get("districtId") ?? "",
    name: formData.get("name") ?? "",
    kind: formData.get("kind") ?? "",
    description: formData.get("description") ?? "",
    tip: formData.get("tip") ?? "",
    about: formData.get("about") ?? "",
    bestTime: formData.get("bestTime") ?? "",
    gettingThere: formData.get("gettingThere") ?? "",
    goodToKnow: formData.get("goodToKnow") ?? "",
    photo: formData.get("photo") ?? "",
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;
  const district = await db.district.findUnique({ where: { id: v.districtId }, select: { slug: true } });
  if (!district) return { ok: false, error: "District not found." };

  const data = {
    name: v.name,
    kind: v.kind,
    description: v.description,
    tip: v.tip || null,
    about: v.about || null,
    bestTime: v.bestTime || null,
    gettingThere: v.gettingThere || null,
    goodToKnow: v.goodToKnow || null,
    photo: v.photo || null,
    isPublished: v.isPublished,
  };
  if (v.id) {
    const updated = await db.districtPlace.updateMany({ where: { id: v.id, districtId: v.districtId }, data });
    if (updated.count === 0) return { ok: false, error: "Place not found." };
    await audit({ actorId: admin.id, action: "content.place.update", targetType: "DistrictPlace", targetId: v.id, details: { name: v.name } });
  } else {
    let slug = slugify(v.name);
    if (await db.districtPlace.findUnique({ where: { districtId_slug: { districtId: v.districtId, slug } } })) slug = `${slug}-${Date.now().toString(36)}`;
    const last = await db.districtPlace.aggregate({ where: { districtId: v.districtId }, _max: { order: true } });
    const created = await db.districtPlace.create({ data: { ...data, districtId: v.districtId, slug, order: (last._max.order ?? -1) + 1 } });
    await audit({ actorId: admin.id, action: "content.place.create", targetType: "DistrictPlace", targetId: created.id, details: { name: v.name } });
  }
  revalidatePath(`/admin/districts/${district.slug}`);
  revalidatePath(`/districts/${district.slug}`, "layout");
  revalidatePath("/destinations");
  return { ok: true, message: v.id ? `${v.name} saved.` : `${v.name} added.` };
}
