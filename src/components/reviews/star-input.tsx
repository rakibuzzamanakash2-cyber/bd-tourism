"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { RATING_WORD } from "@/lib/review-shared";
import { cn } from "@/lib/utils";

/** Five radio buttons that look like stars (keyboard: arrow keys). */
export function StarInput({ name, label, value, onChange, error }: { name: string; label: string; value: number; onChange: (v: number) => void; error?: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label} <span className="text-clay-600">*</span></legend>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-0.5 has-[:focus-visible]:rounded has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-700" onMouseEnter={() => setHover(n)}>
              <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" aria-label={`${n} ${n === 1 ? "star" : "stars"}: ${RATING_WORD[n]}`} />
              <Star className={cn("size-8 transition-colors", n <= shown ? "fill-clay-500 text-clay-500" : "text-forest-900/25")} aria-hidden />
            </label>
          ))}
        </div>
        <span className="text-sm text-ink-soft" aria-live="polite">{shown ? RATING_WORD[shown] : ""}</span>
      </div>
      {error && <p className="mt-1 text-xs text-clay-700">{error}</p>}
    </fieldset>
  );
}
