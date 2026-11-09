"use client";

import { useId, useState } from "react";
import { FACILITY_OPTIONS } from "@/lib/applications";
import { stayQuote } from "@/lib/homestay-shared";
import { applyText } from "@/lib/i18n/apply";
import { becomeHostText, toBn, type HostPageLang } from "@/lib/i18n/become-host";
import { cn } from "@/lib/utils";

const fmt = (n: number, lang: HostPageLang) => {
  const s = `৳${n.toLocaleString("en-IN")}`;
  return lang === "bn" ? toBn(s) : s;
};

const START = ["private_room", "fan", "home_cooked_meals"];

/** Pick facilities, stay length and stays per month → what the host would receive. */
export function EarningsCalculator({ lang }: { lang: HostPageLang }) {
  const t = becomeHostText[lang];
  const facilityLabel = applyText[lang].facility as Record<string, string>;
  const [facilities, setFacilities] = useState<string[]>(START);
  const [stayNights, setStayNights] = useState(3);
  const [stays, setStays] = useState(4);
  const nightsId = useId();
  const staysId = useId();

  const quote = stayQuote(facilities, stayNights);
  const month = quote.hostPayoutBDT * stays;
  const toggle = (f: string) => setFacilities((x) => (x.includes(f) ? x.filter((i) => i !== f) : [...x, f]));

  return (
    <div className="grid gap-10 rounded-lg border border-forest-900/10 bg-paper p-6 shadow-sm sm:p-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-8">
        <fieldset>
          <legend className="text-sm font-medium">{t.calcFacilities}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {FACILITY_OPTIONS.map((f) => {
              const on = facilities.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(f)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    on ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 bg-paper text-ink-soft hover:border-forest-900/40",
                  )}
                >
                  {facilityLabel[f] ?? f}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={nightsId} className="text-sm font-medium">{t.calcStayLength}</label>
            <span className="font-display text-2xl">{t.nightsLabel(stayNights)}</span>
          </div>
          <input id={nightsId} type="range" min={1} max={7} value={stayNights} onChange={(e) => setStayNights(Number(e.target.value))} aria-valuetext={t.nightsLabel(stayNights)} className="mt-3 w-full accent-forest-800" />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={staysId} className="text-sm font-medium">{t.calcStays}</label>
            <span className="font-display text-2xl">{lang === "bn" ? toBn(stays) : stays}</span>
          </div>
          <input id={staysId} type="range" min={1} max={12} value={stays} onChange={(e) => setStays(Number(e.target.value))} aria-valuetext={String(stays)} className="mt-3 w-full accent-forest-800" />
        </div>
        <p className="text-sm text-ink-mute">
          {t.calcGuest(fmt(quote.firstNightBDT, lang), fmt(quote.extraNightBDT, lang), lang === "bn" ? toBn(quote.extraNightPercent) : String(quote.extraNightPercent))}
        </p>
      </div>

      <div className="flex flex-col justify-center rounded-md bg-forest-900 p-8 text-paper" aria-live="polite">
        <p className="eyebrow text-forest-200">{t.calcPerStay}</p>
        <p className="mt-2 font-display text-3xl">{fmt(quote.hostPayoutBDT, lang)}</p>
        <p className="eyebrow mt-8 text-forest-200">{t.calcMonth}</p>
        <p className={cn("mt-3 font-display text-6xl leading-none sm:text-7xl", lang === "bn" && "font-bengali")}>{fmt(month, lang)}</p>
        <p className="mt-6 text-forest-200">
          {t.calcYear} <span className="font-medium text-paper">{fmt(month * 12, lang)}</span>
        </p>
        <p className="mt-6 text-xs leading-relaxed text-paper/60">{t.calcNote}</p>
      </div>
    </div>
  );
}
