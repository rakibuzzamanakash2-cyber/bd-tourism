// ============================================================
// Booking utilities
// ============================================================

const codeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingCode(): string {
  const year = new Date().getFullYear();
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += codeChars[Math.floor(Math.random() * codeChars.length)];
  }
  return `BD-${year}-${random}`;
}

// Trip dates are calendar dates stored as midnight UTC ("2026-12-04" →
// 2026-12-04T00:00Z). All date maths and formatting therefore use UTC, so a
// visitor in New York and a server in Singapore see the same day.

export function calculateEndDate(startDate: Date, durationDays: number): Date {
  const end = new Date(startDate);
  end.setUTCDate(end.getUTCDate() + durationDays - 1);
  return end;
}

export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatDateRange(
  start: string | Date,
  end: string | Date,
): string {
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export const MIN_BOOKING_LEAD_DAYS = 21;

export function earliestBookableDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + MIN_BOOKING_LEAD_DAYS);
  return d.toISOString().split("T")[0];
}

// ============================================================
// PERMIT FEE CALCULATION
// ============================================================

/**
 * Platform processing fee for handling permit paperwork.
 * $10 for the first person, $7.99 for each additional traveler.
 * Only charged when the tour visits a restricted area.
 */
export function calculateServiceFee(travelerCount: number): number {
  if (travelerCount < 1) return 0;
  const first = 10;
  const additional = 7.99 * (travelerCount - 1);
  return Math.round((first + additional) * 100) / 100;
}

/**
 * Rough BDT → USD conversion. In production, use a live rate.
 * As of early 2026: ~120 BDT per USD.
 */
const BDT_PER_USD = 120;

export function bdtToUsd(bdt: number): number {
  return Math.round((bdt / BDT_PER_USD) * 100) / 100;
}
