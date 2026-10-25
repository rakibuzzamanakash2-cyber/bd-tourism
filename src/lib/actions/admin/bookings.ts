"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@prisma/client";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, simpleEmail } from "@/lib/email";
import { getAdminOrNull } from "@/lib/session";
import {
  ADMIN_CANCELLABLE_STATUSES,
  ADMIN_STATUS_TRANSITIONS,
  formatDateRange,
} from "@/lib/booking-utils";

export type AdminActionResult = { ok: true; message?: string } | { ok: false; error: string };

const bookingUrl = (id: string) => `${env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${id}`;

function refresh(id: string) {
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath(`/dashboard/bookings/${id}`);
}

async function loadBooking(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: { package: { select: { title: true } }, tourist: { select: { name: true, email: true } }, payment: true },
  });
}

// ============================================================
// Change status (confirm, in progress, completed, disputed)
// ============================================================
const statusSchema = z.object({
  bookingId: z.string().min(1),
  to: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "DISPUTED"]),
  notifyTraveler: z.boolean().default(true),
});

export async function adminChangeBookingStatus(input: z.input<typeof statusSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { bookingId, to, notifyTraveler } = parsed.data;

  const booking = await loadBooking(bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (!ADMIN_STATUS_TRANSITIONS[booking.status]?.includes(to)) {
    return { ok: false, error: `Can't move a ${booking.status.toLowerCase()} booking to ${to.toLowerCase()}.` };
  }

  const { count } = await db.booking.updateMany({
    where: { id: bookingId, status: booking.status },
    data: { status: to as BookingStatus },
  });
  if (count === 0) return { ok: false, error: "The booking changed meanwhile. Refresh and try again." };

  await audit({
    actorId: admin.id,
    action: "booking.status",
    targetType: "Booking",
    targetId: bookingId,
    details: { from: booking.status, to },
  });

  if (to === "CONFIRMED" && notifyTraveler) {
    await sendEmail({
      to: booking.tourist.email,
      subject: `Your trip is confirmed — ${booking.bookingCode}`,
      html: simpleEmail("Your trip is confirmed.", [
        `Hi ${booking.tourist.name?.split(/\s+/)[0] ?? "there"}, everything is arranged for ${booking.package?.title ?? "your trip"} (${formatDateRange(booking.startDate, booking.endDate)}).`,
        "About 7 days before you travel, we'll send a full brief with your guide's contact details.",
        `Your booking: ${bookingUrl(booking.id)}`,
      ]),
    });
  }

  refresh(bookingId);
  return { ok: true, message: "Status updated." };
}

// ============================================================
// Record a payment received outside the website (bKash, bank, cash)
// ============================================================
const manualPaymentSchema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(["bkash", "nagad", "bank", "cash", "other"]),
  reference: z.string().trim().max(200).optional(),
});

export async function adminMarkBookingPaid(input: z.input<typeof manualPaymentSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = manualPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { bookingId, method, reference } = parsed.data;

  const booking = await loadBooking(bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.status !== "PAYMENT_PENDING") return { ok: false, error: "Only bookings awaiting payment can be marked as paid." };

  const raw = { method, reference: reference ?? null, recordedBy: admin.email };
  await db.$transaction([
    db.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amountUSD: booking.totalAmountUSD,
        provider: `manual:${method}`,
        status: "SUCCEEDED",
        paidAt: new Date(),
        providerRaw: raw,
      },
      update: { provider: `manual:${method}`, status: "SUCCEEDED", paidAt: new Date(), providerRaw: raw },
    }),
    db.booking.update({ where: { id: bookingId }, data: { status: "PAID" } }),
  ]);

  await audit({ actorId: admin.id, action: "booking.mark_paid", targetType: "Booking", targetId: bookingId, details: raw });
  refresh(bookingId);
  return { ok: true, message: "Payment recorded. The booking is now Paid." };
}

// ============================================================
// Cancel (by admin), with the refund amount to owe
// ============================================================
const cancelSchema = z.object({
  bookingId: z.string().min(1),
  refundUSD: z.number().min(0).max(1_000_000),
  reason: z.string().trim().min(3, "Please give a reason").max(1000),
  notifyTraveler: z.boolean().default(true),
});

