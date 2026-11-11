// The passport and visa rules for a booking. Pure functions, used by the
// booking form (to show errors as people type) and by the server (which
// never trusts the form).
import { HOME_COUNTRY, isCountry } from "@/lib/countries";

/** A passport must stay valid this long after the trip ends (the usual entry rule). */
export const PASSPORT_MONTHS_AFTER_TRIP = 6;
/** The person making the booking must be an adult. */
export const LEAD_MIN_AGE = 18;

export const VISA_STATUSES = [
  { value: "HAVE_VISA", label: "I already have a visa" },
  { value: "ON_ARRIVAL", label: "I'll get a visa on arrival" },
  { value: "APPLYING", label: "I'm applying before I travel" },
] as const;
export type VisaChoice = (typeof VISA_STATUSES)[number]["value"];
export type VisaStatusValue = VisaChoice | "NOT_REQUIRED";

export const visaStatusLabel = (s: string | null | undefined) =>
  s === "NOT_REQUIRED" ? "No visa needed (Bangladeshi citizen)" : (VISA_STATUSES.find((v) => v.value === s)?.label ?? "Not given");
/** True when we still need to see the visa before the trip. */
export const visaPending = (s: string | null | undefined) => s === "ON_ARRIVAL" || s === "APPLYING";

export type TravelerDocs = {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string;
  passportNumber: string;
  passportExpiry: string; // YYYY-MM-DD
  visaStatus: string; // "" until chosen
  visaNumber: string;
  visaExpiry: string; // YYYY-MM-DD
};

export const emptyTraveler = (): TravelerDocs => ({
  name: "",
  dateOfBirth: "",
  nationality: "",
  passportNumber: "",
  passportExpiry: "",
  visaStatus: "",
  visaNumber: "",
  visaExpiry: "",
});

/** "ab 123-456" → "AB123456" */
export const cleanDocNumber = (v: string) => v.toUpperCase().replace(/[\s-]/g, "");

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** A real calendar date as midnight UTC, or null ("2026-02-31" is not a date). */
export function parseDate(v: string): Date | null {
  if (!ISO.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : d;
}

const addMonths = (d: Date, months: number) => {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
};

/** Whole years between a birth date and another date. */
export function ageOn(birth: Date, on: Date): number {
  let age = on.getUTCFullYear() - birth.getUTCFullYear();
  const m = on.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && on.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

export const needsVisa = (nationality: string) => nationality !== HOME_COUNTRY;

/** Bangladeshi citizens may book with their national ID (10, 13 or 17 digits) instead of a passport. */
export const isNationalId = (nationality: string, docNumber: string) =>
  nationality === HOME_COUNTRY && /^(\d{10}|\d{13}|\d{17})$/.test(cleanDocNumber(docNumber));

/** The earliest expiry date a passport may have for a trip ending on tripEnd. */
export const passportMustBeValidUntil = (tripEnd: Date) => addMonths(tripEnd, PASSPORT_MONTHS_AFTER_TRIP);

const fmt = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);

/**
 * Checks one traveler's documents against the trip dates.
 * Returns field → message for everything that's wrong ({} when all is fine).
 */
export function checkTraveler(
  t: TravelerDocs,
  trip: { start: Date; end: Date },
  opts: { lead: boolean; today?: Date },
): Partial<Record<keyof TravelerDocs, string>> {
  const errors: Partial<Record<keyof TravelerDocs, string>> = {};
  const today = opts.today ?? new Date();

  const name = t.name.trim();
  if (name.length < 2) errors.name = "Enter the full name, as written in the passport.";
  else if (name.length > 120 || !/^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(name)) errors.name = "Use letters only, as written in the passport.";

  const birth = parseDate(t.dateOfBirth);
  if (!birth) errors.dateOfBirth = "Enter the date of birth.";
  else if (birth > today) errors.dateOfBirth = "The date of birth can't be in the future.";
  else if (ageOn(birth, today) > 110) errors.dateOfBirth = "Please check the date of birth.";
  else if (opts.lead && ageOn(birth, trip.start) < LEAD_MIN_AGE) errors.dateOfBirth = `The person booking must be ${LEAD_MIN_AGE} or older.`;

  if (!isCountry(t.nationality)) errors.nationality = "Choose the nationality shown in the passport.";

  const passport = cleanDocNumber(t.passportNumber);
  const local = t.nationality === HOME_COUNTRY;
  const nid = isNationalId(t.nationality, t.passportNumber);
  if (!passport) errors.passportNumber = local ? "Enter the passport or NID number." : "Enter the passport number.";
  else if (!nid && !/^(?=.*\d)[A-Z0-9]{6,12}$/.test(passport)) {
    errors.passportNumber = local ? "Enter a passport number, or an NID of 10, 13 or 17 digits." : "A passport number is 6 to 12 letters and digits.";
  }

  const expiry = parseDate(t.passportExpiry);
  const mustReach = passportMustBeValidUntil(trip.end);
  if (nid) {
    // A national ID has no expiry to check
  } else if (!expiry) errors.passportExpiry = "Enter the passport expiry date.";
  else if (expiry < today) errors.passportExpiry = "This passport has expired.";
  else if (expiry < mustReach) {
    errors.passportExpiry = `The passport must be valid until at least ${fmt(mustReach)} (${PASSPORT_MONTHS_AFTER_TRIP} months after the trip ends).`;
  }

  if (isCountry(t.nationality) && needsVisa(t.nationality)) {
    if (!VISA_STATUSES.some((v) => v.value === t.visaStatus)) errors.visaStatus = "Tell us about the visa for Bangladesh.";
    else if (t.visaStatus === "HAVE_VISA") {
      const visa = cleanDocNumber(t.visaNumber);
      if (!visa) errors.visaNumber = "Enter the visa number.";
      else if (!/^[A-Z0-9]{5,20}$/.test(visa)) errors.visaNumber = "A visa number is 5 to 20 letters and digits.";
      const visaExpiry = parseDate(t.visaExpiry);
      if (!visaExpiry) errors.visaExpiry = "Enter the visa expiry date.";
      else if (visaExpiry < trip.end) errors.visaExpiry = `The visa must be valid until the trip ends (${fmt(trip.end)}).`;
    }
  }
  return errors;
}

/** The visa status to store: Bangladeshi citizens need none. */
export const storedVisaStatus = (t: Pick<TravelerDocs, "nationality" | "visaStatus">): VisaStatusValue =>
  needsVisa(t.nationality) ? (t.visaStatus as VisaChoice) : "NOT_REQUIRED";
