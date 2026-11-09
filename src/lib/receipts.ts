import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { formatDateRange, serviceFeeFromDetails } from "@/lib/booking-utils";
import { paymentMethod } from "@/lib/admin-format";
import { bookingTitle, stayNightKeys } from "@/lib/homestay-shared";
import { buildReceiptPdf } from "@/lib/receipt-pdf";
import { site } from "@/lib/site";
import { paymentMode } from "@/lib/sslcommerz";

export const PAID_PAYMENT = ["SUCCEEDED", "REFUNDED", "PARTIAL_REFUND"] as const;

/** The PDF receipt for a paid booking, or null if there's nothing to receipt yet. */
export async function receiptForBooking(bookingId: string): Promise<{ filename: string; pdf: Uint8Array } | null> {
  const b = await db.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, package: { select: { title: true } }, homestay: { select: { name: true } }, tourist: { select: { name: true, email: true } } },
  });
  const p = b?.payment;
  if (!b || !p || !(PAID_PAYMENT as readonly string[]).includes(p.status) || !p.paidAt) return null;

  const total = Number(b.totalAmountUSD);
  const fee = serviceFeeFromDetails(b.specialRequests);
  const nights = b.homestay ? stayNightKeys(b.startDate, b.endDate).length : 0;
  const lines = [
    { label: b.homestay ? `Homestay, ${nights} ${nights === 1 ? "night" : "nights"}` : `Tour, ${b.travelerCount} ${b.travelerCount === 1 ? "traveler" : "travelers"}`, usd: Math.round((total - fee) * 100) / 100 },
    ...(fee > 0 ? [{ label: "Permit processing fee", usd: fee }] : []),
  ];
  let contactName = b.tourist.name ?? "Traveler";
  try {
    contactName = JSON.parse(b.specialRequests ?? "{}")?.primaryContact?.name || contactName;
  } catch {
    // keep the account name
  }
  const refundUSD = Number(b.refundAmountUSD ?? 0);
  const pdf = await buildReceiptPdf({
    receiptNo: `R-${b.bookingCode}`,
    paidAt: p.paidAt,
    traveler: { name: contactName, email: b.tourist.email },
    booking: {
      code: b.bookingCode,
      title: bookingTitle(b),
      kind: b.homestay ? "Homestay" : "Tour",
      dates: formatDateRange(b.startDate, b.endDate),
      people: `${b.travelerCount} ${b.homestay ? (b.travelerCount === 1 ? "guest" : "guests") : b.travelerCount === 1 ? "traveler" : "travelers"}`,
    },
    lines,
    totalUSD: total,
    paid: {
      currency: p.currency === "BDT" ? "BDT" : "USD",
      amount: p.currency === "BDT" && p.amountBDT ? Number(p.amountBDT) : Number(p.amountUSD),
      method: [paymentMethod(p.provider), p.method].filter(Boolean).join(", "),
      reference: p.providerTxnId,
    },
    refund: refundUSD > 0 ? { usd: refundUSD, bdt: p.refundAmountBDT ? Number(p.refundAmountBDT) : null, at: p.refundedAt } : null,
    testMode: p.provider === "sslcommerz" && paymentMode() === "sandbox",
    site: { name: site.name, url: env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, ""), email: site.email, whatsapp: site.whatsappDisplay },
  });
  return { filename: `DeltaWay-receipt-${b.bookingCode}.pdf`, pdf };
}
