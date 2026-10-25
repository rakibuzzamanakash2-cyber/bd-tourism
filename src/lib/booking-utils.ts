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

// ============================================================
// CANCELLATION & REFUNDS
// Policy (shown to tourists on the booking page and in the terms):
//   • more than 14 days before the start date → full refund
//   • 14 days to 48 hours before                → 50% refund
//   • within 48 hours                          → no refund
//   • the permit processing fee is non-refundable once paid, because the
//     permit application starts straight after payment
// ============================================================

/** Unpaid bookings are cancelled automatically after this many hours. */
export const UNPAID_BOOKING_TTL_HOURS = 24;
export const EXPIRED_BOOKING_REASON = "Payment not received within 24 hours";

/** Statuses a tourist can still cancel from. */
export const CANCELLABLE_STATUSES = ["PAYMENT_PENDING", "PAID", "CONFIRMED"] as const;

export type RefundQuote = {
  tier: "unpaid" | "full" | "half" | "none";
  /** Hours from now until the start date (midnight UTC) */
  hoursBeforeStart: number;
  /** What the tourist gets back, in USD */
  refundUSD: number;
  /** Part of the payment that is never refunded (permit fee) */
  nonRefundableUSD: number;
};

export function calculateRefund(input: {
  totalUSD: number;
  serviceFeeUSD: number;
  startDate: Date;
  paid: boolean;
  now?: Date;
}): RefundQuote {
  const now = input.now ?? new Date();
  const hoursBeforeStart = (input.startDate.getTime() - now.getTime()) / 36e5;

  if (!input.paid) {
    return { tier: "unpaid", hoursBeforeStart, refundUSD: 0, nonRefundableUSD: 0 };
  }

  const nonRefundableUSD = Math.min(input.serviceFeeUSD, input.totalUSD);
  const refundableBase = input.totalUSD - nonRefundableUSD;
  const round = (n: number) => Math.round(n * 100) / 100;

  if (hoursBeforeStart > 14 * 24) {
    return { tier: "full", hoursBeforeStart, refundUSD: round(refundableBase), nonRefundableUSD };
  }
  if (hoursBeforeStart > 48) {
    return { tier: "half", hoursBeforeStart, refundUSD: round(refundableBase / 2), nonRefundableUSD };
  }
  return { tier: "none", hoursBeforeStart, refundUSD: 0, nonRefundableUSD };
}

/** The permit fee stored in a booking's details payload (0 if none). */
export function serviceFeeFromDetails(specialRequests: string | null): number {
  if (!specialRequests) return 0;
  try {
    const fee = JSON.parse(specialRequests)?.permitContext?.serviceFeeUSD;
    return typeof fee === "number" ? fee : 0;
  } catch {
    return 0;
  }
}
