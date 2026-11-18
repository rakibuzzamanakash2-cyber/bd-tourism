import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TIER_ORDER,
  perPersonPerDay,
  roundForDisplay,
  verificationProgress,
  withServiceFee,
  type Rate,
} from "@/lib/costs";
import { DHAKA, distanceKm, roughKm } from "@/lib/geo";
import { takesPaymentNow } from "@/lib/launch-mode";

// Every fixture price counts as checked; the unchecked case is tested on its own.
const CHECKED = new Date("2026-01-01T00:00:00.000Z");

const rates: Rate[] = [
  { kind: "LODGING", key: "budget", label: "Simple room", amountBdt: 1200, unit: "PER_PERSON_PER_NIGHT", note: null, verifiedAt: CHECKED },
  { kind: "LODGING", key: "comfortable", label: "Comfortable", amountBdt: 3000, unit: "PER_PERSON_PER_NIGHT", note: null, verifiedAt: CHECKED },
  { kind: "LODGING", key: "fine", label: "Best", amountBdt: 7500, unit: "PER_PERSON_PER_NIGHT", note: null, verifiedAt: CHECKED },
  { kind: "MEALS", key: "simple", label: "Local", amountBdt: 600, unit: "PER_PERSON_PER_DAY", note: null, verifiedAt: CHECKED },
  { kind: "MEALS", key: "mixed", label: "Mixed", amountBdt: 1200, unit: "PER_PERSON_PER_DAY", note: null, verifiedAt: CHECKED },
  { kind: "GUIDE", key: "standard", label: "Guide", amountBdt: 3500, unit: "PER_GROUP_PER_DAY", note: null, verifiedAt: CHECKED },
  { kind: "TRANSPORT", key: "public", label: "Bus", amountBdt: 800, unit: "PER_PERSON_PER_DAY", note: null, verifiedAt: CHECKED },
  { kind: "TRANSPORT", key: "car", label: "Car", amountBdt: 5000, unit: "PER_GROUP_PER_DAY", note: null, verifiedAt: CHECKED },
];

describe("what a day costs", () => {
  it("adds up the parts for the simplest level", () => {
    // room 1200 + food 600 + bus 800, none of them shared
    expect(perPersonPerDay(rates, "budget", { groupSize: 2 })).toBe(2600);
  });

  it("splits the guide and the car across the group", () => {
    // room 3000 + food 1200 + car 5000/2 + guide 3500/2
    expect(perPersonPerDay(rates, "comfortable", { groupSize: 2 })).toBe(8450);
  });

  it("costs a solo traveller more, because nothing is shared", () => {
    const alone = perPersonPerDay(rates, "comfortable", { groupSize: 1 })!;
    const pair = perPersonPerDay(rates, "comfortable", { groupSize: 2 })!;
    expect(alone).toBeGreaterThan(pair);
  });

  it("treats a group of zero as one person rather than dividing by zero", () => {
    const n = perPersonPerDay(rates, "comfortable", { groupSize: 0 });
    expect(Number.isFinite(n)).toBe(true);
    expect(n).toBe(perPersonPerDay(rates, "comfortable", { groupSize: 1 }));
  });

  it("gets dearer as the level rises", () => {
    const amounts = TIER_ORDER.map((t) => perPersonPerDay(rates, t, { groupSize: 2 })!);
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
  });

  it("scales with a district multiplier", () => {
    const plain = perPersonPerDay(rates, "budget", { groupSize: 2 })!;
    expect(perPersonPerDay(rates, "budget", { groupSize: 2, multiplier: 1.5 })).toBe(roundTo50(plain * 1.5));
  });

  // Showing a precise-looking number for a guess invites arguments later.
  it("says nothing rather than guessing when a rate is missing", () => {
    const missing = rates.filter((r) => r.key !== "car");
    expect(perPersonPerDay(missing, "comfortable", { groupSize: 2 })).toBeNull();
  });

  // A placeholder price is worse than no price: people budget off these.
  it("shows nothing publicly while a price it needs is unchecked", () => {
    const unchecked = rates.map((r) => (r.key === "car" ? { ...r, verifiedAt: null } : r));
    expect(perPersonPerDay(unchecked, "comfortable", { groupSize: 2 })).toBeNull();
  });

  it("still works it out for admin, who asked to see the placeholders", () => {
    const unchecked = rates.map((r) => ({ ...r, verifiedAt: null }));
    expect(perPersonPerDay(unchecked, "comfortable", { groupSize: 2, allowUnverified: true })).toBe(
      perPersonPerDay(rates, "comfortable", { groupSize: 2 }),
    );
  });

  it("does not quietly leave the guide out of a level that includes one", () => {
    // Skipping a missing guide would understate the day by the biggest line on it.
    const noGuide = rates.filter((r) => r.kind !== "GUIDE");
    expect(perPersonPerDay(noGuide, "comfortable", { groupSize: 2 })).toBeNull();
    expect(perPersonPerDay(noGuide, "fine", { groupSize: 2 })).toBeNull();
    // The simplest level never had a guide, so it is unaffected.
    expect(perPersonPerDay(noGuide, "budget", { groupSize: 2 })).toBe(2600);
  });

  it("will not price a guided level from an unchecked guide rate", () => {
    const unchecked = rates.map((r) => (r.kind === "GUIDE" ? { ...r, verifiedAt: null } : r));
    expect(perPersonPerDay(unchecked, "comfortable", { groupSize: 2 })).toBeNull();
  });

  it("counts how far through checking the prices we are", () => {
    expect(verificationProgress(rates)).toEqual({ done: 8, total: 8, complete: true });

    const half = rates.map((r, i) => (i < 3 ? { ...r, verifiedAt: null } : r));
    expect(verificationProgress(half)).toEqual({ done: 5, total: 8, complete: false });

    // Nothing to check is not the same as everything checked.
    expect(verificationProgress([])).toEqual({ done: 0, total: 0, complete: false });
  });

  it("adds the service fee on top", () => {
    expect(withServiceFee(1000, 15)).toBe(1150);
    expect(withServiceFee(1000, 0)).toBe(1000);
  });

  it("rounds displayed figures so they read as estimates", () => {
    expect(roundForDisplay(9718)).toBe(9700);
    expect(roundForDisplay(14892)).toBe(14900);
  });
});

