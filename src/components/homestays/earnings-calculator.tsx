"use client";

import { useId, useState } from "react";
import { guestNightlyBDT } from "@/lib/homestay-shared";
import { becomeHostText, toBn, type HostPageLang } from "@/lib/i18n/become-host";
import { cn } from "@/lib/utils";

const fmt = (n: number, lang: HostPageLang) => {
  const s = `৳${n.toLocaleString("en-IN")}`;
  return lang === "bn" ? toBn(s) : s;
};

/** Two sliders → what a host would receive per month and year. */
export function EarningsCalculator({ lang }: { lang: HostPageLang }) {
  const t = becomeHostText[lang];
  const [price, setPrice] = useState(3000);
  const [nights, setNights] = useState(8);
  const priceId = useId();
  const nightsId = useId();
  const month = price * nights;

  return (
    <div className="grid gap-10 rounded-lg border border-forest-900/10 bg-paper p-6 shadow-sm sm:p-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-10">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={priceId} className="text-sm font-medium">{t.calcPrice}</label>
            <span className="font-display text-3xl">{fmt(price, lang)}</span>
          </div>
          <input
            id={priceId}
            type="range"
            min={1000}
            max={10000}
            step={100}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            aria-valuetext={fmt(price, lang)}
            className="mt-4 w-full accent-forest-800"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={nightsId} className="text-sm font-medium">{t.calcNights}</label>
            <span className="font-display text-3xl">{t.nightsLabel(nights)}</span>
          </div>
          <input
            id={nightsId}
            type="range"
            min={1}
            max={25}
            step={1}
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
            aria-valuetext={t.nightsLabel(nights)}
            className="mt-4 w-full accent-forest-800"
          />
        </div>
        <p className="text-sm text-ink-mute">{t.calcGuest(fmt(guestNightlyBDT(price), lang))}</p>
      </div>

      <div className="flex flex-col justify-center rounded-md bg-forest-900 p-8 text-paper" aria-live="polite">
        <p className="eyebrow text-forest-200">{t.calcMonth}</p>
        <p className={cn("mt-3 font-display text-6xl leading-none sm:text-7xl", lang === "bn" && "font-bengali")}>{fmt(month, lang)}</p>
        <p className="mt-6 text-forest-200">
          {t.calcYear} <span className="font-medium text-paper">{fmt(month * 12, lang)}</span>
        </p>
        <p className="mt-6 text-xs leading-relaxed text-paper/60">{t.calcNote}</p>
      </div>
    </div>
  );
}
