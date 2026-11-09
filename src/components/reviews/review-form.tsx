"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/admin/form";
import { StarInput } from "@/components/reviews/star-input";
import { submitReviewAction } from "@/lib/actions/review";

type Props = {
  bookingId: string;
  subject: string;
  guideName: string | null;
  initial?: { rating: number; title: string; comment: string; guideRating: number | null; guideComment: string };
};

export function ReviewForm({ bookingId, subject, guideName, initial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [guideRating, setGuideRating] = useState(initial?.guideRating ?? 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await submitReviewAction({
        bookingId,
        rating,
        title: String(fd.get("title") ?? ""),
        comment: String(fd.get("comment") ?? ""),
        guideRating: guideName && guideRating ? guideRating : undefined,
        guideComment: String(fd.get("guideComment") ?? ""),
      });
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        return void toast.error(r.error);
      }
      toast.success(r.message ?? "Thank you!");
      router.push(`/dashboard/bookings/${bookingId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <StarInput name="rating" label={`How was ${subject}?`} value={rating} onChange={setRating} error={errors.rating} />
      <Field id="title" label="Headline (optional)" error={errors.title}>
        <input id="title" name="title" maxLength={100} className={inputClass} defaultValue={initial?.title} placeholder="e.g. Tea gardens, rain and the best khichuri" />
      </Field>
      <Field id="comment" label="Your review" hint="What stood out? What should other travelers know? Please don't include anyone's phone number." required error={errors.comment}>
        <textarea id="comment" name="comment" rows={6} maxLength={3000} className={inputClass} defaultValue={initial?.comment} />
      </Field>
      {guideName && (
        <div className="space-y-4 rounded-lg border border-forest-900/10 p-5">
          <StarInput name="guideRating" label={`How was your guide, ${guideName}?`} value={guideRating} onChange={setGuideRating} error={errors.guideRating} />
          <Field id="guideComment" label={`A few words about ${guideName.split(/\s+/)[0]} (optional)`} error={errors.guideComment}>
            <textarea id="guideComment" name="guideComment" rows={3} maxLength={1500} className={inputClass} defaultValue={initial?.guideComment} />
          </Field>
        </div>
      )}
      <p className="text-xs text-ink-mute">Your review appears with your first name and last initial. You can edit it for 14 days.</p>
      <button type="submit" disabled={pending} className="rounded-full bg-forest-900 px-8 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-60">
        {pending ? "Posting…" : initial ? "Update review" : "Post review"}
      </button>
    </form>
  );
}
