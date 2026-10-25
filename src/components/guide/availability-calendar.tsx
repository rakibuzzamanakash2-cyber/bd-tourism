"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { toggleBlockedDayAction } from "@/lib/actions/guide";
import { guideText } from "@/lib/i18n/guide";
import { cn } from "@/lib/utils";

const MONTHS_AHEAD = 12;
const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * Month calendar: tap a day to block it or free it again.
 * Days with a trip are shown and can't be blocked.
 */
export function AvailabilityCalendar({ lang, today, blocked: initialBlocked, tripDays }: { lang: "en" | "bn"; today: string; blocked: string[]; tripDays: string[] }) {
  const t = guideText[lang];
  const [ty, tm] = today.split("-").map(Number);
  const [offset, setOffset] = useState(0);
  const [blocked, setBlocked] = useState(() => new Set(initialBlocked));
  const [busyDay, setBusyDay] = useState<string | null>(null);
  const [, start] = useTransition();
  const trips = useMemo(() => new Set(tripDays), [tripDays]);

  const first = new Date(Date.UTC(ty, tm - 1 + offset, 1));
  const y = first.getUTCFullYear();
  const m = first.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const lead = first.getUTCDay();
  const monthName = new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const dayNum = (d: number) => (lang === "bn" ? new Intl.NumberFormat("bn-BD").format(d) : String(d));

  function toggle(day: string) {
    setBusyDay(day);
    // Show the change straight away; undo it if the server says no
    setBlocked((b) => {
      const n = new Set(b);
      if (n.has(day)) n.delete(day);
      else n.add(day);
      return n;
    });
    start(async () => {
      const r = await toggleBlockedDayAction(day);
      setBusyDay(null);
      if (!r.ok) {
        toast.error(t.errors[r.error] ?? t.errors.generic);
        setBlocked((b) => {
          const n = new Set(b);
          if (n.has(day)) n.delete(day);
          else n.add(day);
          return n;
        });
      }
    });
  }

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" aria-label={t.prevMonth} disabled={offset === 0} onClick={() => setOffset((o) => o - 1)} className="rounded-full p-2 hover:bg-forest-100 disabled:opacity-30">
          <ChevronLeft className="size-5" />
        </button>
        <p className={cn("font-display text-xl", lang === "bn" && "font-bengali")} aria-live="polite">{monthName}</p>
        <button type="button" aria-label={t.nextMonth} disabled={offset >= MONTHS_AHEAD} onClick={() => setOffset((o) => o + 1)} className="rounded-full p-2 hover:bg-forest-100 disabled:opacity-30">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-mute">
        {t.weekdays.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`x${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const k = key(y, m, d);
          const past = k < today;
          const isTrip = trips.has(k);
          const isBlocked = blocked.has(k);
          return (
            <button
              key={k}
              type="button"
              disabled={past || isTrip || busyDay === k}
              onClick={() => toggle(k)}
              aria-pressed={isBlocked}
              aria-label={`${k}${isTrip ? `, ${t.legendTrip}` : isBlocked ? `, ${t.legendBlocked}` : ""}`}
              className={cn(
                "aspect-square rounded-md text-sm transition-colors",
                past && "text-ink-mute/40",
                !past && !isTrip && !isBlocked && "hover:bg-forest-100",
                isBlocked && "bg-clay-600 text-paper line-through hover:bg-clay-700",
                isTrip && "bg-forest-900 text-paper",
                k === today && !isBlocked && !isTrip && "ring-1 ring-forest-900",
              )}
            >
              {dayNum(d)}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-clay-600" /> {t.legendBlocked}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-forest-900" /> {t.legendTrip}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm ring-1 ring-forest-900" /> {t.legendToday}</span>
      </div>
    </div>
  );
}
