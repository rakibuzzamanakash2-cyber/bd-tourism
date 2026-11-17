import type { CostKind, CostUnit } from "@prisma/client";
import { bdtToUsd } from "@/lib/booking-utils";

export type Rate = {
  kind: CostKind;
  key: string;
  label: string;
  amountBdt: number;
  unit: CostUnit;
  note: string | null;
};

export const UNIT_LABEL: Record<CostUnit, string> = {
  PER_PERSON_PER_NIGHT: "per person, per night",
  PER_PERSON_PER_DAY: "per person, per day",
  PER_GROUP_PER_DAY: "for the group, per day",
  PER_PERSON: "per person",
};

export const KIND_LABEL: Record<CostKind, string> = {
  LODGING: "Where you sleep",
  MEALS: "Food",
  GUIDE: "Guide",
  TRANSPORT: "Getting around",
  PERMIT: "Permits",
};

/** ৳1,234 */
export const bdt = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;
/** $12 — rounded to whole dollars, since this is only ever an estimate. */
export const usd = (bdtAmount: number) => `$${Math.round(bdtToUsd(bdtAmount)).toLocaleString("en-US")}`;

const pick = (rates: Rate[], kind: CostKind, key: string) => rates.find((r) => r.kind === kind && r.key === key);

export type DayTier = "budget" | "comfortable" | "fine";

const TIERS: Record<DayTier, { label: string; lodging: string; meals: string; transport: string; guide: boolean }> = {
  budget: { label: "Simply", lodging: "budget", meals: "simple", transport: "public", guide: false },
  comfortable: { label: "Comfortably", lodging: "comfortable", meals: "mixed", transport: "car", guide: true },
  fine: { label: "Very well", lodging: "fine", meals: "mixed", transport: "car", guide: true },
};

/**
 * Roughly what one person spends per day in a district, at a given level.
 *
 * Costs charged to the whole group — a guide, a car — are divided by the
 * group size, so a solo traveller correctly sees a higher per-day figure
 * than a pair. The district multiplier covers places that are simply more
 * expensive to run a trip in.
 *
 * Returns null when the rates it needs are missing, so a page can leave the
 * estimate out rather than print a confidently wrong number.
 */
export function perPersonPerDay(
  rates: Rate[],
  tier: DayTier,
  { groupSize = 2, multiplier = 1 }: { groupSize?: number; multiplier?: number } = {},
): number | null {
  const t = TIERS[tier];
  const lodging = pick(rates, "LODGING", t.lodging);
  const meals = pick(rates, "MEALS", t.meals);
  const transport = pick(rates, "TRANSPORT", t.transport);
  if (!lodging || !meals || !transport) return null;

  const people = Math.max(1, groupSize);
  const share = (r: Rate) => (r.unit === "PER_GROUP_PER_DAY" ? r.amountBdt / people : r.amountBdt);

  let total = share(lodging) + share(meals) + share(transport);
  if (t.guide) {
    const guide = pick(rates, "GUIDE", "standard");
    if (guide) total += share(guide);
  }
  return Math.round((total * multiplier) / 50) * 50; // no false precision
}

export const tierLabel = (t: DayTier) => TIERS[t].label;
export const TIER_ORDER: DayTier[] = ["budget", "comfortable", "fine"];

/** What we add on top of supplier cost. */
export function withServiceFee(bdtAmount: number, serviceFeePercent: number) {
  return Math.round(bdtAmount * (1 + serviceFeePercent / 100));
}

/** For anything shown to a traveller: ৳9,718 reads like a quote, ৳9,700 reads like an estimate. */
export const roundForDisplay = (bdtAmount: number) => Math.round(bdtAmount / 100) * 100;
