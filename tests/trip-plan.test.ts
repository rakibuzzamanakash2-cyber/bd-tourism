import { describe, expect, it } from "vitest";
import {
  MAX_NIGHTS_PER_STOP,
  MAX_STOPS,
  MAX_TOTAL_NIGHTS,
  describePlan,
  formatPlan,
  parsePlan,
  pricePlan,
  totalNights,
} from "@/lib/trip-plan";
import type { Rate } from "@/lib/costs";

describe("reading a plan out of a URL", () => {
  it("reads districts and nights", () => {
    expect(parsePlan("sylhet:3,bandarban:2")).toEqual([
      { slug: "sylhet", nights: 3 },
      { slug: "bandarban", nights: 2 },
    ]);
  });

  it("survives a round trip", () => {
    const stops = [{ slug: "sylhet", nights: 3 }, { slug: "coxs-bazar", nights: 1 }];
    expect(parsePlan(formatPlan(stops))).toEqual(stops);
  });

  it("treats nothing as an empty plan", () => {
    for (const v of [null, undefined, "", "   ", ",,,"]) expect(parsePlan(v)).toEqual([]);
  });

  // The value comes from a URL, so every one of these is someone's input.
  it("drops junk instead of throwing", () => {
    expect(parsePlan("sylhet:abc,:,bandarban:2,:5")).toEqual([{ slug: "bandarban", nights: 2 }]);
  });

  it("refuses a slug that isn't slug-shaped", () => {
    expect(parsePlan("../../etc/passwd:2")).toEqual([]);
    expect(parsePlan("<script>:2")).toEqual([]);
    expect(parsePlan("a:2")).toEqual([]);
  });

  it("ignores a district listed twice", () => {
    expect(parsePlan("sylhet:3,sylhet:5")).toEqual([{ slug: "sylhet", nights: 3 }]);
  });

  it("drops nights below one", () => {
    expect(parsePlan("sylhet:0,bandarban:-4")).toEqual([]);
  });

  it("caps nights in one place", () => {
    expect(parsePlan("sylhet:999")[0].nights).toBe(MAX_NIGHTS_PER_STOP);
  });

  it("stops after the maximum number of districts", () => {
    const many = Array.from({ length: 20 }, (_, i) => `d${i}-x:1`).join(",");
    expect(parsePlan(many)).toHaveLength(MAX_STOPS);
  });

  it("trims a trip that is too long rather than rejecting it", () => {
    const stops = parsePlan("a-one:21,b-two:21,c-three:21");
    expect(totalNights(stops)).toBe(MAX_TOTAL_NIGHTS);
  });

  it("copes with an absurdly long value", () => {
    expect(() => parsePlan("x".repeat(100_000))).not.toThrow();
  });
});

const rates: Rate[] = [
  { kind: "LODGING", key: "budget", label: "Room", amountBdt: 1200, unit: "PER_PERSON_PER_NIGHT", note: null },
  { kind: "LODGING", key: "comfortable", label: "Room", amountBdt: 3000, unit: "PER_PERSON_PER_NIGHT", note: null },
  { kind: "LODGING", key: "fine", label: "Room", amountBdt: 7500, unit: "PER_PERSON_PER_NIGHT", note: null },
  { kind: "MEALS", key: "simple", label: "Food", amountBdt: 600, unit: "PER_PERSON_PER_DAY", note: null },
  { kind: "MEALS", key: "mixed", label: "Food", amountBdt: 1200, unit: "PER_PERSON_PER_DAY", note: null },
  { kind: "GUIDE", key: "standard", label: "Guide", amountBdt: 3500, unit: "PER_GROUP_PER_DAY", note: null },
  { kind: "TRANSPORT", key: "public", label: "Bus", amountBdt: 800, unit: "PER_PERSON_PER_DAY", note: null },
  { kind: "TRANSPORT", key: "car", label: "Car", amountBdt: 5000, unit: "PER_GROUP_PER_DAY", note: null },
];

