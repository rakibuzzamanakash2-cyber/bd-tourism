import { Stars } from "@/components/reviews/stars";
import { reviewerName } from "@/lib/review-shared";
import type { RatingSummary } from "@/lib/reviews";

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  guideRating?: number | null;
  guideComment?: string | null;
  reply: string | null;
  replyBy: string | null;
  createdAt: Date;
  author: { name: string | null; touristProfile: { nationality: string | null } | null };
};

const monthYear = (d: Date) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(d);

/**
 * Rating summary + reviews. `mode="guide"` shows the guide rating and the
 * traveler's words about the guide instead of the trip review.
 */
export function ReviewSection({
  summary,
  reviews,
  replyLabel = "Response from DeltaWay",
  hostReplyLabel = "Response from the host",
  mode = "trip",
  emptyText,
}: {
  summary: RatingSummary;
  reviews: PublicReview[];
  replyLabel?: string;
  hostReplyLabel?: string;
  mode?: "trip" | "guide";
  emptyText: string;
}) {
  return (
    <section id="reviews" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h2 id="reviews-heading" className="font-display text-3xl">Reviews</h2>
        {summary.count > 0 && (
          <p className="flex items-center gap-2 text-ink-soft">
            <Stars value={summary.average} />
            <span className="font-medium text-ink">{summary.average.toFixed(1)}</span>
            <span>· {summary.count} {summary.count === 1 ? "review" : "reviews"}</span>
          </p>
        )}
      </div>
      {reviews.length === 0 ? (
        <p className="mt-4 text-ink-soft">{emptyText}</p>
      ) : (
        <ul className="mt-6 divide-y divide-forest-900/10">
          {reviews.map((r) => {
            const rating = mode === "guide" ? (r.guideRating ?? r.rating) : r.rating;
            const text = mode === "guide" ? r.guideComment : r.comment;
            return (
              <li key={r.id} className="py-6 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={rating} />
                  {mode === "trip" && r.title && <p className="font-medium">{r.title}</p>}
                </div>
                {text && <p className="mt-3 whitespace-pre-line leading-relaxed">{text}</p>}
                <p className="mt-3 text-sm text-ink-mute">
                  {reviewerName(r.author.name)}
                  {r.author.touristProfile?.nationality && `, ${r.author.touristProfile.nationality}`} · {monthYear(r.createdAt)}
                </p>
                {mode === "trip" && r.reply && (
                  <div className="mt-4 rounded-md border-l-2 border-forest-700 bg-paper-warm px-4 py-3 text-sm">
                    <p className="text-xs font-medium text-forest-800">{r.replyBy === "HOST" ? hostReplyLabel : replyLabel}</p>
                    <p className="mt-1 whitespace-pre-line text-ink-soft">{r.reply}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
