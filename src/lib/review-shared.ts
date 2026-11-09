// Review rules shared by the form (browser) and the server. No server imports.
import { z } from "zod";

/** Reviews can be written for this long after a trip ends… */
export const REVIEW_WINDOW_DAYS = 180;
/** …and edited for this long after they're posted. */
export const REVIEW_EDIT_DAYS = 14;
/** Booking statuses that mean the trip actually went ahead. */
export const REVIEWABLE_STATUSES = ["PAID", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] as const;

const stars = z.coerce.number().int().min(1, "Pick a rating").max(5);

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: stars,
  title: z.string().trim().max(100).optional().default(""),
  comment: z.string().trim().min(20, "Tell other travelers a little more (20+ characters)").max(3000),
  guideRating: stars.optional(),
  guideComment: z.string().trim().max(1500).optional().default(""),
});
export type ReviewInput = z.input<typeof reviewSchema>;

/** "Tom Traveler" → "Tom T." (we never show full names on reviews). */
export function reviewerName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A traveler";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export const RATING_WORD: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very good", 5: "Excellent" };
