import "server-only";
import type { Homestay, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, simpleEmail } from "@/lib/email";
import { formatDateRange, UNPAID_BOOKING_TTL_HOURS } from "@/lib/booking-utils";
import { bdt, dayKey } from "@/lib/guide-shared";
import { stayNightKeys } from "@/lib/homestay-shared";

export const publicHomestayWhere: Prisma.HomestayWhereInput = { isActive: true, isListed: true, host: { role: "HOST" } };

/** Booking statuses that hold a homestay's nights. */
export const STAY_HOLDING_STATUSES = ["PAYMENT_PENDING", "PAID", "CONFIRMED", "IN_PROGRESS", "DISPUTED"] as const;

/** Bookings that currently hold nights (an unpaid booking holds them until it expires). */
export const holdingBookingWhere = (): Prisma.BookingWhereInput => ({
  status: { in: [...STAY_HOLDING_STATUSES] },
  NOT: { status: "PAYMENT_PENDING", createdAt: { lt: new Date(Date.now() - UNPAID_BOOKING_TTL_HOURS * 36e5) } },
});

// ============================================================
// Creating the listing
// ============================================================
function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 50) || "homestay"
  );
}

async function uniqueSlug(base: string) {
  const root = slugify(base);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    if (!(await db.homestay.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/**
 * Make the homestay listing for an approved host, from their application.
 * Does nothing if they already have one. Returns null without an application.
 */
export async function createHomestayFromApplication(userId: string): Promise<Homestay | null> {
  const existing = await db.homestay.findUnique({ where: { hostId: userId } });
  if (existing) return existing;
  const app = await db.partnerApplication.findUnique({ where: { userId_kind: { userId, kind: "HOST" } } });
  if (!app) return null;
  const d = (app.details ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  const region =
    (await db.region.findFirst({ where: { id: { in: app.regionIds } }, select: { id: true } })) ??
    (await db.region.findFirst({ select: { id: true }, orderBy: { name: "asc" } }));
  if (!region) return null;
  const first = app.fullName.split(/\s+/)[0];
  const district = str("district") || "Bangladesh";
  const name = `${first}'s home in ${district}`;
  return db.homestay.create({
    data: {
      hostId: userId,
      slug: await uniqueSlug(name),
      name,
      regionId: region.id,
      district,
      area: str("area") || district,
      description: str("family") || `A family home in ${district}.`,
      houseRules: str("houseRules") || null,
      rooms: Number(d.rooms) || 1,
      maxGuests: Number(d.maxGuests) || 2,
      facilities: Array.isArray(d.facilities) ? (d.facilities as string[]) : [],
      languages: Array.isArray(d.languages) ? (d.languages as string[]) : [],
      photos: app.homePhotos,
      phone: app.phone,
      language: app.language === "en" ? "en" : "bn",
    },
  });
}

// ============================================================
// Availability
// ============================================================
/** Nights (by check-in date) that are closed or taken between two dates. */
export async function homestayTakenNights(homestayId: string, from: Date, to: Date, excludeBookingId?: string) {
  const [blocked, bookings] = await Promise.all([
    db.homestayBlockedDate.findMany({ where: { homestayId, date: { gte: new Date(dayKey(from)), lt: new Date(dayKey(to)) } }, select: { date: true } }),
    db.booking.findMany({
      where: {
        homestayId,
        ...holdingBookingWhere(),
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        startDate: { lt: to },
        endDate: { gt: from },
      },
      select: { startDate: true, endDate: true },
    }),
  ]);
  return {
    blocked: blocked.map((b) => dayKey(b.date)),
    booked: bookings.flatMap((b) => stayNightKeys(b.startDate, b.endDate)),
  };
}

// ============================================================
// Emails to the host (in their language)
// ============================================================
type StayInfo = { name: string; dates: string; nights: number; guests: number; payoutBDT: number; guestName?: string };

const HOST_EMAIL = {
  booked: {
    en: (s: StayInfo) => ({
      subject: `New stay booked: ${s.dates}`,
      heading: "You have guests coming!",
      lines: [`${s.guests} ${s.guests === 1 ? "guest" : "guests"}${s.guestName ? ` (${s.guestName})` : ""}, ${s.nights} ${s.nights === 1 ? "night" : "nights"}: ${s.dates}.`, `You'll be paid ${bdt(s.payoutBDT)} after the stay.`, "Their details and arrival notes are in your dashboard. If something comes up and you can't host them, call us straight away."],
      cta: "See the booking",
    }),
    bn: (s: StayInfo) => ({
      subject: `নতুন বুকিং: ${s.dates}`,
      heading: "আপনার বাড়িতে অতিথি আসছেন!",
      lines: [`${s.guests} জন অতিথি${s.guestName ? ` (${s.guestName})` : ""}, ${s.nights} রাত: ${s.dates}।`, `থাকা শেষ হলে আপনি ${bdt(s.payoutBDT)} পাবেন।`, "তাঁদের তথ্য আর পৌঁছানোর বিস্তারিত আপনার ড্যাশবোর্ডে আছে। কোনো কারণে রাখতে না পারলে সঙ্গে সঙ্গে আমাদের ফোন করুন।"],
      cta: "বুকিং দেখুন",
    }),
  },
  cancelled: {
    en: (s: StayInfo) => ({
      subject: `Stay cancelled: ${s.dates}`,
      heading: "A stay has been cancelled",
      lines: [`The booking for ${s.dates} (${s.guests} ${s.guests === 1 ? "guest" : "guests"}) was cancelled. Those nights are free again.`],
      cta: "Open my homestay",
    }),
    bn: (s: StayInfo) => ({
      subject: `বুকিং বাতিল: ${s.dates}`,
      heading: "একটি বুকিং বাতিল হয়েছে",
      lines: [`${s.dates} (${s.guests} জন অতিথি) এর বুকিংটি বাতিল হয়েছে। ওই রাতগুলো আবার খালি।`],
      cta: "আমার হোমস্টে দেখুন",
    }),
  },
  reminder: {
    en: (s: StayInfo) => ({
      subject: `Guests arrive soon: ${s.dates}`,
      heading: "Your guests arrive in two days",
      lines: [`${s.guests} ${s.guests === 1 ? "guest" : "guests"}${s.guestName ? ` (${s.guestName})` : ""}: ${s.dates}.`, "Check their arrival notes in your dashboard, and message them on WhatsApp if anything is unclear."],
      cta: "See the booking",
    }),
    bn: (s: StayInfo) => ({
      subject: `অতিথি আসছেন: ${s.dates}`,
      heading: "দুই দিন পর আপনার অতিথি আসছেন",
      lines: [`${s.guests} জন অতিথি${s.guestName ? ` (${s.guestName})` : ""}: ${s.dates}।`, "ড্যাশবোর্ডে তাঁদের পৌঁছানোর বিস্তারিত দেখে নিন, কিছু অস্পষ্ট হলে হোয়াটসঅ্যাপে মেসেজ দিন।"],
      cta: "বুকিং দেখুন",
    }),
  },
  paid: {
    en: (s: StayInfo & { reference?: string }) => ({
      subject: `Payment sent: ${bdt(s.payoutBDT)}`,
      heading: "We've sent your payment",
      lines: [`${bdt(s.payoutBDT)} for the stay on ${s.dates}.`, ...(s.reference ? [`Reference: ${s.reference}`] : []), "Thank you for welcoming our travelers."],
      cta: "See my earnings",
    }),
    bn: (s: StayInfo & { reference?: string }) => ({
      subject: `পেমেন্ট পাঠানো হয়েছে: ${bdt(s.payoutBDT)}`,
      heading: "আপনার পেমেন্ট পাঠানো হয়েছে",
      lines: [`${s.dates} এর থাকার জন্য ${bdt(s.payoutBDT)}।`, ...(s.reference ? [`রেফারেন্স: ${s.reference}`] : []), "আমাদের পর্যটকদের আতিথেয়তার জন্য ধন্যবাদ।"],
      cta: "আমার আয় দেখুন",
    }),
  },
} as const;

const stayInclude = {
  homestay: { include: { host: { select: { email: true } } } },
} satisfies Prisma.BookingInclude;

function stayInfo(b: { startDate: Date; endDate: Date; travelerCount: number; hostPayoutBDT: number | null; specialRequests: string | null; homestay: { name: string } | null }): StayInfo {
  let guestName: string | undefined;
  try {
    guestName = b.specialRequests ? JSON.parse(b.specialRequests)?.primaryContact?.name : undefined;
  } catch {
    guestName = undefined;
  }
  return {
    name: b.homestay?.name ?? "",
    dates: formatDateRange(b.startDate, b.endDate),
    nights: stayNightKeys(b.startDate, b.endDate).length,
    guests: b.travelerCount,
    payoutBDT: b.hostPayoutBDT ?? 0,
    guestName,
  };
}

export async function emailHost(which: keyof typeof HOST_EMAIL, bookingId: string, extra?: { reference?: string }) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: stayInclude });
  if (!b?.homestay) return;
  const lang = b.homestay.language === "en" ? "en" : "bn";
  const e = HOST_EMAIL[which][lang]({ ...stayInfo(b), ...extra });
  await sendEmail({
    to: b.homestay.host.email,
    subject: `${e.subject} — DeltaWay`,
    html: simpleEmail(e.heading, e.lines, { label: e.cta, url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/host` }),
  });
}

/**
 * Call when a booking becomes paid. For stays: marks the host payout as owed
 * and tells the host. Runs once per booking however often it's called.
 */
export async function onStayPaid(bookingId: string) {
  const { count } = await db.booking.updateMany({
    where: { id: bookingId, homestayId: { not: null }, hostPayoutStatus: null },
    data: { hostPayoutStatus: "UNPAID" },
  });
  if (count) await emailHost("booked", bookingId);
}

/** Call when a booking is cancelled. Tells the host if the stay had been paid. */
export async function onStayCancelled(bookingId: string) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, select: { homestayId: true, hostPayoutStatus: true } });
  if (!b?.homestayId || !b.hostPayoutStatus) return;
  // Nothing is owed for a cancelled stay
  if (b.hostPayoutStatus === "UNPAID") await db.booking.update({ where: { id: bookingId }, data: { hostPayoutStatus: null } });
  await emailHost("cancelled", bookingId);
}

/** Remind hosts two days before guests arrive. Once per stay. */
export async function remindHostsOfArrivals(now = new Date()): Promise<number> {
  const inTwoDays = new Date(dayKey(now));
  inTwoDays.setUTCDate(inTwoDays.getUTCDate() + 2);
  const soon = await db.booking.findMany({
    where: { homestayId: { not: null }, status: { in: ["PAID", "CONFIRMED"] }, hostReminderSentAt: null, startDate: { gte: new Date(dayKey(now)), lte: inTwoDays } },
    select: { id: true },
    take: 200,
  });
  let n = 0;
  for (const b of soon) {
    const { count } = await db.booking.updateMany({ where: { id: b.id, hostReminderSentAt: null }, data: { hostReminderSentAt: now } });
    if (!count) continue;
    await emailHost("reminder", b.id);
    n++;
  }
  return n;
}
