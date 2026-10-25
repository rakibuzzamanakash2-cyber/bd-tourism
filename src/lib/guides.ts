import "server-only";
import type { GuideProfile, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { notifyTeam, sendEmail, simpleEmail } from "@/lib/email";
import { formatDateRange } from "@/lib/booking-utils";
import { bdt, dayKey, daysBetween } from "@/lib/guide-shared";
import { whatsappTo } from "@/lib/invites";

// ============================================================
// Profiles
// ============================================================
function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 40) || "guide"
  );
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    if (!(await db.guideProfile.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Make the public profile for an approved guide, from their application.
 * Does nothing if they already have one. Returns the profile, or null if
 * there is no guide application to build it from.
 */
export async function createGuideProfileFromApplication(userId: string): Promise<GuideProfile | null> {
  const existing = await db.guideProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  const app = await db.partnerApplication.findUnique({ where: { userId_kind: { userId, kind: "GUIDE" } } });
  if (!app) return null;
  const d = (app.details ?? {}) as Record<string, unknown>;
  const regions = await db.region.findMany({ where: { id: { in: app.regionIds } }, select: { id: true } });
  return db.guideProfile.create({
    data: {
      userId,
      slug: await uniqueSlug(app.fullName),
      displayName: app.fullName,
      photoUrl: app.photoUrl,
      bio: typeof d.bio === "string" ? d.bio : "",
      languages: Array.isArray(d.languages) ? (d.languages as string[]) : [],
      yearsExperience: Number(d.yearsExperience) || 0,
      dayRateBDT: Number(d.dayRateBDT) || 2000,
      licenceNumber: typeof d.licenceNumber === "string" && d.licenceNumber ? d.licenceNumber : null,
      phone: app.phone,
      language: app.language === "bn" ? "bn" : "en",
      regions: { connect: regions },
    },
  });
}

export const publicGuideWhere: Prisma.GuideProfileWhereInput = { isActive: true, isListed: true, user: { role: "GUIDE" } };

// ============================================================
// Which regions a booking visits
// ============================================================
export async function bookingRegionIds(packageId: string | null): Promise<string[]> {
  if (!packageId) return [];
  const days = await db.tourPackageDay.findMany({
    where: { packageId, destinationId: { not: null } },
    select: { destination: { select: { regionId: true } } },
  });
  return [...new Set(days.map((d) => d.destination?.regionId).filter((x): x is string => Boolean(x)))];
}

// ============================================================
// Availability
// ============================================================
export type GuideConflict = { blockedDays: string[]; trips: { bookingCode: string; dates: string }[] };

/** Days the guide blocked, and other trips (pending or accepted) that overlap these dates. */
export async function guideConflicts(guideId: string, start: Date, end: Date, excludeBookingId?: string): Promise<GuideConflict> {
  const [blocked, trips] = await Promise.all([
    db.guideBlockedDate.findMany({ where: { guideId, date: { gte: new Date(dayKey(start)), lte: new Date(dayKey(end)) } } }),
    db.guideAssignment.findMany({
      where: {
        guideId,
        status: { in: ["PENDING", "ACCEPTED"] },
        ...(excludeBookingId && { bookingId: { not: excludeBookingId } }),
        booking: { status: { not: "CANCELLED" }, startDate: { lte: end }, endDate: { gte: start } },
      },
      include: { booking: { select: { bookingCode: true, startDate: true, endDate: true } } },
    }),
  ]);
  return {
    blockedDays: blocked.map((b) => dayKey(b.date)),
    trips: trips.map((t) => ({ bookingCode: t.booking.bookingCode, dates: formatDateRange(t.booking.startDate, t.booking.endDate) })),
  };
}

export const hasConflict = (c: GuideConflict) => c.blockedDays.length > 0 || c.trips.length > 0;
export { daysBetween };

// ============================================================
// Emails (in the guide's language)
// ============================================================
type TripInfo = { title: string; dates: string; travelers: number; feeBDT: number };

const GUIDE_EMAIL = {
  request: {
    en: (t: TripInfo) => ({
      subject: `New trip request: ${t.title}`,
      heading: "You have a new trip request",
      lines: [`${t.title}`, `${t.dates} · ${t.travelers} ${t.travelers === 1 ? "traveler" : "travelers"}`, `Your fee: ${bdt(t.feeBDT)}`, "Please accept or decline in your dashboard as soon as you can."],
      cta: "Open my trips",
    }),
    bn: (t: TripInfo) => ({
      subject: `নতুন ট্রিপের অনুরোধ: ${t.title}`,
      heading: "আপনার জন্য নতুন ট্রিপের অনুরোধ",
      lines: [`${t.title}`, `${t.dates} · ${t.travelers} জন পর্যটক`, `আপনার পারিশ্রমিক: ${bdt(t.feeBDT)}`, "যত তাড়াতাড়ি সম্ভব ড্যাশবোর্ডে গিয়ে গ্রহণ বা প্রত্যাখ্যান করুন।"],
      cta: "আমার ট্রিপ দেখুন",
    }),
  },
  cancelled: {
    en: (t: TripInfo) => ({
      subject: `Trip cancelled: ${t.title}`,
      heading: "A trip has been cancelled",
      lines: [`${t.title}, ${t.dates}, no longer needs you.`, "Sorry about that. Those days are free again."],
      cta: "Open my trips",
    }),
    bn: (t: TripInfo) => ({
      subject: `ট্রিপ বাতিল: ${t.title}`,
      heading: "একটি ট্রিপ বাতিল হয়েছে",
      lines: [`${t.title}, ${t.dates}: এই ট্রিপে আপনাকে আর লাগবে না।`, "দুঃখিত। ওই দিনগুলো আবার খালি।"],
      cta: "আমার ট্রিপ দেখুন",
    }),
  },
  paid: {
    en: (t: TripInfo & { reference?: string }) => ({
      subject: `Payment sent: ${bdt(t.feeBDT)}`,
      heading: "We've sent your payment",
      lines: [`${bdt(t.feeBDT)} for ${t.title} (${t.dates}).`, ...(t.reference ? [`Reference: ${t.reference}`] : []), "Thank you for looking after our travelers."],
      cta: "See my earnings",
    }),
    bn: (t: TripInfo & { reference?: string }) => ({
      subject: `পেমেন্ট পাঠানো হয়েছে: ${bdt(t.feeBDT)}`,
      heading: "আপনার পেমেন্ট পাঠানো হয়েছে",
      lines: [`${t.title} (${t.dates}) এর জন্য ${bdt(t.feeBDT)}।`, ...(t.reference ? [`রেফারেন্স: ${t.reference}`] : []), "আমাদের পর্যটকদের যত্ন নেওয়ার জন্য ধন্যবাদ।"],
      cta: "আমার আয় দেখুন",
    }),
  },
} as const;

export async function emailGuide(
  which: keyof typeof GUIDE_EMAIL,
  guide: { language: string; user: { email: string } },
  trip: TripInfo & { reference?: string },
) {
  const lang = guide.language === "bn" ? "bn" : "en";
  const e = GUIDE_EMAIL[which][lang](trip);
  const url = `${env.NEXT_PUBLIC_APP_URL}/dashboard/guide`;
  return sendEmail({ to: guide.user.email, subject: `${e.subject} — DeltaWay`, html: simpleEmail(e.heading, e.lines, { label: e.cta, url }) });
}

export function tripInfo(booking: { startDate: Date; endDate: Date; travelerCount: number; package: { title: string } | null }, feeBDT: number): TripInfo {
  return { title: booking.package?.title ?? "Custom trip", dates: formatDateRange(booking.startDate, booking.endDate), travelers: booking.travelerCount, feeBDT };
}

// ============================================================
// When a booking is cancelled, release its guide
// ============================================================
export async function releaseGuidesForBooking(bookingId: string, reason: string) {
  const active = await db.guideAssignment.findMany({
    where: { bookingId, status: { in: ["PENDING", "ACCEPTED"] } },
    include: { guide: { include: { user: { select: { email: true } } } }, booking: { include: { package: { select: { title: true } } } } },
  });
  for (const a of active) {
    await db.guideAssignment.update({ where: { id: a.id }, data: { status: "CANCELLED", declineReason: reason } });
    await emailGuide("cancelled", a.guide, tripInfo(a.booking, a.feeBDT));
  }
  return active.length;
}

/** Tell the tourist who their guide is. */
export async function emailTouristAboutGuide(bookingId: string) {
  const b = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      tourist: { select: { email: true, name: true } },
      package: { select: { title: true } },
      guideAssignments: { where: { status: "ACCEPTED" }, include: { guide: true }, take: 1 },
    },
  });
  const g = b?.guideAssignments[0]?.guide;
  if (!b || !g) return;
  await sendEmail({
    to: b.tourist.email,
    subject: `Meet your guide, ${g.displayName.split(/\s+/)[0]} — ${b.bookingCode}`,
    html: simpleEmail(
      `Meet your guide: ${g.displayName}`,
      [
        `${g.displayName} will lead ${b.package?.title ?? "your trip"} (${formatDateRange(b.startDate, b.endDate)}).`,
        `${g.yearsExperience} years guiding · speaks ${g.languages.join(", ")}.`,
        "You'll see their WhatsApp number on your booking page three days before the trip. Until then, message us with any questions.",
      ],
      { label: "See your guide's profile", url: `${env.NEXT_PUBLIC_APP_URL}/guides/${g.slug}` },
    ),
  });
}

export { notifyTeam, whatsappTo };
