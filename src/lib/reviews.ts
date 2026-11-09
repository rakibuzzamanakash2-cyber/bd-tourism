import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, simpleEmail } from "@/lib/email";
import { dayKey } from "@/lib/guide-shared";
import { bookingTitle } from "@/lib/homestay-shared";
import { REVIEW_EDIT_DAYS, REVIEW_WINDOW_DAYS, REVIEWABLE_STATUSES } from "@/lib/review-shared";

const DAY = 86_400_000;

export type Eligibility =
  | { ok: true; editing: boolean }
  | { ok: false; reason: "notYours" | "notTaken" | "notEnded" | "tooLate" | "editClosed" };

/** Can this traveler review (or still edit their review of) this booking? */
export function reviewEligibility(
  b: { touristId: string; status: string; endDate: Date; review: { createdAt: Date } | null },
  userId: string,
  now = new Date(),
): Eligibility {
  if (b.touristId !== userId) return { ok: false, reason: "notYours" };
  if (!(REVIEWABLE_STATUSES as readonly string[]).includes(b.status)) return { ok: false, reason: "notTaken" };
  // Tours end on their last day; stays on check-out day. Either way, from that day on.
  if (dayKey(b.endDate) > dayKey(now)) return { ok: false, reason: "notEnded" };
  if (b.review) {
    return now.getTime() - b.review.createdAt.getTime() <= REVIEW_EDIT_DAYS * DAY ? { ok: true, editing: true } : { ok: false, reason: "editClosed" };
  }
  if (now.getTime() - b.endDate.getTime() > REVIEW_WINDOW_DAYS * DAY) return { ok: false, reason: "tooLate" };
  return { ok: true, editing: false };
}

// ============================================================
// Ratings for pages and cards
// ============================================================
export type RatingSummary = { average: number; count: number };

const published = { status: "PUBLISHED" } as const;

export async function ratingSummary(where: Prisma.ReviewWhereInput, field: "rating" | "guideRating" = "rating"): Promise<RatingSummary> {
  const r = await db.review.aggregate({
    where: { ...published, ...where, ...(field === "guideRating" && { guideRating: { not: null } }) },
    _avg: { [field]: true },
    _count: { [field]: true },
  });
  const avg = (r._avg as Record<string, number | null>)[field] ?? 0;
  const count = (r._count as Record<string, number>)[field] ?? 0;
  return { average: Math.round(avg * 10) / 10, count };
}

/** Ratings for many tours / homestays / guides at once (for lists of cards). */
export async function ratingsBy(key: "packageId" | "homestayId" | "guideId", ids: string[]): Promise<Map<string, RatingSummary>> {
  if (ids.length === 0) return new Map();
  const field = key === "guideId" ? "guideRating" : "rating";
  const rows = await db.review.groupBy({
    by: [key],
    where: { ...published, [key]: { in: ids }, ...(field === "guideRating" && { guideRating: { not: null } }) },
    _avg: { [field]: true },
    _count: { [field]: true },
  });
  const out = new Map<string, RatingSummary>();
  for (const r of rows as unknown as Record<string, unknown>[]) {
    const id = r[key] as string | null;
    if (!id) continue;
    const avg = (r._avg as Record<string, number | null>)[field] ?? 0;
    out.set(id, { average: Math.round(avg * 10) / 10, count: (r._count as Record<string, number>)[field] ?? 0 });
  }
  return out;
}

export const publicReviewInclude = {
  author: { select: { name: true, touristProfile: { select: { nationality: true } } } },
} satisfies Prisma.ReviewInclude;

// ============================================================
// Asking for a review
// ============================================================
/** One email per trip, a day or so after it ends. */
export async function requestReviews(now = new Date()): Promise<number> {
  const today = new Date(dayKey(now));
  const due = await db.booking.findMany({
    where: {
      status: { in: [...REVIEWABLE_STATUSES] },
      review: null,
      reviewRequestSentAt: null,
      endDate: { lt: today, gte: new Date(today.getTime() - 14 * DAY) },
    },
    include: { tourist: { select: { email: true, name: true } }, package: { select: { title: true } }, homestay: { select: { name: true } } },
    take: 200,
  });
  let sent = 0;
  for (const b of due) {
    const { count } = await db.booking.updateMany({ where: { id: b.id, reviewRequestSentAt: null }, data: { reviewRequestSentAt: now } });
    if (!count) continue;
    const first = b.tourist.name?.split(/\s+/)[0] ?? "there";
    const what = bookingTitle(b);
    await sendEmail({
      to: b.tourist.email,
      subject: `How was ${what}?`,
      html: simpleEmail(
        `Hi ${first}, how was it?`,
        [
          `We hope you had a wonderful time on ${what}.`,
          `A few honest lines help other travelers choose, and help ${b.homestay ? "your host" : "our guides"} and us get better. It takes two minutes.`,
        ],
        { label: "Write a review", url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${b.id}/review` },
      ),
    });
    sent++;
  }
  return sent;
}
