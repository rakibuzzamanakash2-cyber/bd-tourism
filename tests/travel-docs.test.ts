import { describe, expect, it } from "vitest";
import {
  LEAD_MIN_AGE,
  PASSPORT_MONTHS_AFTER_TRIP,
  ageOn,
  checkTraveler,
  cleanDocNumber,
  emptyTraveler,
  isNationalId,
  needsVisa,
  parseDate,
  passportMustBeValidUntil,
  storedVisaStatus,
} from "@/lib/travel-docs";

const TRIP = { start: new Date("2026-06-01T00:00:00Z"), end: new Date("2026-06-10T00:00:00Z") };
const TODAY = new Date("2026-01-01T00:00:00Z");

/** A foreign traveller whose documents are all in order. */
const german = () => ({
  ...emptyTraveler(),
  name: "Anna Müller",
  dateOfBirth: "1990-04-12",
  nationality: "Germany",
  passportNumber: "C01X00T47",
  passportExpiry: "2030-01-01",
  visaStatus: "HAVE_VISA",
  visaNumber: "BD123456",
  visaExpiry: "2026-07-01",
});

const check = (t: ReturnType<typeof german>, lead = true) => checkTraveler(t, TRIP, { lead, today: TODAY });

describe("a traveller with documents in order", () => {
  it("passes", () => expect(check(german())).toEqual({}));
});

describe("passports", () => {
  it("must be valid 6 months past the end of the trip", () => {
    expect(passportMustBeValidUntil(TRIP.end).toISOString().slice(0, 10)).toBe("2026-12-10");
    expect(PASSPORT_MONTHS_AFTER_TRIP).toBe(6);
  });

  it("rejects one expiring during the trip", () => {
    expect(check({ ...german(), passportExpiry: "2026-06-05" }).passportExpiry).toBeTruthy();
  });

  // The whole point of the rule: valid for the trip, but not 6 months after.
  it("rejects one valid at the end of the trip but not 6 months later", () => {
    expect(check({ ...german(), passportExpiry: "2026-08-01" }).passportExpiry).toBeTruthy();
  });

  it("accepts one valid exactly 6 months after", () => {
    expect(check({ ...german(), passportExpiry: "2026-12-10" }).passportExpiry).toBeUndefined();
  });

  it("rejects an already expired passport", () => {
    expect(check({ ...german(), passportExpiry: "2025-01-01" }).passportExpiry).toBeTruthy();
  });

  it("rejects a missing or malformed number", () => {
    expect(check({ ...german(), passportNumber: "" }).passportNumber).toBeTruthy();
    expect(check({ ...german(), passportNumber: "AB1" }).passportNumber).toBeTruthy();
    expect(check({ ...german(), passportNumber: "ABCDEFGH" }).passportNumber).toBeTruthy();
  });

  it("ignores spaces and dashes in the number", () => {
    expect(cleanDocNumber(" c01x-00t47 ")).toBe("C01X00T47");
    expect(check({ ...german(), passportNumber: "c01x-00t47" }).passportNumber).toBeUndefined();
  });
});

describe("Bangladeshi travellers", () => {
  const local = () => ({
    ...emptyTraveler(),
    name: "Rahim Uddin",
    dateOfBirth: "1990-04-12",
    nationality: "Bangladesh",
    passportNumber: "1234567890",
  });

  it("need no visa", () => {
    expect(needsVisa("Bangladesh")).toBe(false);
    expect(storedVisaStatus({ nationality: "Bangladesh", visaStatus: "HAVE_VISA" })).toBe("NOT_REQUIRED");
  });

  it("may use a national ID with no expiry date", () => {
    expect(isNationalId("Bangladesh", "1234567890")).toBe(true);
    expect(check(local())).toEqual({});
  });

  it("accept NIDs of 10, 13 and 17 digits only", () => {
    for (const n of ["1234567890", "1234567890123", "12345678901234567"]) {
      expect(isNationalId("Bangladesh", n)).toBe(true);
    }
    for (const n of ["12345", "123456789012"]) {
      expect(isNationalId("Bangladesh", n)).toBe(false);
    }
  });

  it("can't pass a foreign NID off as one", () => {
    expect(isNationalId("Germany", "1234567890")).toBe(false);
  });
});

describe("visas", () => {
  it("are required of foreign travellers", () => {
    expect(needsVisa("Germany")).toBe(true);
    expect(check({ ...german(), visaStatus: "" }).visaStatus).toBeTruthy();
  });

  it("must not expire before the trip ends", () => {
    expect(check({ ...german(), visaExpiry: "2026-06-09" }).visaExpiry).toBeTruthy();
    expect(check({ ...german(), visaExpiry: "2026-06-10" }).visaExpiry).toBeUndefined();
  });

  it("need a number only when the traveller says they hold one", () => {
    expect(check({ ...german(), visaNumber: "" }).visaNumber).toBeTruthy();
    const applying = { ...german(), visaStatus: "APPLYING", visaNumber: "", visaExpiry: "" };
    expect(check(applying).visaNumber).toBeUndefined();
    expect(check(applying).visaExpiry).toBeUndefined();
  });
});

describe("the person booking", () => {
  it("must be 18 or older on the start date", () => {
    expect(LEAD_MIN_AGE).toBe(18);
    const seventeen = { ...german(), dateOfBirth: "2008-07-01" }; // turns 18 after the trip starts
    expect(check(seventeen, true).dateOfBirth).toBeTruthy();
    expect(check(seventeen, false).dateOfBirth).toBeUndefined();
  });

  it("counts as 18 on their birthday", () => {
    expect(ageOn(new Date("2008-06-01T00:00:00Z"), TRIP.start)).toBe(18);
    expect(check({ ...german(), dateOfBirth: "2008-06-01" }, true).dateOfBirth).toBeUndefined();
  });

  it("can't be born in the future", () => {
    expect(check({ ...german(), dateOfBirth: "2027-01-01" }).dateOfBirth).toBeTruthy();
  });
});

describe("names and dates", () => {
  it("rejects a name that is too short or has digits", () => {
    expect(check({ ...german(), name: "A" }).name).toBeTruthy();
    expect(check({ ...german(), name: "Anna 123" }).name).toBeTruthy();
  });

  it("accepts accents, apostrophes and hyphens", () => {
    for (const n of ["Anna Müller", "Seán O'Brien", "Jean-Luc Picard", "Ngô Đình"]) {
      expect(check({ ...german(), name: n }).name).toBeUndefined();
    }
  });

  it("rejects impossible dates instead of rolling them over", () => {
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("not-a-date")).toBeNull();
    expect(parseDate("2026-06-01")).toBeInstanceOf(Date);
  });

  it("rejects an unknown nationality", () => {
    expect(check({ ...german(), nationality: "Wakanda" }).nationality).toBeTruthy();
  });
});
