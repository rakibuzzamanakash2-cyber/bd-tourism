"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { reviewSchema, type ReviewInput } from "@/lib/review-shared";
import { reviewEligibility } from "@/lib/reviews";
import { getAdminOrNull } from "@/lib/session";

export type ReviewResult = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const ELIGIBILITY_ERROR: Record<string, string> = {
  notYours: "You can only review your own trips.",
  notTaken: "You can review a trip once it has gone ahead.",
  notEnded: "You can write a review once your trip has ended.",
  tooLate: "Reviews can be written up to six months after a trip.",
  editClosed: "Reviews can be edited for 14 days after posting.",
};

async function refreshFor(r: { packageId: string | null; homestayId: string | null; guideId: string | null; bookingId: string }) {
  const [pkg, home, guide] = await Promise.all([
    r.packageId ? db.tourPackage.findUnique({ where: { id: r.packageId }, select: { slug: true } }) : null,
    r.homestayId ? db.homestay.findUnique({ where: { id: r.homestayId }, select: { slug: true } }) : null,
    r.guideId ? db.guideProfile.findUnique({ where: { id: r.guideId }, select: { slug: true } }) : null,
  ]);
  if (pkg) revalidatePath(`/packages/${pkg.slug}`);
  if (home) revalidatePath(`/homestays/${home.slug}`);
  if (guide) revalidatePath(`/guides/${guide.slug}`);
  revalidatePath("/packages");
  revalidatePath("/homestays");
  revalidatePath("/guides");
  revalidatePath(`/dashboard/bookings/${r.bookingId}`);
  revalidatePath("/admin/reviews");
  revalidatePath("/dashboard/host");
}

export async function submitReviewAction(input: ReviewInput): Promise<ReviewResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in again." };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;
  const booking = await db.booking.findUnique({
    where: { id: d.bookingId },
    include: {
      review: { select: { id: true, createdAt: true } },
      guideAssignments: { where: { status: "ACCEPTED" }, select: { guideId: true }, take: 1 },
      package: { select: { itinerary: { select: { destinationId: true }, orderBy: { dayNumber: "asc" }, take: 1 } } },
    },
  });
  if (!booking) return { ok: false, error: "Booking not found." };
  const can = reviewEligibility(booking, session.user.id);
  if (!can.ok) return { ok: false, error: ELIGIBILITY_ERROR[can.reason] };

  const guideId = booking.guideAssignments[0]?.guideId ?? null;
  const data = {
    rating: d.rating,
    title: d.title || null,
    comment: d.comment,
    guideRating: guideId ? (d.guideRating ?? null) : null,
    guideComment: guideId && d.guideComment ? d.guideComment : null,
  };
  const review = booking.review
    ? await db.review.update({ where: { id: booking.review.id }, data })
    : await db.review.create({
        data: {
          ...data,
          bookingId: booking.id,
          authorId: session.user.id,
          packageId: booking.packageId,
          homestayId: booking.homestayId,
          guideId,
          destinationId: booking.package?.itinerary[0]?.destinationId ?? null,
        },
      });
  await refreshFor(review);
  return { ok: true, message: booking.review ? "Review updated." : "Thank you! Your review is live." };
}

// ============================================================
// Replies (hosts for their homestay, the team for anything)
// ============================================================
const replySchema = z.object({ reviewId: z.string().min(1), reply: z.string().trim().max(1500) });

export async function hostReplyToReviewAction(input: z.input<typeof replySchema>): Promise<ReviewResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "notHost" };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const review = await db.review.findUnique({ where: { id: parsed.data.reviewId }, include: { homestay: { select: { hostId: true } } } });
  // Hosts may answer reviews of their own homestay only, and not a team reply
  if (!review?.homestay || review.homestay.hostId !== session.user.id || review.replyBy === "TEAM") return { ok: false, error: "generic" };
  const reply = parsed.data.reply || null;
  await db.review.update({ where: { id: review.id }, data: { reply, replyBy: reply ? "HOST" : null, repliedAt: reply ? new Date() : null } });
  await refreshFor(review);
  return { ok: true };
}

export async function adminReplyToReviewAction(input: z.input<typeof replySchema>): Promise<ReviewResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Reply is too long." };
  const reply = parsed.data.reply || null;
  const review = await db.review.update({ where: { id: parsed.data.reviewId }, data: { reply, replyBy: reply ? "TEAM" : null, repliedAt: reply ? new Date() : null } });
  await audit({ actorId: admin.id, action: "review.reply", targetType: "Review", targetId: review.id });
  await refreshFor(review);
  return { ok: true, message: reply ? "Reply posted." : "Reply removed." };
}

export async function adminSetReviewHiddenAction(input: { reviewId: string; hidden: boolean; reason?: string }): Promise<ReviewResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const reason = input.reason?.trim().slice(0, 300) || null;
  if (input.hidden && !reason) return { ok: false, error: "Add a short reason (only the team sees it)." };
  const review = await db.review.update({
    where: { id: input.reviewId },
    data: input.hidden ? { status: "HIDDEN", hiddenReason: reason } : { status: "PUBLISHED", hiddenReason: null },
  });
  await audit({ actorId: admin.id, action: input.hidden ? "review.hide" : "review.show", targetType: "Review", targetId: review.id, details: reason ? { reason } : undefined });
  await refreshFor(review);
  return { ok: true, message: input.hidden ? "Review hidden." : "Review is public again." };
}
