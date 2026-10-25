"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";
import { slugify } from "@/lib/slug";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const regionSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(2000),
  isRestricted: z.boolean(),
  permitFeeBDT: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 1_000_000), "Enter a whole number of taka"),
});

function revalidateAll() {
  revalidatePath("/admin/regions");
  revalidatePath("/destinations");
  revalidatePath("/permits");
}

export async function saveRegionAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = regionSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    isRestricted: formData.get("isRestricted") === "on",
    permitFeeBDT: formData.get("permitFeeBDT") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const r = parsed.data;
  if (r.isRestricted && r.permitFeeBDT === null) return { ok: false, error: "Enter the government permit fee for a restricted region." };

  const nameClash = await db.region.findFirst({ where: { name: r.name, NOT: r.id ? { id: r.id } : undefined }, select: { id: true } });
  if (nameClash) return { ok: false, error: "A region with that name already exists." };

  const data = {
    name: r.name,
    description: r.description || null,
    isRestricted: r.isRestricted,
    permitFeeBDT: r.isRestricted ? r.permitFeeBDT : null,
  };
  if (r.id) {
    const before = await db.region.findUnique({ where: { id: r.id }, select: { isRestricted: true, permitFeeBDT: true } });
    await db.region.update({ where: { id: r.id }, data });
    await audit({ actorId: admin.id, action: "content.region.update", targetType: "Region", targetId: r.id, details: { name: r.name, before, after: { isRestricted: data.isRestricted, permitFeeBDT: data.permitFeeBDT } } });
  } else {
    let slug = slugify(r.name);
    if (await db.region.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const created = await db.region.create({ data: { ...data, slug } });
    await audit({ actorId: admin.id, action: "content.region.create", targetType: "Region", targetId: created.id, details: { name: r.name } });
  }
  revalidateAll();
  return { ok: true, message: r.id ? "Region saved." : "Region added." };
}

const categorySchema = z.object({ id: z.string().optional(), name: z.string().trim().min(2, "Name is too short").max(60) });

export async function saveCategoryAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = categorySchema.safeParse({ id: (formData.get("id") as string) || undefined, name: formData.get("name") ?? "" });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const c = parsed.data;
  const clash = await db.category.findFirst({ where: { name: c.name, NOT: c.id ? { id: c.id } : undefined }, select: { id: true } });
  if (clash) return { ok: false, error: "A type with that name already exists." };

  if (c.id) {
    await db.category.update({ where: { id: c.id }, data: { name: c.name } });
  } else {
    let slug = slugify(c.name);
    if (await db.category.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    await db.category.create({ data: { name: c.name, slug } });
  }
  await audit({ actorId: admin.id, action: c.id ? "content.category.update" : "content.category.create", targetType: "Category", targetId: c.id ?? c.name });
  revalidateAll();
  return { ok: true, message: c.id ? "Type renamed." : "Type added." };
}
