import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReviewForm } from "@/components/reviews/review-form";
import { formatDateRange } from "@/lib/booking-utils";
import { db } from "@/lib/db";
import { bookingTitle } from "@/lib/homestay-shared";
import { reviewEligibility } from "@/lib/reviews";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Write a review" };

const WHY: Record<string, string> = {
  notTaken: "You can review a trip once it has gone ahead.",
  notEnded: "You can write a review once your trip has ended. We'll email you a reminder.",
  tooLate: "Reviews can be written up to six months after a trip.",
  editClosed: "Reviews can be edited for 14 days after posting, and this one is past that.",
};

export default async function WriteReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const b = await db.booking.findUnique({
    where: { id },
    include: {
      package: { select: { title: true } },
      homestay: { select: { name: true } },
      review: true,
      guideAssignments: { where: { status: "ACCEPTED" }, include: { guide: { select: { displayName: true } } }, take: 1 },
    },
  });
  if (!b || b.touristId !== user.id) notFound();
  const can = reviewEligibility(b, user.id);
  const subject = bookingTitle(b);
  const guideName = b.guideAssignments[0]?.guide.displayName ?? null;

  return (
    <div className="max-w-2xl">
      <Link href={`/dashboard/bookings/${b.id}`} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> Back to booking
      </Link>
      <p className="eyebrow mt-6 text-forest-700">{formatDateRange(b.startDate, b.endDate)}</p>
      <h1 className="mt-2 font-display text-4xl leading-tight">{b.review ? "Edit your review" : "Write a review"}</h1>
      <p className="mt-2 text-ink-soft">{subject}</p>
      <div className="mt-10">
        {can.ok ? (
          <ReviewForm
            bookingId={b.id}
            subject={b.homestay ? "your stay" : "the trip"}
            guideName={guideName}
            initial={b.review ? { rating: b.review.rating, title: b.review.title ?? "", comment: b.review.comment, guideRating: b.review.guideRating, guideComment: b.review.guideComment ?? "" } : undefined}
          />
        ) : (
          <p className="rounded-lg border border-forest-900/10 bg-paper-warm p-6 text-ink-soft">{WHY[can.reason] ?? "You can't review this booking."}</p>
        )}
      </div>
    </div>
  );
}