export async function adminCancelBooking(input: z.input<typeof cancelSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  const { bookingId, refundUSD, reason, notifyTraveler } = parsed.data;

  const booking = await loadBooking(bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (!(ADMIN_CANCELLABLE_STATUSES as readonly string[]).includes(booking.status)) {
    return { ok: false, error: "This booking can't be cancelled." };
  }
  const paid = booking.payment?.status === "SUCCEEDED";
  const paidAmount = Number(booking.payment?.amountUSD ?? 0);
  if (!paid && refundUSD > 0) return { ok: false, error: "No payment was received, so there is nothing to refund." };
  if (refundUSD > paidAmount) return { ok: false, error: `The refund can't be more than the ${paidAmount.toFixed(2)} USD paid.` };

  const { count } = await db.booking.updateMany({
    where: { id: bookingId, status: booking.status },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason,
      refundAmountUSD: paid ? Math.round(refundUSD * 100) / 100 : null,
    },
  });
  if (count === 0) return { ok: false, error: "The booking changed meanwhile. Refresh and try again." };

  await audit({
    actorId: admin.id,
    action: "booking.cancel",
    targetType: "Booking",
    targetId: bookingId,
    details: { from: booking.status, refundUSD: paid ? refundUSD : null, reason },
  });

  if (notifyTraveler) {
    await sendEmail({
      to: booking.tourist.email,
      subject: `Booking cancelled — ${booking.bookingCode}`,
      html: simpleEmail("Your booking has been cancelled.", [
        `We've had to cancel ${booking.package?.title ?? "your trip"} (${formatDateRange(booking.startDate, booking.endDate)}).`,
        `Reason: ${reason}`,
        paid && refundUSD > 0
          ? `We'll refund $${refundUSD.toFixed(2)} USD within 7–10 working days.`
          : "No payment had been taken.",
        `If you have questions, just reply to this email.`,
      ]),
    });
  }

  refresh(bookingId);
  return { ok: true, message: "Booking cancelled." };
}

// ============================================================
// Record that the refund has been sent
// ============================================================
const refundSchema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(["sslcommerz", "bkash", "nagad", "bank", "cash", "other"]),
  reference: z.string().trim().max(200).optional(),
});

export async function adminMarkRefundPaid(input: z.input<typeof refundSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { bookingId, method, reference } = parsed.data;

  const booking = await loadBooking(bookingId);
  if (!booking?.payment) return { ok: false, error: "Booking or payment not found." };
  const refund = Number(booking.refundAmountUSD ?? 0);
  if (booking.status !== "CANCELLED" || refund <= 0) return { ok: false, error: "No refund is owed on this booking." };
  if (booking.payment.status !== "SUCCEEDED") return { ok: false, error: "This refund was already recorded." };

  const full = refund >= Number(booking.payment.amountUSD) - 0.005;
  const previousRaw = (booking.payment.providerRaw ?? {}) as Record<string, unknown>;
  await db.payment.update({
    where: { id: booking.payment.id },
    data: {
      status: full ? "REFUNDED" : "PARTIAL_REFUND",
      refundedAt: new Date(),
      providerRaw: { ...previousRaw, refund: { amountUSD: refund, method, reference: reference ?? null, recordedBy: admin.email } },
    },
  });

  await audit({
    actorId: admin.id,
    action: "booking.refund_paid",
    targetType: "Booking",
    targetId: bookingId,
    details: { amountUSD: refund, method, reference: reference ?? null },
  });

  await sendEmail({
    to: booking.tourist.email,
    subject: `Refund sent — ${booking.bookingCode}`,
    html: simpleEmail("Your refund is on its way.", [
      `We've sent your refund of $${refund.toFixed(2)} USD for booking ${booking.bookingCode}.`,
      "Depending on your bank or wallet, it can take a few working days to appear.",
    ]),
  });

  refresh(bookingId);
  return { ok: true, message: "Refund recorded and the traveler has been emailed." };
}

// ============================================================
// Private team notes
// ============================================================
const notesSchema = z.object({ bookingId: z.string().min(1), notes: z.string().max(5000) });

export async function adminSaveBookingNotes(input: z.input<typeof notesSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Notes are too long." };

  await db.booking.update({ where: { id: parsed.data.bookingId }, data: { adminNotes: parsed.data.notes.trim() || null } });
  await audit({ actorId: admin.id, action: "booking.notes", targetType: "Booking", targetId: parsed.data.bookingId });
  revalidatePath(`/admin/bookings/${parsed.data.bookingId}`);
  return { ok: true, message: "Notes saved." };
}
