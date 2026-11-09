import "server-only";
import { BDT_PER_USD, serviceFeeFromDetails, usdToBdt } from "@/lib/booking-utils";
import type { PayCurrency } from "@/lib/sslcommerz";

export type Attempt = { currency: PayCurrency; amount: number; at: string };
export type Attempts = Record<string, Attempt>;

/**
 * What a booking costs in each currency. Homestays are priced in taka, so
 * their BDT price is the exact stay total (plus any permit fee converted);
 * tours are priced in dollars and converted at today's rate.
 */
export function payableAmounts(b: { totalAmountUSD: unknown; homestayId: string | null; specialRequests: string | null }) {
  const usd = Number(b.totalAmountUSD);
  let bdt = usdToBdt(usd);
  if (b.homestayId && b.specialRequests) {
    try {
      const stayTotal = JSON.parse(b.specialRequests)?.stay?.totalBDT;
      if (typeof stayTotal === "number" && stayTotal > 0) bdt = stayTotal + usdToBdt(serviceFeeFromDetails(b.specialRequests));
    } catch {
      // keep the converted amount
    }
  }
  return { usd, bdt, rate: BDT_PER_USD };
}

/** The booking code from a transaction id like "BD-2026-ABC123-1731150000000". */
export const bookingCodeFromTranId = (tranId: string) => tranId.replace(/-\d{10,}$/, "");
