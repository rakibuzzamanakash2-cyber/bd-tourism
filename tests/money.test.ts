import { describe, expect, it } from "vitest";
import {
  BDT_PER_USD,
  calculateRefund,
  calculateServiceFee,
  bdtToUsd,
  usdToBdt,
  serviceFeeFromDetails,
  generateBookingCode,
  calculateEndDate,
} from "@/lib/booking-utils";
import { HOMESTAY_BASE_BDT, extraNightRate, stayQuote } from "@/lib/homestay-shared";

const day = 864e5;
const at = (hoursBeforeStart: number) => ({
  startDate: new Date("2026-06-01T00:00:00Z"),
  now: new Date(Date.parse("2026-06-01T00:00:00Z") - hoursBeforeStart * 36e5),
});

describe("refunds", () => {
  const base = { totalUSD: 1000, serviceFeeUSD: 0, paid: true };

  it("gives everything back more than 14 days out", () => {
    const r = calculateRefund({ ...base, ...at(15 * 24) });
    expect(r.tier).toBe("full");
    expect(r.refundUSD).toBe(1000);
  });

  it("gives half back inside 14 days", () => {
    const r = calculateRefund({ ...base, ...at(13 * 24) });
    expect(r.tier).toBe("half");
    expect(r.refundUSD).toBe(500);
  });

  it("gives nothing back inside 48 hours", () => {
    const r = calculateRefund({ ...base, ...at(47) });
    expect(r.tier).toBe("none");
    expect(r.refundUSD).toBe(0);
  });

  // The boundaries are where money disputes happen, so pin them exactly.
  it("treats exactly 14 days as the half tier, not full", () => {
    expect(calculateRefund({ ...base, ...at(14 * 24) }).tier).toBe("half");
  });

  it("treats exactly 48 hours as no refund, not half", () => {
    expect(calculateRefund({ ...base, ...at(48) }).tier).toBe("none");
  });

  it("never refunds the permit fee, even on a full refund", () => {
    const r = calculateRefund({ totalUSD: 1000, serviceFeeUSD: 25, paid: true, ...at(30 * 24) });
    expect(r.refundUSD).toBe(975);
    expect(r.nonRefundableUSD).toBe(25);
  });

  it("halves only the refundable part", () => {
    const r = calculateRefund({ totalUSD: 1000, serviceFeeUSD: 100, paid: true, ...at(5 * 24) });
    expect(r.refundUSD).toBe(450);
  });

  it("never refunds more than was paid when the fee exceeds the total", () => {
    const r = calculateRefund({ totalUSD: 20, serviceFeeUSD: 50, paid: true, ...at(30 * 24) });
    expect(r.refundUSD).toBe(0);
    expect(r.nonRefundableUSD).toBe(20);
  });

  it("refunds nothing on an unpaid booking", () => {
    const r = calculateRefund({ ...base, paid: false, ...at(30 * 24) });
    expect(r.tier).toBe("unpaid");
    expect(r.refundUSD).toBe(0);
  });
});

describe("permit service fee", () => {
  it("charges $10 for one traveller", () => expect(calculateServiceFee(1)).toBe(10));
  it("adds $7.99 per extra traveller", () => expect(calculateServiceFee(3)).toBe(25.98));
  it("charges nothing for nobody", () => expect(calculateServiceFee(0)).toBe(0));
  it("always lands on whole cents", () => {
    // Compare the rounded string, not fee * 100: 17.99 * 100 is
    // 1798.9999999999998 in binary floating point even when the fee is exact.
    for (let n = 1; n <= 20; n++) {
      const fee = calculateServiceFee(n);
      expect(Number(fee.toFixed(2))).toBe(fee);
    }
  });
  it("reads a stored fee back out of a booking's details", () => {
    expect(serviceFeeFromDetails(JSON.stringify({ permitContext: { serviceFeeUSD: 17.99 } }))).toBe(17.99);
  });
  it("treats missing or broken details as no fee", () => {
    expect(serviceFeeFromDetails(null)).toBe(0);
    expect(serviceFeeFromDetails("not json")).toBe(0);
    expect(serviceFeeFromDetails("{}")).toBe(0);
  });
});

describe("currency", () => {
  it("converts both ways consistently", () => {
    expect(usdToBdt(100)).toBe(100 * BDT_PER_USD);
    expect(bdtToUsd(usdToBdt(100))).toBe(100);
  });
  it("charges whole taka", () => {
    expect(Number.isInteger(usdToBdt(99.99))).toBe(true);
  });
});

describe("homestay pricing", () => {
  it("charges the base price for a single night", () => {
    expect(stayQuote([], 1).totalBDT).toBe(HOMESTAY_BASE_BDT);
  });

  it("adds 10% per extra night with no facilities", () => {
    expect(stayQuote([], 2).totalBDT).toBe(1100);
  });

  // The example written into the pricing rules: 5 facilities → 30% a night.
  it("adds 4% per facility on top of the 10%", () => {
    const five = ["private_room", "attached_bathroom", "wifi", "fan", "parking"];
    expect(extraNightRate(five)).toBe(0.3);
    expect(stayQuote(five, 2).totalBDT).toBe(1300);
  });

  it("caps the extra-night rate at 50%", () => {
    const all = ["private_room", "attached_bathroom", "western_toilet", "hot_water", "air_conditioning", "fan", "wifi", "home_cooked_meals", "parking", "english_speaker"];
    expect(extraNightRate(all)).toBe(0.5);
  });

  it("ignores duplicate and unknown facilities", () => {
    expect(extraNightRate(["wifi", "wifi", "not_a_real_facility"])).toBe(extraNightRate(["wifi"]));
  });

  it("gives the host 85% and never more than the total", () => {
    const q = stayQuote(["wifi"], 3);
    expect(q.hostPayoutBDT).toBe(Math.round(q.totalBDT * 0.85));
    expect(q.hostPayoutBDT).toBeLessThan(q.totalBDT);
  });

  it("charges nothing for zero nights", () => {
    expect(stayQuote(["wifi"], 0).totalBDT).toBe(0);
  });
});

describe("booking codes and dates", () => {
  it("makes codes that don't collide in practice", () => {
    const seen = new Set(Array.from({ length: 2000 }, generateBookingCode));
    expect(seen.size).toBe(2000);
  });
  it("counts a 1-day tour as starting and ending the same day", () => {
    const start = new Date("2026-06-01T00:00:00Z");
    expect(calculateEndDate(start, 1).toISOString().slice(0, 10)).toBe("2026-06-01");
  });
  it("counts a 5-day tour as four nights", () => {
    const start = new Date("2026-06-01T00:00:00Z");
    expect(calculateEndDate(start, 5).getTime() - start.getTime()).toBe(4 * day);
  });
});
