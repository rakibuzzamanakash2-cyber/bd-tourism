"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { dayKey, guideProfileSchema } from "@/lib/guide-shared";
import { emailTouristAboutGuide, guideConflicts, notifyTeam } from "@/lib/guides";
import { formatDateRange } from "@/lib/booking-utils";
import { signUpload, type UploadSignature } from "@/lib/cloudinary";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

// Errors come back as codes, so the dashboard can show them in Bangla too
export type GuideActionResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function myProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.guideProfile.findFirst({ where: { userId: session.user.id, user: { role: "GUIDE" } } });
}

function refresh() {
  revalidatePath("/dashboard/guide", "layout");
  revalidatePath("/guides");
}

// ============================================================
// Accept or decline a trip
// ============================================================
const respondSchema = z.object({ assignmentId: z.string().min(1), accept: z.boolean(), reason: z.string().trim().max(500).optional().default("") });

export async function respondToTripAction(input: z.input<typeof respondSchema>): Promise<GuideActionResult> {
  const guide = await myProfile();
  if (!guide) return { ok: false, error: "notGuide" };
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const { assignmentId, accept, reason } = parsed.data;
  if (!accept && reason.length < 3) return { ok: false, error: "reasonRequired" };

  const a = await db.guideAssignment.findUnique({
    where: { id: assignmentId },
    include: { booking: { include: { package: { select: { title: true } } } } },
  });
  if (!a || a.guideId !== guide.id) return { ok: false, error: "generic" };
  if (a.status !== "PENDING" || a.booking.status === "CANCELLED") return { ok: false, error: "noLongerPending" };

  if (accept) {
    const c = await guideConflicts(guide.id, a.booking.startDate, a.booking.endDate, a.bookingId);
    // Another trip they already accepted on these days: can't do both
    if (c.trips.length) return { ok: false, error: "overlap" };
  }

  const { count } = await db.guideAssignment.updateMany({
    where: { id: a.id, status: "PENDING" },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date(), declineReason: accept ? null : reason },
  });
  if (!count) return { ok: false, error: "noLongerPending" };

  await audit({
    actorId: guide.userId,
    action: accept ? "guide.accept" : "guide.decline",
    targetType: "Booking",
    targetId: a.bookingId,
    details: { guide: guide.displayName, ...(reason && { reason }) },
  });
  const title = a.booking.package?.title ?? "Custom trip";
  await Promise.all([
    notifyTeam({
      subject: `${guide.displayName} ${accept ? "accepted" : "declined"} ${a.booking.bookingCode}`,
      lines: [
        `${title}, ${formatDateRange(a.booking.startDate, a.booking.endDate)}`,
        ...(accept ? [] : [`Reason: ${reason}`, "Assign another guide:"]),
        `${env.NEXT_PUBLIC_APP_URL}/admin/bookings/${a.bookingId}`,
      ],
    }),
    accept ? emailTouristAboutGuide(a.bookingId) : Promise.resolve(),
  ]);
  refresh();
  revalidatePath(`/admin/bookings/${a.bookingId}`);
  revalidatePath(`/dashboard/bookings/${a.bookingId}`);
  return { ok: true };
}

// ============================================================
// Profile
// ============================================================
export async function updateMyGuideProfileAction(input: z.input<typeof guideProfileSchema>): Promise<GuideActionResult> {
  const guide = await myProfile();
  if (!guide) return { ok: false, error: "notGuide" };
  const parsed = guideProfileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "fixErrors", fieldErrors };
  }
  const { regionIds, licenceNumber, photoUrl, ...data } = parsed.data;
  const regions = await db.region.findMany({ where: { id: { in: regionIds } }, select: { id: true } });
  await db.guideProfile.update({
    where: { id: guide.id },
    data: { ...data, photoUrl: photoUrl || null, licenceNumber: licenceNumber || null, regions: { set: regions } },
  });
  await audit({ actorId: guide.userId, action: "guide.profile", targetType: "GuideProfile", targetId: guide.id });
  refresh();
  revalidatePath(`/guides/${guide.slug}`);
  return { ok: true };
}

export async function setGuideLanguageAction(language: "en" | "bn"): Promise<GuideActionResult> {
  const guide = await myProfile();
  if (!guide) return { ok: false, error: "notGuide" };
  await db.guideProfile.update({ where: { id: guide.id }, data: { language: language === "bn" ? "bn" : "en" } });
  refresh();
  return { ok: true };
}

// ============================================================
// Availability
// ============================================================
const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Mark a day as unavailable, or free it again. */
export async function toggleBlockedDayAction(day: string): Promise<GuideActionResult & { blocked?: boolean }> {
  const guide = await myProfile();
  if (!guide) return { ok: false, error: "notGuide" };
  if (!daySchema.safeParse(day).success) return { ok: false, error: "generic" };
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || dayKey(date) < dayKey(new Date())) return { ok: false, error: "pastDay" };

  const existing = await db.guideBlockedDate.findUnique({ where: { guideId_date: { guideId: guide.id, date } } });
  if (existing) {
    await db.guideBlockedDate.delete({ where: { id: existing.id } });
    refresh();
    return { ok: true, blocked: false };
  }
  // Can't block a day they've already promised to a traveler
  const busy = await db.guideAssignment.count({
    where: { guideId: guide.id, status: "ACCEPTED", booking: { status: { not: "CANCELLED" }, startDate: { lte: date }, endDate: { gte: date } } },
  });
  if (busy) return { ok: false, error: "tripThatDay" };
  await db.guideBlockedDate.create({ data: { guideId: guide.id, date } });
  refresh();
  return { ok: true, blocked: true };
}

// ============================================================
// Photo upload for the guide's own profile
// ============================================================
export async function getGuideUploadSignature(): Promise<{ ok: true; signature: UploadSignature } | { ok: false; error: string }> {
  const guide = await myProfile();
  if (!guide) return { ok: false, error: "Please sign in again." };
  const limited = await rateLimit(`upload:user:${guide.userId}`, RATE_LIMITS.uploadUser);
  if (!limited.ok) return { ok: false, error: "Too many uploads. Please wait a little and try again." };
  const signature = signUpload("guides");
  if (!signature) return { ok: false, error: "Photo uploads aren't available right now. Send your photo to us on WhatsApp." };
  return { ok: true, signature };
}
