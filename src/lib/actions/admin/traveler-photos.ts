"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { sendEmail, simpleEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { getAdminOrNull } from "@/lib/session";
import { CAPTION_MAX } from "@/lib/traveler-photo-shared";
import { removeTravelerPhoto } from "@/lib/traveler-photos";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const load = (id: string) =>
  db.travelerPhoto.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      district: { select: { id: true, slug: true, name: true } },
      place: { select: { id: true, slug: true, name: true, gallery: true } },
    },
  });

function refresh(districtSlug: string) {
  revalidatePath("/admin/traveler-photos");
  revalidatePath("/admin");
  revalidatePath(`/districts/${districtSlug}`, "layout");
  revalidatePath("/destinations");
  revalidatePath("/credits");
}

const reviewSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  // The team may tidy the description (typos) before it goes live
  caption: z.string().trim().min(1).max(CAPTION_MAX).optional(),
  note: z.string().trim().max(300).optional(),
});

/** Approve a photo (it appears on the district and place pages) or turn it down. */
export async function reviewTravelerPhotoAction(input: z.input<typeof reviewSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form." };
  const { id, decision, caption, note } = parsed.data;
  const photo = await load(id);
  if (!photo) return { ok: false, error: "Photo not found. The traveler may have removed it." };

  const wasApproved = photo.status === "APPROVED";
  if (decision === "REJECTED" && wasApproved) {
    // Taking it off the site also takes it out of anywhere we used it
    const inGallery = photo.place?.gallery.includes(photo.url);
    await db.$transaction([
      db.districtPlace.updateMany({ where: { photo: photo.url }, data: { photo: null } }),
      db.district.updateMany({ where: { photo: photo.url }, data: { photo: null } }),
      ...(inGallery && photo.place ? [db.districtPlace.update({ where: { id: photo.place.id }, data: { gallery: photo.place.gallery.filter((u) => u !== photo.url) } })] : []),
      db.imageCredit.deleteMany({ where: { url: photo.url } }),
    ]);
  }
  await db.travelerPhoto.update({
    where: { id },
    data: { status: decision, reviewedAt: new Date(), reviewNote: note || null, ...(caption ? { caption } : {}) },
  });
  await audit({ actorId: admin.id, action: decision === "APPROVED" ? "traveler_photo.approve" : "traveler_photo.reject", targetType: "TravelerPhoto", targetId: id, details: { district: photo.district.name } });

  if (decision === "APPROVED" && !wasApproved) {
    const where = photo.place?.name ?? photo.placeName ?? photo.district.name;
    const page = photo.place ? `/districts/${photo.district.slug}/${photo.place.slug}` : `/districts/${photo.district.slug}`;
    await sendEmail({
      to: photo.user.email,
      subject: `Your photo of ${where} is on DeltaWay`,
      html: simpleEmail(
        "Thank you for sharing.",
        [`Hi ${photo.user.name?.split(/\s+/)[0] ?? "there"}, your photo of ${where} is now on our site, with your name under it.`, "You can remove it at any time from your dashboard."],
        { label: "See it", url: `${env.NEXT_PUBLIC_APP_URL}${page}` },
      ),
    }).catch(() => undefined);
  }
  refresh(photo.district.slug);
  return { ok: true, message: decision === "APPROVED" ? "Approved. It's on the site now." : "Marked as not used." };
}

const useSchema = z.object({ id: z.string().min(1), as: z.enum(["place", "gallery", "district"]) });

/** Use an approved photo as a place's or district's main photo, or add it to the place's gallery. */
export async function assignTravelerPhotoAction(input: z.input<typeof useSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = useSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const photo = await load(parsed.data.id);
  if (!photo) return { ok: false, error: "Photo not found." };
  if (photo.status !== "APPROVED") return { ok: false, error: "Approve the photo first." };
  if (parsed.data.as !== "district" && !photo.place) return { ok: false, error: "This photo isn't linked to one of our listed places." };

  // The credit shown under the photo and on the credits page
  const credit = {
    author: photo.creditName,
    license: "Shared with DeltaWay by the traveler",
    licenseUrl: null,
    sourceUrl: `/districts/${photo.district.slug}`,
    title: photo.place?.name ?? photo.placeName ?? photo.district.name,
  };
  await db.imageCredit.upsert({ where: { url: photo.url }, create: { url: photo.url, ...credit }, update: credit });

  let message: string;
  if (parsed.data.as === "district") {
    await db.district.update({ where: { id: photo.district.id }, data: { photo: photo.url } });
    message = `Now the main photo of ${photo.district.name}.`;
  } else if (parsed.data.as === "place") {
    await db.districtPlace.update({ where: { id: photo.place!.id }, data: { photo: photo.url } });
    message = `Now the main photo of ${photo.place!.name}.`;
  } else {
    if (photo.place!.gallery.includes(photo.url)) return { ok: false, error: "It's already in that gallery." };
    if (photo.place!.gallery.length >= 12) return { ok: false, error: "That gallery is full (12 photos)." };
    await db.districtPlace.update({ where: { id: photo.place!.id }, data: { gallery: [...photo.place!.gallery, photo.url] } });
    message = `Added to the gallery of ${photo.place!.name}.`;
  }
  await audit({ actorId: admin.id, action: "traveler_photo.use", targetType: "TravelerPhoto", targetId: photo.id, details: { as: parsed.data.as } });
  refresh(photo.district.slug);
  return { ok: true, message };
}

/** Delete a photo and its file for good (spam, or the traveler asked us to). */
export async function adminDeleteTravelerPhotoAction(id: string): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const photo = await load(id);
  if (!photo) return { ok: false, error: "Photo not found." };
  await removeTravelerPhoto(photo);
  await audit({ actorId: admin.id, action: "traveler_photo.delete", targetType: "TravelerPhoto", targetId: id, details: { district: photo.district.name } });
  refresh(photo.district.slug);
  return { ok: true, message: "Deleted." };
}
