"use server";

import { z } from "zod";
import { verificationRequired } from "@/lib/email-verification";
import { travelerCreates, type TravelerInput } from "@/lib/travelers";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { notifyTeam, sendEmail, simpleEmail } from "@/lib/email";
import { publicGuideWhere } from "@/lib/guides";
import { RATE_LIMITS, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { calculateEndDate, calculateServiceFee, formatDateRange, generateBookingCode, MIN_BOOKING_LEAD_DAYS } from "@/lib/booking-utils";
import { checkTraveler, cleanDocNumber, isNationalId, parseDate, storedVisaStatus } from "@/lib/travel-docs";

// One booking process for everything: a tour with a fixed price, or a custom
// trip to a district, place or destination that the team prices afterwards.
// Every traveler gives their passport and visa details either way.

const travelerSchema = z.object({
  name: z.string().trim().max(120),
  dateOfBirth: z.string().max(10),
  nationality: z.string().max(80),
  passportNumber: z.string().max(40),
  passportExpiry: z.string().max(10),
  visaStatus: z.string().max(20),
  visaNumber: z.string().max(40),
  visaExpiry: z.string().max(10),
});

const bookingSchema = z.object({
  trip: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("tour"), packageSlug: z.string().min(1).max(200) }),
    z.object({
      kind: z.literal("custom"),
      days: z.number().int().min(1, "Choose how many days").max(30, "For trips over 30 days, message us"),
      districtId: z.string().max(64).optional(),
      placeId: z.string().max(64).optional(),
      destinationId: z.string().max(64).optional(),
    }),
  ]),
  startDate: z.string().min(1, "Start date is required").max(10),
  travelerCount: z.number().int().min(1).max(20),
  contact: z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    phone: z.string().trim().min(6, "A phone or WhatsApp number is required").max(40),
  }),
  // Bounded so an oversized request can't exhaust memory. The first is the lead traveler.
  travelers: z.array(travelerSchema).min(1).max(20),
  emergency: z.object({
    name: z.string().trim().min(2, "Give the name of an emergency contact").max(120),
    phone: z.string().trim().min(6, "Give a phone number for the emergency contact").max(40),
  }),
  specialRequests: z.string().max(2000).optional().nullable(),
  // Guide picked on their public profile (a wish; the team assigns)
  requestedGuideSlug: z.string().max(80).optional().nullable(),
  agreedToTerms: z.literal(true, { message: "You must agree to the terms" }),
});

export type BookingData = z.infer<typeof bookingSchema>;

export type CreateBookingResult =
  | { success: true; bookingId: string; bookingCode: string; quote: boolean }
  | { success: false; error: string };

