"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { TIER_ORDER, type DayTier, type Rate, bdt, tierLabel, usd } from "@/lib/costs";
import {
  MAX_NIGHTS_PER_STOP,
  MAX_STOPS,
  MAX_TOTAL_NIGHTS,
  MAX_TRAVELLERS,
  type Stop,
  formatPlan,
  parsePlan,
  pricePlan,
  totalNights,
} from "@/lib/trip-plan";
import { cn } from "@/lib/utils";

export type PlannerDistrict = {
  slug: string;
  name: string;
  division: string;
  costMultiplier: number;
  permitRequired: boolean;
};

type Props = {
  districts: PlannerDistrict[];
  rates: Rate[];
  serviceFeePercent: number;
  initialPlan: string | null;
  initialTravellers: number;
  initialTier: DayTier;
};

const TIER_HINT: Record<DayTier, string> = {
  budget: "Guesthouses, local food, buses and trains",
  comfortable: "Good hotels, a car and driver, a guide with you",
  fine: "The best rooms in each town, everything arranged",
};

export function TripPlanner({ districts, rates, serviceFeePercent, initialPlan, initialTravellers, initialTier }: Props) {
  const known = useMemo(() => new Set(districts.map((d) => d.slug)), [districts]);
  const [stops, setStops] = useState<Stop[]>(() => parsePlan(initialPlan).filter((s) => known.has(s.slug)));
  const [travellers, setTravellers] = useState(initialTravellers);
  const [tier, setTier] = useState<DayTier>(initialTier);
  const [search, setSearch] = useState("");

  // Keep the plan in the address bar so it can be shared or survive a sign-in.
  useEffect(() => {
    const q = new URLSearchParams();
    if (stops.length) q.set("plan", formatPlan(stops));
    if (travellers !== 2) q.set("people", String(travellers));
    if (tier !== "comfortable") q.set("level", tier);
    const url = q.toString() ? `/planner?${q}` : "/planner";
    window.history.replaceState(null, "", url);
  }, [stops, travellers, tier]);

  const nights = totalNights(stops);
  const chosen = new Set(stops.map((s) => s.slug));
  const full = stops.length >= MAX_STOPS;

  const byDivision = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups = new Map<string, PlannerDistrict[]>();
    for (const d of districts) {
      if (q && !d.name.toLowerCase().includes(q)) continue;
      const list = groups.get(d.division) ?? [];
      list.push(d);
      groups.set(d.division, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [districts, search]);

  const priced = pricePlan(stops, districts, rates, { tier, travellers, serviceFeePercent });
  const needsPermit = stops.some((s) => districts.find((d) => d.slug === s.slug)?.permitRequired);

  const add = (slug: string) => {
    if (full || chosen.has(slug) || nights >= MAX_TOTAL_NIGHTS) return;
    setStops([...stops, { slug, nights: 2 }]);
  };
  const setNights = (slug: string, n: number) =>
    setStops(stops.map((s) => (s.slug === slug ? { ...s, nights: Math.max(1, Math.min(MAX_NIGHTS_PER_STOP, n)) } : s)));
  const remove = (slug: string) => setStops(stops.filter((s) => s.slug !== slug));

  const bookHref = `/book/custom?plan=${encodeURIComponent(formatPlan(stops))}&people=${travellers}&level=${tier}`;

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h2 className="font-display text-3xl">Where do you want to go?</h2>
        <p className="mt-2 text-ink-soft">
          Pick up to {MAX_STOPS} districts. You can change the nights afterwards.
        </p>

        <label className="mt-6 block">
          <span className="sr-only">Search districts</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 64 districts"
            className="w-full rounded-full border border-forest-900/15 bg-paper px-5 py-2.5 text-sm"
          />
        </label>

        <div className="mt-6 space-y-6">
          {byDivision.map(([division, list]) => (
            <div key={division}>
              <p className="eyebrow text-forest-700">{division}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {list.map((d) => {
                  const on = chosen.has(d.slug);
                  return (
                    <button
                      key={d.slug}
                      type="button"
                      onClick={() => (on ? remove(d.slug) : add(d.slug))}
                      aria-pressed={on}
                      disabled={!on && full}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        on
                          ? "border-forest-900 bg-forest-900 text-paper"
                          : "border-forest-900/15 hover:border-forest-900/50 disabled:opacity-40 disabled:hover:border-forest-900/15",
                      )}
                    >
                      {d.name}
                      {d.permitRequired && <span className="ml-1 text-xs opacity-70">·permit</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {byDivision.length === 0 && <p className="text-ink-mute">No district matches “{search}”.</p>}
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-6">
          <h2 className="font-display text-3xl">Your trip</h2>

          {stops.length === 0 ? (
            <p className="mt-4 text-ink-soft">Pick a district and it will show up here with a rough price.</p>
          ) : (
            <>
              <ul className="mt-5 space-y-3">
                {stops.map((s) => {
                  const d = districts.find((x) => x.slug === s.slug);
                  const line = priced?.stops.find((p) => p.slug === s.slug);
                  return (
                    <li key={s.slug} className="flex items-center gap-3 border-b border-forest-900/10 pb-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{d?.name ?? s.slug}</p>
                        {line && <p className="text-xs text-ink-mute">{bdt(line.subtotal)} each</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setNights(s.slug, s.nights - 1)}
                          disabled={s.nights <= 1}
                          aria-label={`One night fewer in ${d?.name ?? s.slug}`}
                          className="rounded-full border border-forest-900/20 p-1.5 disabled:opacity-30"
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-16 text-center text-sm tabular-nums">
                          {s.nights} night{s.nights === 1 ? "" : "s"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNights(s.slug, s.nights + 1)}
                          disabled={s.nights >= MAX_NIGHTS_PER_STOP || nights >= MAX_TOTAL_NIGHTS}
                          aria-label={`One night more in ${d?.name ?? s.slug}`}
                          className="rounded-full border border-forest-900/20 p-1.5 disabled:opacity-30"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(s.slug)}
                        aria-label={`Remove ${d?.name ?? s.slug}`}
                        className="rounded-full p-1.5 text-ink-mute hover:text-clay-700"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-sm">Travelling</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTravellers(Math.max(1, travellers - 1))}
                    disabled={travellers <= 1}
                    aria-label="One traveller fewer"
                    className="rounded-full border border-forest-900/20 p-1.5 disabled:opacity-30"
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-20 text-center text-sm tabular-nums">
                    {travellers} {travellers === 1 ? "person" : "people"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTravellers(Math.min(MAX_TRAVELLERS, travellers + 1))}
                    disabled={travellers >= MAX_TRAVELLERS}
                    aria-label="One traveller more"
                    className="rounded-full border border-forest-900/20 p-1.5 disabled:opacity-30"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <fieldset className="mt-5">
                <legend className="text-sm">How you&rsquo;d like to travel</legend>
                <div className="mt-2 space-y-2">
                  {TIER_ORDER.map((t) => (
                    <label key={t} className="flex cursor-pointer items-start gap-3 text-sm">
                      <input
                        type="radio"
                        name="tier"
                        checked={tier === t}
                        onChange={() => setTier(t)}
                        className="mt-1 size-4"
                      />
                      <span>
                        <span className="font-medium">{tierLabel(t)}</span>
                        <span className="block text-xs text-ink-mute">{TIER_HINT[t]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {priced && (
                <div className="mt-6 border-t border-forest-900/10 pt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ink-soft">
                      {priced.nights} night{priced.nights === 1 ? "" : "s"}, {travellers === 1 ? "1 person" : `${travellers} people`}
                    </span>
                    <span className="font-display text-3xl tabular-nums">{bdt(priced.total)}</span>
                  </div>
                  <p className="mt-1 text-right text-sm text-ink-mute tabular-nums">
                    about {usd(priced.total)} · {bdt(priced.perPerson)} each
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-ink-mute">
                    A rough estimate, not a quote. Flights and anything you buy on the way are not included.
                    {needsPermit && " One of these districts needs a government permit — we arrange it."}
                  </p>
                  <Link
                    href={bookHref}
                    className="mt-5 block rounded-full bg-forest-900 px-6 py-3 text-center text-paper transition-colors hover:bg-forest-800"
                  >
                    Send this plan to us
                  </Link>
                  <p className="mt-2 text-center text-xs text-ink-mute">
                    We&rsquo;ll come back with a real itinerary and price. Nothing is charged now.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
