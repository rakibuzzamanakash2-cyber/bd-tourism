import { Banknote, BusFront, CalendarRange, FileCheck2, ShieldAlert, Signal, BedDouble, MapPin } from "lucide-react";
import { DHAKA, distanceKm, roughKm } from "@/lib/geo";

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
};

/**
 * The practical half of a district page: what someone needs in order to
 * actually go. Rows with nothing written are left out, so a district we
 * haven't documented yet shows a short panel rather than a row of blanks.
 */
export function PlanYourVisit({ d }: { d: District }) {
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
