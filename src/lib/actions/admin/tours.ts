"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { TourDuration } from "@prisma/client";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { getAdminOrNull } from "@/lib/session";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import type { FormResult } from "@/lib/actions/admin/destinations";

/** Groups a day count into the filter buckets used on /packages. */
function durationBucket(days: number): TourDuration {
  if (days <= 1) return "ONE_DAY";
  if (days <= 3) return "THREE_DAY";
  if (days <= 5) return "FIVE_DAY";
  if (days <= 7) return "SEVEN_DAY";
  return "EXTENDED";
}

const daySchema = z.object({
  title: z.string().trim().min(2, "Each day needs a title").max(150),
  description: z.string().trim().min(10, "Describe each day in a sentence or two").max(5000),
  destinationId: z.string().nullable(),
});

const tourSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Title is too short").max(150),
  slug: z.string().trim().max(80).optional(),
  summary: z.string().trim().min(10, "Write a one-line summary").max(300),
  description: z.string().trim().min(20, "Write a few sentences").max(10000),
  basePriceUSD: z.coerce.number().min(1, "Enter a price").max(100000),
  maxTravelers: z.coerce.number().int().min(1).max(50),
  featuredImage: z
    .string()
    .trim()
    .min(1, "A photo is required")
    .refine(isAllowedImageUrl, "Use a photo link from Unsplash, Pexels, Wikimedia Commons or Cloudinary"),
  includesGuide: z.boolean(),
  includesLodging: z.boolean(),
  includesTransport: z.boolean(),
  isPublished: z.boolean(),
  itinerary: z.array(daySchema).min(1, "Add at least one day").max(60, "That's a long trip — 60 days at most"),
});

export async function saveTourAction(formData: FormData): Promise<FormResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };

  let itinerary: unknown = [];
  try {
    itinerary = JSON.parse(String(formData.get("itinerary") ?? "[]"));
  } catch {
    return { ok: false, error: "The itinerary couldn't be read. Refresh and try again." };
  }

  const parsed = tourSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    title: formData.get("title") ?? "",
    slug: formData.get("slug") ?? "",
    summary: formData.get("summary") ?? "",
    description: formData.get("description") ?? "",
    basePriceUSD: formData.get("basePriceUSD") ?? "",
    maxTravelers: formData.get("maxTravelers") ?? "",
    featuredImage: formData.get("featuredImage") ?? "",
    includesGuide: formData.get("includesGuide") === "on",
    includesLodging: formData.get("includesLodging") === "on",
    includesTransport: formData.get("includesTransport") === "on",
    isPublished: formData.get("isPublished") === "on",
    itinerary,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      // itinerary.2.title → "day3.title"; whole-list errors → "itinerary"
      const key =
        i.path[0] === "itinerary" && typeof i.path[1] === "number"
          ? `day${i.path[1] + 1}.${String(i.path[2])}`
          : String(i.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = i.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const t = parsed.data;

  const slug = t.slug ? t.slug : slugify(t.title);
  if (!SLUG_PATTERN.test(slug)) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { slug: "Use lowercase letters, numbers and dashes" } };
  }
  const clash = await db.tourPackage.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== t.id) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another tour already uses this web address" } };
  }

  // Every linked destination must exist
  const destIds = [...new Set(t.itinerary.map((d) => d.destinationId).filter((x): x is string => Boolean(x)))];
  if (destIds.length) {
    const found = await db.destination.count({ where: { id: { in: destIds } } });
    if (found !== destIds.length) return { ok: false, error: "One of the linked destinations no longer exists. Refresh the page." };
  }

  const durationDays = t.itinerary.length;
  const data = {
    title: t.title,
    slug,
    summary: t.summary,
    description: t.description,
    basePriceUSD: Math.round(t.basePriceUSD * 100) / 100,
    maxTravelers: t.maxTravelers,
    featuredImage: t.featuredImage,
    includesGuide: t.includesGuide,
    includesLodging: t.includesLodging,
    includesTransport: t.includesTransport,
    isPublished: t.isPublished,
    durationDays,
    duration: durationBucket(durationDays),
  };
  const days = t.itinerary.map((d, i) => ({
    dayNumber: i + 1,
    title: d.title,
    description: d.description,
    destinationId: d.destinationId || null,
  }));

  let id = t.id;
  let oldSlug: string | undefined;
  if (id) {
    const existing = await db.tourPackage.findUnique({ where: { id }, select: { slug: true } });
    if (!existing) return { ok: false, error: "Tour not found." };
    oldSlug = existing.slug;
    // Replace the whole itinerary: simplest way to keep day numbers 1..n
    await db.$transaction([
      db.tourPackage.update({ where: { id }, data }),
      db.tourPackageDay.deleteMany({ where: { packageId: id } }),
      db.tourPackageDay.createMany({ data: days.map((d) => ({ ...d, packageId: id! })) }),
    ]);
  } else {
    const created = await db.tourPackage.create({ data: { ...data, itinerary: { create: days } }, select: { id: true } });
    id = created.id;
  }

  await audit({
    actorId: admin.id,
    action: t.id ? "content.tour.update" : "content.tour.create",
    targetType: "TourPackage",
    targetId: id,
    details: { title: t.title, days: durationDays, priceUSD: data.basePriceUSD },
  });

  revalidatePath("/");
  revalidatePath("/packages");
  revalidatePath(`/packages/${slug}`);
  if (oldSlug && oldSlug !== slug) revalidatePath(`/packages/${oldSlug}`);
  revalidatePath("/admin/tours");
  return { ok: true, id, message: t.id ? "Tour saved." : "Tour created." };
}