export async function createBookingAction(data: BookingData): Promise<CreateBookingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to book." };
  }

  // A confirmed email, so receipts, permits and changes reach the right person
  if (verificationRequired()) {
    const me = await db.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true } });
    if (!me?.emailVerified) {
      return { success: false, error: "Please confirm your email first. We sent you a link when you signed up; you can send a new one from your dashboard." };
    }
  }

  const limited = await rateLimit(`booking:user:${session.user.id}`, RATE_LIMITS.bookingUser);
  if (!limited.ok) {
    return { success: false, error: tooManyMessage(limited.retryAfterSeconds) };
  }

  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid booking data" };
  }
  const v = parsed.data;

  if (v.travelers.length !== v.travelerCount) {
    return { success: false, error: "Please provide details for every traveler." };
  }

  // ---- What is being booked ----
  const what = await resolveTrip(v.trip);
  if ("error" in what) return { success: false, error: what.error };

  if (v.travelerCount > what.maxTravelers) {
    return { success: false, error: `This trip is limited to ${what.maxTravelers} travelers.` };
  }

  // ---- Dates ----
  const startDate = parseDate(v.startDate);
  if (!startDate) return { success: false, error: "Please pick a valid start date." };
  const leadDays = Math.ceil((startDate.getTime() - Date.now()) / 86_400_000);
  if (leadDays < MIN_BOOKING_LEAD_DAYS) {
    return { success: false, error: `Please pick a start date at least ${MIN_BOOKING_LEAD_DAYS} days from today.` };
  }
  const endDate = calculateEndDate(startDate, what.days);

  // ---- Passport and visa, for every traveler (never trust the form) ----
  for (const [i, t] of v.travelers.entries()) {
    const errors = checkTraveler(t, { start: startDate, end: endDate }, { lead: i === 0 });
    const first = Object.values(errors)[0];
    if (first) return { success: false, error: `Traveler ${i + 1}${t.name.trim() ? ` (${t.name.trim()})` : ""}: ${first}` };
  }
  const numbers = v.travelers.map((t) => cleanDocNumber(t.passportNumber));
  if (new Set(numbers).size !== numbers.length) {
    return { success: false, error: "Two travelers have the same passport number. Please check them." };
  }

  // ---- Price ----
  const tourPriceUSD = what.kind === "tour" ? what.priceUSD * v.travelerCount : 0;
  const serviceFeeUSD = what.kind === "tour" && what.restrictedRegions.length > 0 ? calculateServiceFee(v.travelerCount) : 0;
  const totalAmountUSD = tourPriceUSD + serviceFeeUSD;

  const lead = v.travelers[0];
  // Shown on the booking pages. Passport and visa numbers are not kept here:
  // they are stored encrypted, one row per traveler.
  const detailsPayload = {
    primaryContact: { name: lead.name.trim(), email: v.contact.email, phone: v.contact.phone, nationality: lead.nationality },
    additionalTravelers: v.travelers.slice(1).map((t) => ({ name: t.name.trim(), nationality: t.nationality })),
    notes: v.specialRequests ?? "",
    permitContext:
      what.restrictedRegions.length > 0
        ? { isRestricted: true, restrictedRegions: what.restrictedRegions, serviceFeeUSD, tourPriceUSD }
        : null,
  };

  const people: TravelerInput[] = v.travelers.map((t, i) => {
    const nid = isNationalId(t.nationality, t.passportNumber);
    const status = storedVisaStatus(t);
    return {
      name: t.name,
      email: i === 0 ? v.contact.email : null,
      phone: i === 0 ? v.contact.phone : null,
      nationality: t.nationality,
      dateOfBirth: parseDate(t.dateOfBirth),
      passport: cleanDocNumber(t.passportNumber),
      passportExpiry: nid ? null : parseDate(t.passportExpiry),
      visaStatus: status,
      visaNumber: status === "HAVE_VISA" ? cleanDocNumber(t.visaNumber) : null,
      visaExpiry: status === "HAVE_VISA" ? parseDate(t.visaExpiry) : null,
    };
  });

  const requestedGuide = v.requestedGuideSlug
    ? await db.guideProfile.findFirst({ where: { slug: v.requestedGuideSlug, ...publicGuideWhere }, select: { id: true } })
    : null;

  // Booking codes are random; on the rare clash with an existing code, retry
  let booking: { id: string; bookingCode: string } | null = null;
  for (let attempt = 0; attempt < 5 && !booking; attempt++) {
    try {
      booking = await db.booking.create({
        data: {
          bookingCode: generateBookingCode(),
          touristId: session.user.id,
          packageId: what.kind === "tour" ? what.packageId : null,
          customTitle: what.kind === "custom" ? what.title : null,
          districtId: what.kind === "custom" ? what.districtId : null,
          placeId: what.kind === "custom" ? what.placeId : null,
          destinationId: what.kind === "custom" ? what.destinationId : null,
          startDate,
          endDate,
          travelerCount: v.travelerCount,
          // A tour has its price, so it waits for payment. A custom trip waits for our quote.
          status: what.kind === "tour" ? "PAYMENT_PENDING" : "QUOTE_REQUESTED",
          totalAmountUSD,
          specialRequests: JSON.stringify(detailsPayload),
          emergencyName: v.emergency.name,
          emergencyPhone: v.emergency.phone,
          requestedGuideId: requestedGuide?.id ?? null,
          travelers: { create: travelerCreates(people) },
        },
        select: { id: true, bookingCode: true },
      });
    } catch (err) {
      const isCodeClash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!isCodeClash) throw err;
    }
  }
  if (!booking) {
    return { success: false, error: "Couldn't create the booking. Please try again." };
  }

  if (what.kind === "custom") {
    const when = formatDateRange(startDate, endDate);
    await Promise.all([
      notifyTeam({
        subject: `Quote needed: ${what.title} (${booking.bookingCode})`,
        replyTo: v.contact.email,
        lines: [
          `${lead.name.trim()} asked for a custom trip to ${what.title}.`,
          `${when} · ${v.travelerCount} traveler${v.travelerCount === 1 ? "" : "s"} · ${v.contact.phone}`,
          v.specialRequests ?? "",
          `Set the price in the admin: /admin/bookings/${booking.id}`,
        ].filter(Boolean),
      }),
      sendEmail({
        to: v.contact.email,
        subject: `We're pricing your trip to ${what.title} (${booking.bookingCode})`,
        html: simpleEmail("Thanks, your booking request is in.", [
          `Hi ${lead.name.trim().split(/\s+/)[0]}, we've received your request for ${what.title}, ${when}.`,
          "We'll send you a plan and a price within 24 hours. You pay only once you're happy with it.",
          `Your booking code is ${booking.bookingCode}. For anything urgent, message us on WhatsApp: ${site.whatsappDisplay}.`,
        ]),
      }),
    ]).catch(() => undefined);
  }

  return { success: true, bookingId: booking.id, bookingCode: booking.bookingCode, quote: what.kind === "custom" };
}

