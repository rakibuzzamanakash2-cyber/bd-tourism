"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";
import { GUIDE_ASSIGNABLE_BOOKING, guideProfileSchema } from "@/lib/guide-shared";
import { createGuideProfileFromApplication, emailGuide, guideConflicts, hasConflict, tripInfo } from "@/lib/guides";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

function refresh(bookingId?: string, guideId?: string) {
  revalidatePath("/admin/guides");
  if (guideId) revalidatePath(`/admin/guides/${guideId}`);
  if (bookingId) revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard/guide");
  revalidatePath("/guides");
}

// ============================================================
// Assign a guide to a booking
// ============================================================
const assignSchema = z.object({
  bookingId: z.string().min(1),
  guideId: z.string().min(1),
  feeBDT: z.coerce.number().int().min(0).max(1_000_000),
  note: z.string().trim().max(2000).optional().default(""),
  // Assign even though the guide blocked a day or has another trip
  override: z.boolean().optional().default(false),
});

export async function adminAssignGuide(input: z.input<typeof assignSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fee and try again." };
  const { bookingId, guideId, feeBDT, note, override } = parsed.data;

  const [booking, guide] = await Promise.all([
    db.booking.findUnique({ where: { id: bookingId }, include: { package: { select: { title: true } } } }),
    db.guideProfile.findUnique({ where: { id: guideId }, include: { user: { select: { email: true, role: true } } } }),
  ]);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (!(GUIDE_ASSIGNABLE_BOOKING as readonly string[]).includes(booking.status)) {
    return { ok: false, error: "Assign a guide once the booking is paid." };
  }
  if (!guide || !guide.isActive || guide.user.role !== "GUIDE") return { ok: false, error: "That guide isn't active." };

  const conflicts = await guideConflicts(guideId, booking.startDate, booking.endDate, bookingId);
  if (hasConflict(conflicts) && !override) {
    return { ok: false, error: "This guide isn't free on those dates. Tick “assign anyway” if you've agreed it with them." };
  }

  // One live assignment per booking. Lock the booking row so two admins
  // assigning at the same moment can't both succeed.
  const created = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${bookingId} FOR UPDATE`;
    const live = await tx.guideAssignment.count({ where: { bookingId, status: { in: ["PENDING", "ACCEPTED"] } } });
    if (live) return null;
    return tx.guideAssignment.create({
      data: { bookingId, guideId, feeBDT, noteToGuide: note || null, assignedById: admin.id },
    });
  });
  if (!created) return { ok: false, error: "This booking already has a guide. Cancel that first." };

  await audit({
    actorId: admin.id,
    action: "guide.assign",
    targetType: "Booking",
    targetId: bookingId,
    details: { guide: guide.displayName, feeBDT, ...(override && hasConflict(conflicts) && { override: true }) },
  });
  await emailGuide("request", guide, tripInfo(booking, feeBDT));
  refresh(bookingId, guideId);
  return { ok: true, message: `Sent to ${guide.displayName}. They'll accept or decline in their dashboard.` };
}

export async function adminCancelAssignment(input: { assignmentId: string; reason?: string }): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const a = await db.guideAssignment.findUnique({
    where: { id: input.assignmentId },
    include: { guide: { include: { user: { select: { email: true } } } }, booking: { include: { package: { select: { title: true } } } } },
  });
  if (!a) return { ok: false, error: "Not found." };
  const { count } = await db.guideAssignment.updateMany({
    where: { id: a.id, status: { in: ["PENDING", "ACCEPTED"] } },
    data: { status: "CANCELLED", declineReason: input.reason?.trim().slice(0, 500) || "Changed by the DeltaWay team" },
  });
  if (!count) return { ok: false, error: "This assignment already ended." };
  await audit({ actorId: admin.id, action: "guide.unassign", targetType: "Booking", targetId: a.bookingId, details: { guide: a.guide.displayName } });
  await emailGuide("cancelled", a.guide, tripInfo(a.booking, a.feeBDT));
  refresh(a.bookingId, a.guideId);
  return { ok: true, message: `${a.guide.displayName} has been taken off this trip.` };
}

// ============================================================
// Payouts
// ============================================================
export async function adminMarkGuidePaid(input: { assignmentId: string; reference?: string }): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const reference = input.reference?.trim().slice(0, 200) || null;
  const a = await db.guideAssignment.findUnique({
    where: { id: input.assignmentId },
    include: { guide: { include: { user: { select: { email: true } } } }, booking: { include: { package: { select: { title: true } } } } },
  });
  if (!a) return { ok: false, error: "Not found." };
  const { count } = await db.guideAssignment.updateMany({
    where: { id: a.id, status: "ACCEPTED", payoutStatus: "UNPAID" },
    data: { payoutStatus: "PAID", paidAt: new Date(), payoutReference: reference },
  });
  if (!count) return { ok: false, error: "Only accepted, unpaid trips can be marked paid." };
  await audit({ actorId: admin.id, action: "guide.payout", targetType: "GuideProfile", targetId: a.guideId, details: { bookingId: a.bookingId, feeBDT: a.feeBDT, reference } });
  await emailGuide("paid", a.guide, { ...tripInfo(a.booking, a.feeBDT), reference: reference ?? undefined });
  refresh(a.bookingId, a.guideId);
  return { ok: true, message: "Marked as paid. The guide got an email." };
}

// ============================================================
// Profiles
// ============================================================
const adminProfileSchema = guideProfileSchema.extend({
  id: z.string().min(1),
  phone: z.string().trim().min(6).max(30),
  isActive: z.boolean(),
});

export async function adminUpdateGuide(input: z.input<typeof adminProfileSchema>): Promise<AdminActionResult & { fieldErrors?: Record<string, string> }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = adminProfileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const { id, regionIds, licenceNumber, photoUrl, ...data } = parsed.data;
  await db.guideProfile.update({
    where: { id },
    data: { ...data, photoUrl: photoUrl || null, licenceNumber: licenceNumber || null, regions: { set: regionIds.map((r) => ({ id: r })) } },
  });
  await audit({ actorId: admin.id, action: "guide.update", targetType: "GuideProfile", targetId: id, details: { isActive: data.isActive, isListed: data.isListed } });
  refresh(undefined, id);
  return { ok: true, message: "Guide saved." };
}

/** For a guide account that has no profile yet (e.g. role set by hand). */
export async function adminCreateGuideProfile(userId: string): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const profile = await createGuideProfileFromApplication(userId);
  if (!profile) return { ok: false, error: "They have no guide application to build a profile from. Ask them to apply first." };
  await audit({ actorId: admin.id, action: "guide.create", targetType: "GuideProfile", targetId: profile.id });
  refresh(undefined, profile.id);
  return { ok: true, message: "Profile created." };
}
