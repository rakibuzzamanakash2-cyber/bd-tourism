import { TIER_ORDER, type DayTier, type Rate, perPersonPerDay, roundForDisplay, withServiceFee } from "@/lib/costs";

/**
 * A trip someone has sketched out: which districts, how many nights in each.
 *
 * It travels in a URL so a plan can be shared, bookmarked, or carried through
 * a sign-in redirect — "sylhet:3,bandarban:2". Keep it readable; people do
 * look at these links.
 */
export type Stop = { slug: string; nights: number };

export const MAX_STOPS = 6;
export const MAX_NIGHTS_PER_STOP = 21;
export const MAX_TOTAL_NIGHTS = 40;
export const MAX_TRAVELLERS = 20;

/** Lenient on the way in: anything malformed is dropped, never thrown. */
export function parsePlan(value: string | null | undefined): Stop[] {
  if (!value) return [];
  const seen = new Set<string>();
  const stops: Stop[] = [];
  for (const part of value.split(",")) {
    const [slug, rawNights] = part.split(":");
    const clean = (slug ?? "").trim().toLowerCase();
    if (!/^[a-z0-9-]{2,60}$/.test(clean) || seen.has(clean)) continue;
    const nights = Number.parseInt(rawNights ?? "", 10);
    if (!Number.isFinite(nights) || nights < 1) continue;
    seen.add(clean);
    stops.push({ slug: clean, nights: Math.min(nights, MAX_NIGHTS_PER_STOP) });
    if (stops.length >= MAX_STOPS) break;
  }
  // Trim the tail rather than reject, so a long plan still mostly survives.
  const out: Stop[] = [];
  let total = 0;
  for (const s of stops) {
    if (total + s.nights > MAX_TOTAL_NIGHTS) {
      const room = MAX_TOTAL_NIGHTS - total;
      if (room > 0) out.push({ ...s, nights: room });
      break;
    }
    out.push(s);
    total += s.nights;
  }
  return out;
}

export const formatPlan = (stops: Stop[]) => stops.map((s) => `${s.slug}:${s.nights}`).join(",");

export const totalNights = (stops: Stop[]) => stops.reduce((n, s) => n + s.nights, 0);

export type PricedStop = { slug: string; name: string; nights: number; perPersonPerNight: number; subtotal: number };

/**
 * What the sketched trip costs, per district and in total.
 *
 * Districts the planner doesn't recognise are dropped. Returns null when the
 * cost rates it needs are missing, so the page can stay quiet rather than
 * show a total built on nothing.
 */
export function pricePlan(
  stops: Stop[],
  districts: { slug: string; name: string; costMultiplier: number }[],
  rates: Rate[],
  opts: { tier: DayTier; travellers: number; serviceFeePercent: number },
): { stops: PricedStop[]; nights: number; perPerson: number; total: number } | null {
  const travellers = Math.max(1, Math.min(MAX_TRAVELLERS, Math.floor(opts.travellers) || 1));
  const bySlug = new Map(districts.map((d) => [d.slug, d]));
  const priced: PricedStop[] = [];

  for (const stop of stops) {
    const d = bySlug.get(stop.slug);
    if (!d) continue;
    const base = perPersonPerDay(rates, opts.tier, { groupSize: travellers, multiplier: d.costMultiplier });
    if (base === null) return null;
    const perNight = withServiceFee(base, opts.serviceFeePercent);
    priced.push({
      slug: d.slug,
      name: d.name,
      nights: stop.nights,
      perPersonPerNight: roundForDisplay(perNight),
      subtotal: roundForDisplay(perNight * stop.nights),
    });
  }

  if (priced.length === 0) return null;
  const perPerson = priced.reduce((n, s) => n + s.subtotal, 0);
  return {
    stops: priced,
    nights: priced.reduce((n, s) => n + s.nights, 0),
    perPerson,
    total: perPerson * travellers,
  };
}

/** "Sylhet (3 nights) and Bandarban (2 nights)" — for the booking title. */
export function describePlan(stops: { name: string; nights: number }[]): string {
  const parts = stops.map((s) => `${s.name} (${s.nights} night${s.nights === 1 ? "" : "s"})`);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export const TIERS = TIER_ORDER;
