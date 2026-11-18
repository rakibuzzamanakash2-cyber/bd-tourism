import type { CostKind, CostUnit } from "@prisma/client";
import { bdtToUsd } from "@/lib/booking-utils";

export type Rate = {
  kind: CostKind;
  key: string;
  label: string;
  amountBdt: number;
  unit: CostUnit;
  note: string | null;
  /** Null while the number is still a placeholder nobody has checked. */
  verifiedAt: Date | null;
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

/** True once every line an estimate would draw on has been checked. */
export const isVerified = (r: Rate | undefined): r is Rate => Boolean(r && r.verifiedAt !== null);

/** How far through checking the placeholder prices we are. */
export function verificationProgress(rates: Rate[]) {
  const done = rates.filter(isVerified).length;
  return { done, total: rates.length, complete: rates.length > 0 && done === rates.length };
}

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
 * Returns null when the rates it needs are missing *or* still unchecked, so a
 * page can leave the estimate out rather than print a confidently wrong
 * number. Placeholder prices are worse than no price: a traveller budgets off
 * them. Admin screens pass allowUnverified to preview what the numbers will
 * work out to while they are still being entered.
 */
export function perPersonPerDay(
  rates: Rate[],
  tier: DayTier,
  {
    groupSize = 2,
    multiplier = 1,
    allowUnverified = false,
  }: { groupSize?: number; multiplier?: number; allowUnverified?: boolean } = {},
): number | null {
  const t = TIERS[tier];
  const usable = (kind: CostKind, key: string) => {
    const r = pick(rates, kind, key);
    if (!r) return undefined;
    return allowUnverified || isVerified(r) ? r : undefined;
  };

  const lodging = usable("LODGING", t.lodging);
  const meals = usable("MEALS", t.meals);
  const transport = usable("TRANSPORT", t.transport);
  if (!lodging || !meals || !transport) return null;

  // A tier that includes a guide has to price one. Skipping a missing guide
  // would quietly understate the day by the largest single line on it.
  const guide = t.guide ? usable("GUIDE", "standard") : undefined;
  if (t.guide && !guide) return null;

  const people = Math.max(1, groupSize);
  const share = (r: Rate) => (r.unit === "PER_GROUP_PER_DAY" ? r.amountBdt / people : r.amountBdt);

  const total = share(lodging) + share(meals) + share(transport) + (guide ? share(guide) : 0);
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