const districts = [
  { slug: "sylhet", name: "Sylhet", costMultiplier: 1 },
  { slug: "bandarban", name: "Bandarban", costMultiplier: 1.5 },
];

const price = (stops: { slug: string; nights: number }[], o: Partial<Parameters<typeof pricePlan>[3]> = {}) =>
  pricePlan(stops, districts, rates, { tier: "budget", travellers: 2, serviceFeePercent: 0, ...o });

describe("pricing a plan", () => {
  it("charges each night at the district's own rate", () => {
    // budget = room 1200 + food 600 + bus 800 = 2600 a night
    const out = price([{ slug: "sylhet", nights: 3 }])!;
    expect(out.stops[0].perPersonPerNight).toBe(2600);
    expect(out.perPerson).toBe(7800);
  });

  it("applies a district's multiplier", () => {
    const out = price([{ slug: "bandarban", nights: 1 }])!;
    expect(out.stops[0].perPersonPerNight).toBe(3900); // 2600 × 1.5
  });

  it("multiplies the total by the number of travellers", () => {
    const one = price([{ slug: "sylhet", nights: 2 }], { travellers: 1 })!;
    const two = price([{ slug: "sylhet", nights: 2 }], { travellers: 2 })!;
    expect(two.total).toBe(two.perPerson * 2);
    // Two people cost more in total, but less each, since a car is shared.
    expect(two.total).toBeGreaterThan(one.total);
    expect(two.perPerson).toBeLessThanOrEqual(one.perPerson);
  });

  it("adds the service fee", () => {
    const free = price([{ slug: "sylhet", nights: 1 }], { serviceFeePercent: 0 })!;
    const paid = price([{ slug: "sylhet", nights: 1 }], { serviceFeePercent: 15 })!;
    expect(paid.perPerson).toBeGreaterThan(free.perPerson);
  });

  it("adds the stops up", () => {
    const out = price([{ slug: "sylhet", nights: 2 }, { slug: "bandarban", nights: 1 }])!;
    expect(out.nights).toBe(3);
    expect(out.perPerson).toBe(out.stops.reduce((n, s) => n + s.subtotal, 0));
  });

  it("ignores a district we don't have", () => {
    const out = price([{ slug: "sylhet", nights: 1 }, { slug: "atlantis", nights: 4 }])!;
    expect(out.stops).toHaveLength(1);
    expect(out.nights).toBe(1);
  });

  it("says nothing rather than guessing when a rate is missing", () => {
    expect(pricePlan([{ slug: "sylhet", nights: 1 }], districts, rates.filter((r) => r.kind !== "MEALS"), {
      tier: "budget", travellers: 2, serviceFeePercent: 15,
    })).toBeNull();
  });

  it("says nothing for an empty plan", () => {
    expect(price([])).toBeNull();
    expect(price([{ slug: "atlantis", nights: 2 }])).toBeNull();
  });

  it("never divides by zero on a group of none", () => {
    const out = price([{ slug: "sylhet", nights: 1 }], { travellers: 0 })!;
    expect(Number.isFinite(out.total)).toBe(true);
  });

  it("gets dearer as the level rises", () => {
    const amounts = (["budget", "comfortable", "fine"] as const).map((tier) => price([{ slug: "sylhet", nights: 1 }], { tier })!.perPerson);
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
  });
});

describe("describing a plan in words", () => {
  it("reads naturally with one, two and three stops", () => {
    expect(describePlan([{ name: "Sylhet", nights: 1 }])).toBe("Sylhet (1 night)");
    expect(describePlan([{ name: "Sylhet", nights: 3 }, { name: "Bandarban", nights: 2 }]))
      .toBe("Sylhet (3 nights) and Bandarban (2 nights)");
    expect(describePlan([{ name: "A", nights: 1 }, { name: "B", nights: 1 }, { name: "C", nights: 2 }]))
      .toBe("A (1 night), B (1 night) and C (2 nights)");
  });

  it("is empty for an empty plan", () => expect(describePlan([])).toBe(""));
});