const roundTo50 = (n: number) => Math.round(n / 50) * 50;

describe("distance from Dhaka", () => {
  it("is zero at Dhaka itself", () => expect(distanceKm(DHAKA, DHAKA)).toBe(0));

  it("is about 240 km to Cox's Bazar", () => {
    const d = distanceKm(DHAKA, { latitude: 21.4272, longitude: 92.0058 });
    expect(d).toBeGreaterThan(280);
    expect(d).toBeLessThan(320);
  });

  it("rounds without pretending to be precise", () => {
    expect(roughKm(312.4)).toBe(310);
    expect(roughKm(47)).toBe(45);
  });
});

describe("whether the site charges cards", () => {
  beforeEach(() => vi.resetModules());

  it("only counts the explicit payments setting", () => {
    expect(takesPaymentNow("payments")).toBe(true);
    expect(takesPaymentNow("requests")).toBe(false);
  });

  // The important property: nothing can start charging people by accident.
  it("falls back to requests when the setting is missing", async () => {
    vi.doMock("@/lib/db", () => ({ db: { setting: { findUnique: async () => null } } }));
    const { readLaunchMode } = await import("@/lib/launch-mode");
    expect(await readLaunchMode()).toBe("requests");
  });

  it("falls back to requests when the database is unreachable", async () => {
    vi.doMock("@/lib/db", () => ({ db: { setting: { findUnique: async () => { throw new Error("down"); } } } }));
    const { readLaunchMode } = await import("@/lib/launch-mode");
    expect(await readLaunchMode()).toBe("requests");
  });

  it("falls back to requests on an unrecognised value", async () => {
    vi.doMock("@/lib/db", () => ({ db: { setting: { findUnique: async () => ({ value: "yes-please" }) } } }));
    const { readLaunchMode } = await import("@/lib/launch-mode");
    expect(await readLaunchMode()).toBe("requests");
  });

  it("charges only when the value is exactly 'payments'", async () => {
    vi.doMock("@/lib/db", () => ({ db: { setting: { findUnique: async () => ({ value: "payments" }) } } }));
    const { readLaunchMode } = await import("@/lib/launch-mode");
    expect(await readLaunchMode()).toBe("payments");
  });
});
