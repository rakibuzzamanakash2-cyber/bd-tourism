"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { signUpload, type UploadSignature } from "@/lib/cloudinary";
import { notifyTeam } from "@/lib/email";
import { verificationRequired } from "@/lib/email-verification";
import { RATE_LIMITS, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import { CAPTION_MAX, CAPTION_MIN, MAX_PENDING_PER_USER, MAX_PHOTOS_PER_SUBMISSION } from "@/lib/traveler-photo-shared";
import { isOurTravelerUpload, removeTravelerPhoto } from "@/lib/traveler-photos";

type Result = { ok: true; count?: number } | { ok: false; error: string };

/** Signed-in with a confirmed email, or the reason they can't share yet. */
async function sharer(): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in to share photos." };
  if (verificationRequired()) {
    const me = await db.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true } });
    if (!me?.emailVerified) return { error: "Please confirm your email first. You can send a new link from your dashboard." };
  }
  return { id: session.user.id };
}

/** Lets the browser upload one photo straight to our Cloudinary "travelers" folder. */
export async function getTravelerUploadSignature(): Promise<{ ok: true; signature: UploadSignature } | { ok: false; error: string }> {
  const me = await sharer();
  if ("error" in me) return { ok: false, error: me.error };
  const limited = await rateLimit(`upload:user:${me.id}`, RATE_LIMITS.uploadUser);
  if (!limited.ok) return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };
  const signature = signUpload("travelers");
  if (!signature) return { ok: false, error: "Photo uploads aren't available right now. Please try again later." };
  return { ok: true, signature };
}

const schema = z.object({
  districtId: z.string().min(1, "Choose the district").max(64),
  placeId: z.string().max(64).optional().transform((v) => v || undefined),
  placeName: z.string().trim().max(100).optional().transform((v) => v || undefined),
  creditName: z.string().trim().min(2, "Tell us the name to show under your photos").max(60),
  photos: z
    .array(
      z.object({
        url: z.string().max(500),
        publicId: z.string().max(200),
        caption: z.string().trim().min(CAPTION_MIN, "Write a short description for every photo").max(CAPTION_MAX, `Keep each description under ${CAPTION_MAX} characters`),
      }),
    )
    .min(1, "Add at least one photo")
    .max(MAX_PHOTOS_PER_SUBMISSION, `Up to ${MAX_PHOTOS_PER_SUBMISSION} photos at a time`),
  agreed: z.literal(true, { message: "Please confirm these are your own photos" }),
});

export type SharePhotosInput = z.input<typeof schema>;

/** A traveler shares photos of a place they visited. They wait for the team's approval. */
export async function submitTravelerPhotosAction(input: SharePhotosInput): Promise<Result> {
  const me = await sharer();
  if ("error" in me) return { ok: false, error: me.error };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;

  const limited = await rateLimit(`photos:user:${me.id}`, RATE_LIMITS.photoSubmitUser);
  if (!limited.ok) return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  // Only photos uploaded through our own form, each one once
  if (v.photos.some((p) => !isOurTravelerUpload(p.url, p.publicId))) return { ok: false, error: "One of the photos didn't upload properly. Remove it and add it again." };
  if (new Set(v.photos.map((p) => p.url)).size !== v.photos.length) return { ok: false, error: "The same photo was added twice." };

  const [district, place, pending] = await Promise.all([
    db.district.findUnique({ where: { id: v.districtId }, select: { id: true, slug: true, name: true } }),
    v.placeId ? db.districtPlace.findFirst({ where: { id: v.placeId, districtId: v.districtId, isPublished: true }, select: { id: true, name: true } }) : null,
    db.travelerPhoto.count({ where: { userId: me.id, status: "PENDING" } }),
  ]);
  if (!district) return { ok: false, error: "Choose the district." };
  if (v.placeId && !place) return { ok: false, error: "That place isn't in this district. Choose it again." };
  if (!place && !v.placeName) return { ok: false, error: "Tell us which place the photos show." };
  if (pending + v.photos.length > MAX_PENDING_PER_USER) {
    return { ok: false, error: "You have a lot of photos waiting for review. Please wait until we've looked at them." };
  }

  try {
    await db.travelerPhoto.createMany({
      data: v.photos.map((p) => ({
        userId: me.id,
        districtId: district.id,
        placeId: place?.id ?? null,
        placeName: place ? null : v.placeName!,
        url: p.url,
        publicId: p.publicId,
        caption: p.caption,
        creditName: v.creditName,
      })),
    });
  } catch {
    return { ok: false, error: "One of these photos was already shared." };
  }

  await notifyTeam({
    subject: `${v.photos.length} traveler photo${v.photos.length === 1 ? "" : "s"} to review: ${place?.name ?? v.placeName}, ${district.name}`,
    lines: [`${v.creditName} shared ${v.photos.length} photo${v.photos.length === 1 ? "" : "s"}.`, "Review them in the admin: /admin/traveler-photos"],
  }).catch(() => undefined);

  revalidatePath("/dashboard/photos");
  revalidatePath("/admin/traveler-photos");
  return { ok: true, count: v.photos.length };
}

/** A traveler removes one of their own photos, wherever it's used. */
export async function deleteMyTravelerPhotoAction(id: string): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in again." };
  const photo = await db.travelerPhoto.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, url: true, publicId: true, district: { select: { slug: true } } },
  });
  if (!photo) return { ok: false, error: "Photo not found." };
  await removeTravelerPhoto(photo);
  revalidatePath("/dashboard/photos");
  revalidatePath(`/districts/${photo.district.slug}`, "layout");
  return { ok: true };
}