type Resolved =
  | { error: string }
  | {
      kind: "tour";
      packageId: string;
      title: string;
      days: number;
      priceUSD: number;
      maxTravelers: number;
      restrictedRegions: { id: string; name: string; slug: string }[];
    }
  | {
      kind: "custom";
      title: string;
      days: number;
      maxTravelers: number;
      districtId: string | null;
      placeId: string | null;
      destinationId: string | null;
      restrictedRegions: { id: string; name: string; slug: string }[];
    };

async function resolveTrip(trip: BookingData["trip"]): Promise<Resolved> {
  if (trip.kind === "tour") {
    const pkg = await db.tourPackage.findUnique({
      where: { slug: trip.packageSlug },
      include: { itinerary: { include: { destination: { include: { region: true } } } } },
    });
    if (!pkg || !pkg.isPublished) return { error: "Tour package no longer available." };
    const restrictedRegions = Array.from(
      new Map(
        pkg.itinerary
          .flatMap((d) => (d.destination?.region ? [d.destination.region] : []))
          .filter((r) => r.isRestricted)
          .map((r) => [r.id, { id: r.id, name: r.name, slug: r.slug }]),
      ).values(),
    );
    return {
      kind: "tour",
      packageId: pkg.id,
      title: pkg.title,
      days: pkg.durationDays,
      priceUSD: Number(pkg.basePriceUSD),
      maxTravelers: pkg.maxTravelers,
      restrictedRegions,
    };
  }

  // A custom trip: to a place, a destination or a whole district
  const [place, destination, district] = await Promise.all([
    trip.placeId
      ? db.districtPlace.findFirst({ where: { id: trip.placeId, isPublished: true }, select: { id: true, name: true, district: { select: { id: true, name: true } } } })
      : null,
    trip.destinationId
      ? db.destination.findFirst({ where: { id: trip.destinationId, isPublished: true }, select: { id: true, name: true, districtId: true } })
      : null,
    trip.districtId ? db.district.findUnique({ where: { id: trip.districtId }, select: { id: true, name: true } }) : null,
  ]);
  const title = place ? `${place.name}, ${place.district.name}` : (destination?.name ?? district?.name);
  if (!title) return { error: "We couldn't find that place. Please start again from its page." };
  return {
    kind: "custom",
    title,
    days: trip.days,
    maxTravelers: 20,
    districtId: place?.district.id ?? destination?.districtId ?? district?.id ?? null,
    placeId: place?.id ?? null,
    destinationId: destination?.id ?? null,
    // Permit fees for the hill tracts are included in the quote
    restrictedRegions: [],
  };
}
