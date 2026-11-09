import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating, e.g. 4.6 → four full stars and a mostly filled fifth. */
export function Stars({ value, className, size = "size-4" }: { value: number; className?: string; size?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className={cn("relative inline-block", size)} aria-hidden>
            <Star className={cn("absolute inset-0 text-forest-900/20", size)} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn("fill-clay-500 text-clay-500", size)} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** "★ 4.8 (12)" for cards. Shows nothing until there's a review. */
export function RatingBadge({ summary, className }: { summary?: { average: number; count: number }; className?: string }) {
  if (!summary || summary.count === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="size-3.5 fill-clay-500 text-clay-500" aria-hidden />
      <span className="font-medium">{summary.average.toFixed(1)}</span>
      <span className="text-ink-mute">({summary.count} {summary.count === 1 ? "review" : "reviews"})</span>
    </span>
  );
}
