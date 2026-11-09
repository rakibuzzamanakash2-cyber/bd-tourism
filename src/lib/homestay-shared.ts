// Homestay rules shared by forms (browser) and server code. No server imports.
import { z } from "zod";
import { FACILITY_OPTIONS, normalizeBdPhone } from "@/lib/applications";
import { bdtToUsd } from "@/lib/booking-utils";
import { dayKey } from "@/lib/guide-shared";
import { isAllowedImageUrl } from "@/lib/image-hosts";

// ---- Pricing: set by DeltaWay, not by the host ----------------------
// A stay costs the base price for the first night. Each extra night adds a
// share of the base: 10%, plus 4% per facility the home offers (max 50%).
// Example: 5 facilities → 30%, so 2 nights = ৳1,000 + ৳300 = ৳1,300.
// The price is for the whole group, meals included.

/** First night, whole group (BDT). */
export const HOMESTAY_BASE_BDT = 1000;
export const EXTRA_NIGHT_START = 0.1;
export const EXTRA_NIGHT_PER_FACILITY = 0.04;
export const EXTRA_NIGHT_MAX = 0.5;
/** DeltaWay's share of what the traveler pays; the host gets the rest. */
export const HOMESTAY_COMMISSION = 0.15;
/** Book at least this many days ahead, so the family can prepare. */
export const MIN_STAY_LEAD_DAYS = 2;
export const MAX_STAY_NIGHTS = 14;
/** How far ahead stays can be booked. */
export const MAX_STAY_DAYS_AHEAD = 365;

/** How many of the listed facilities count towards the price (known ones, once each). */
export const pricedFacilityCount = (facilities: readonly string[]) =>
  new Set(facilities.filter((f) => (FACILITY_OPTIONS as readonly string[]).includes(f))).size;

/** Share of the base price each extra night adds (0.1 – 0.5). */
export const extraNightRate = (facilities: readonly string[]) =>
  Math.min(EXTRA_NIGHT_MAX, Math.round((EXTRA_NIGHT_START + EXTRA_NIGHT_PER_FACILITY * pricedFacilityCount(facilities)) * 100) / 100);

/** What one extra night costs, in BDT (rounded to ৳10). */
export const extraNightBDT = (facilities: readonly string[]) => Math.round((HOMESTAY_BASE_BDT * extraNightRate(facilities)) / 10) * 10;

/** The whole price of a stay: first night + extra nights. */
export function stayQuote(facilities: readonly string[], nights: number) {
  const firstNightBDT = HOMESTAY_BASE_BDT;
  const extra = extraNightBDT(facilities);
  const totalBDT = nights >= 1 ? firstNightBDT + extra * (nights - 1) : 0;
  const hostPayoutBDT = Math.round(totalBDT * (1 - HOMESTAY_COMMISSION));
  return {
    firstNightBDT,
    extraNightBDT: extra,
    extraNightPercent: Math.round(extraNightRate(facilities) * 100),
    totalBDT,
    totalUSD: bdtToUsd(totalBDT),
    hostPayoutBDT,
  };
}

/** Nights between check-in and check-out ("2026-11-03" → "2026-11-05" is 2). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** The nights of a stay, by check-in date of each night. */
export function stayNightKeys(checkIn: Date, checkOut: Date): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate()));
  while (d < checkOut && out.length < 400) {
    out.push(dayKey(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** "Hasina's home" for stays, the tour title for tours. */
export function bookingTitle(b: { package: { title: string } | null; homestay: { name: string } | null }): string {
  return b.homestay?.name ?? b.package?.title ?? "Custom trip";
}

// ============================================================
// Listing form (host or team)
// ============================================================
const photo = z.string().trim().refine(isAllowedImageUrl, "Use an uploaded photo or a Cloudinary / Unsplash / Pexels / Wikimedia link");

export const homestayListingSchema = z.object({
  name: z.string().trim().min(4, "Give it a short name, e.g. “Hasina's home by the hills”").max(80),
  regionId: z.string().min(1, "Pick a region"),
  district: z.string().trim().min(2, "Add the district").max(60),
  area: z.string().trim().min(2, "Add the area or a nearby landmark").max(200),
  address: z.string().trim().max(500).optional().default(""),
  description: z.string().trim().min(40, "Tell travelers a bit more (40+ characters)").max(3000),
  houseRules: z.string().trim().max(1500).optional().default(""),
  rooms: z.coerce.number().int().min(1).max(20),
  maxGuests: z.coerce.number().int().min(1).max(30),
  facilities: z.array(z.enum(FACILITY_OPTIONS)).max(FACILITY_OPTIONS.length),
  languages: z.array(z.string().trim().min(2).max(40)).min(1, "Pick at least one language").max(12),
  photos: z.array(photo).max(12, "Up to 12 photos"),
  isListed: z.boolean().default(true),
});
export type HomestayListingInput = z.input<typeof homestayListingSchema>;

// ============================================================
// Booking a stay
// ============================================================
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

export const stayBookingSchema = z
  .object({
    slug: z.string().min(1).max(100),
    checkIn: ymd,
    checkOut: ymd,
    guests: z.coerce.number().int().min(1, "At least 1 guest").max(30),
    name: z.string().trim().min(2, "Name is too short").max(120),
    email: z.string().trim().email("That email doesn't look right"),
    phone: z.string().trim().min(6, "Phone number is required").max(30),
    // Required only for homestays in permit regions (checked on the server)
    passportNumber: z.string().trim().max(40).optional().default(""),
    nationality: z.string().trim().max(80).optional().default(""),
    notes: z.string().trim().max(2000).optional().default(""),
    agreedToTerms: z.literal(true, { message: "Please agree to the terms" }),
  })
  .superRefine((d, ctx) => {
    const n = nightsBetween(d.checkIn, d.checkOut);
    if (n < 1) ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Check-out must be after check-in" });
    else if (n > MAX_STAY_NIGHTS) ctx.addIssue({ code: "custom", path: ["checkOut"], message: `Stays can be up to ${MAX_STAY_NIGHTS} nights` });
  });
export type StayBookingInput = z.input<typeof stayBookingSchema>;

export { normalizeBdPhone };
