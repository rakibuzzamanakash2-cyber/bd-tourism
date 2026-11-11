"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { isAllowedImageUrl } from "@/lib/image-hosts";
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
  revalidatePath("/districts");
  revalidatePath(`/districts/${updated.slug}`);
  return { ok: true, message: `${updated.name} saved.` };
}
