import { Banknote, BusFront, CalendarRange, FileCheck2, ShieldAlert, Signal, BedDouble, MapPin } from "lucide-react";
import { DHAKA, distanceKm, roughKm } from "@/lib/geo";
import { TIER_ORDER, type Rate, bdt, perPersonPerDay, roundForDisplay, tierLabel, usd, withServiceFee } from "@/lib/costs";

type District = {
  name: string;
  latitude: number;
  longitude: number;
  permitRequired: boolean;
  gettingThere: string | null;
  travelTime: string | null;
  bestMonths: string | null;
  whereToStay: string | null;
  moneyNotes: string | null;
  connectivity: string | null;
  safetyNotes: string | null;
  permitNote: string | null;
  costMultiplier: number;
};

type Costs = { rates: Rate[]; serviceFeePercent: number; estimateGroupSize: number };

/**
 * The practical half of a district page: what someone needs in order to
 * actually go. Rows with nothing written are left out, so a district we
 * haven't documented yet shows a short panel rather than a row of blanks.
 */
export function PlanYourVisit({ d, costs }: { d: District; costs?: Costs }) {
  const km = roughKm(distanceKm(DHAKA, d));
  const rows: { icon: typeof BusFront; label: string; value: string }[] = [
    { icon: MapPin, label: "From Dhaka", value: `about ${km} km in a straight line` },
    ...(d.travelTime ? [{ icon: BusFront, label: "Getting here", value: d.travelTime }] : []),
    ...(d.bestMonths ? [{ icon: CalendarRange, label: "Best months", value: d.bestMonths }] : []),
    ...(d.whereToStay ? [{ icon: BedDouble, label: "Where to stay", value: d.whereToStay }] : []),
    ...(d.moneyNotes ? [{ icon: Banknote, label: "Money", value: d.moneyNotes }] : []),
    ...(d.connectivity ? [{ icon: Signal, label: "Phone and internet", value: d.connectivity }] : []),
  ];

  return (
    <section className="border-t border-forest-900/10 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <p className="eyebrow text-forest-700">Before you go</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">Planning a visit to {d.name}.</h2>

        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[auto_1fr] gap-x-3">
              <r.icon className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden="true" />
              <dt className="text-xs uppercase tracking-wider text-ink-mute">{r.label}</dt>
              <dd className="col-start-2 mt-1 leading-relaxed">{r.value}</dd>
            </div>
          ))}
        </dl>

        {costs && <DayCost d={d} costs={costs} />}

        {d.gettingThere && (
          <div className="mt-10 max-w-2xl">
            <h3 className="font-display text-2xl">How to get here</h3>
            <p className="mt-3 leading-relaxed text-ink-soft">{d.gettingThere}</p>
          </div>
        )}

        {(d.permitRequired || d.safetyNotes) && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {d.permitRequired && d.permitNote && (
              <div className="rounded-lg border border-clay-700/25 bg-clay-700/5 p-5">
                <p className="flex items-center gap-2 font-medium">
                  <FileCheck2 className="size-5 text-clay-700" aria-hidden="true" />
                  Permit needed
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.permitNote}</p>
              </div>
            )}
            {d.safetyNotes && (
              <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-5">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldAlert className="size-5 text-forest-700" aria-hidden="true" />
                  Worth knowing
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.safetyNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Roughly what a day here costs a traveller.
 *
 * Deliberately vague: rounded to the nearest ৳50, described as "around",
 * and left out entirely if the rates it needs are missing. People plan
 * budgets off this, so an honest range beats a precise-looking guess.
 */
function DayCost({ d, costs }: { d: District; costs: Costs }) {
  const rows = TIER_ORDER.map((tier) => {
    const base = perPersonPerDay(costs.rates, tier, {
      groupSize: costs.estimateGroupSize,
      multiplier: d.costMultiplier,
    });
    return base === null ? null : { tier, amount: roundForDisplay(withServiceFee(base, costs.serviceFeePercent)) };
  }).filter((r): r is { tier: (typeof TIER_ORDER)[number]; amount: number } => r !== null);

  if (rows.length === 0) return null;

  return (
    <div className="mt-10 max-w-2xl">
      <h3 className="font-display text-2xl">Roughly what a day costs</h3>
      <p className="mt-2 text-sm text-ink-mute">
        Per person, per day, travelling as a group of {costs.estimateGroupSize}. Everything in — where you sleep, food,
        getting around{rows.length > 1 ? ", and a guide at the higher levels" : ""}. Travelling alone costs more, since a
        guide and a car are shared.
      </p>
      <dl className="mt-4 divide-y divide-forest-900/10 border-y border-forest-900/10">
        {rows.map((r) => (
          <div key={r.tier} className="flex items-baseline justify-between gap-4 py-3">
            <dt>{tierLabel(r.tier)}</dt>
            <dd className="tabular-nums">
              around {bdt(r.amount)} <span className="text-ink-mute">({usd(r.amount)})</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-ink-mute">
        An estimate, not a quote. Tell us your dates and we&rsquo;ll price the actual trip.
      </p>
    </div>
  );
}
