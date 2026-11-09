"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";
import { signUpload, type UploadSignature } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/guide-shared";
import { homestayListingSchema, type HomestayListingInput } from "@/lib/homestay-shared";
import { holdingBookingWhere } from "@/lib/homestays";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

export type HostActionResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function myHomestay() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.homestay.findFirst({ where: { hostId: session.user.id, host: { role: "HOST" } } });
}

function refresh(slug?: string) {
  revalidatePath("/dashboard/host", "layout");
  revalidatePath("/homestays");
  if (slug) revalidatePath(`/homestays/${slug}`);
}

export async function updateMyHomestayAction(input: HomestayListingInput): Promise<HostActionResult> {
  const h = await myHomestay();
  if (!h) return { ok: false, error: "notHost" };
  const parsed = homestayListingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "fixErrors", fieldErrors };
  }
  const { houseRules, address, regionId, ...data } = parsed.data;
  if (!(await db.region.count({ where: { id: regionId } }))) return { ok: false, error: "fixErrors", fieldErrors: { regionId: "Pick a region" } };
  await db.homestay.update({ where: { id: h.id }, data: { ...data, regionId, houseRules: houseRules || null, address: address || null } });
  await audit({ actorId: h.hostId, action: "homestay.listing", targetType: "Homestay", targetId: h.id });
  refresh(h.slug);
  return { ok: true };
}

export async function setHostLanguageAction(language: "en" | "bn"): Promise<HostActionResult> {
  const h = await myHomestay();
  if (!h) return { ok: false, error: "notHost" };
  await db.homestay.update({ where: { id: h.id }, data: { language: language === "en" ? "en" : "bn" } });
  refresh();
  return { ok: true };
}

/** Close a night, or open it again. The date is the night's check-in day. */
export async function toggleHomestayNightAction(day: string): Promise<HostActionResult & { closed?: boolean }> {
  const h = await myHomestay();
  if (!h) return { ok: false, error: "notHost" };
  if (!z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(day).success) return { ok: false, error: "generic" };
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || day < dayKey(new Date())) return { ok: false, error: "pastDay" };

  const existing = await db.homestayBlockedDate.findUnique({ where: { homestayId_date: { homestayId: h.id, date } } });
  if (existing) {
    await db.homestayBlockedDate.delete({ where: { id: existing.id } });
    refresh(h.slug);
    return { ok: true, closed: false };
  }
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  const booked = await db.booking.count({ where: { homestayId: h.id, ...holdingBookingWhere(), startDate: { lt: next }, endDate: { gt: date } } });
  if (booked) return { ok: false, error: "bookedThatNight" };
  await db.homestayBlockedDate.create({ data: { homestayId: h.id, date } });
  refresh(h.slug);
  return { ok: true, closed: true };
}

export async function getHostUploadSignature(): Promise<{ ok: true; signature: UploadSignature } | { ok: false; error: string }> {
  const h = await myHomestay();
  if (!h) return { ok: false, error: "Please sign in again." };
  const limited = await rateLimit(`upload:user:${h.hostId}`, RATE_LIMITS.uploadUser);
  if (!limited.ok) return { ok: false, error: "Too many uploads. Please wait a little and try again." };
  const signature = signUpload("homestays");
  if (!signature) return { ok: false, error: "Photo uploads aren't available right now. Send your photos to us on WhatsApp." };
  return { ok: true, signature };
}
