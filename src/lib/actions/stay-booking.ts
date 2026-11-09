"use server";

import { Prisma } from "@prisma/client";
import { verificationRequired } from "@/lib/email-verification";
import { travelerCreates, withoutPassports } from "@/lib/travelers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calculateServiceFee, generateBookingCode, UNPAID_BOOKING_TTL_HOURS } from "@/lib/booking-utils";
import { dayKey } from "@/lib/guide-shared";
import { MAX_STAY_DAYS_AHEAD, MIN_STAY_LEAD_DAYS, nightsBetween, stayBookingSchema, stayQuote, type StayBookingInput } from "@/lib/homestay-shared";
import { publicHomestayWhere } from "@/lib/homestays";
import { RATE_LIMITS, rateLimit, tooManyMessage } from "@/lib/rate-limit";

export type StayBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

class NightsTaken extends Error {}

export async function createStayBookingAction(input: StayBookingInput): Promise<StayBookingResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in to book." };
  const userId = session.user.id;


  // A confirmed email, so receipts, permits and changes reach the right person
  if (verificationRequired()) {
    const me = await db.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
    if (!me?.emailVerified) {
      return { ok: false, error: "Please confirm your email first. We sent you a link when you signed up; you can send a new one from your dashboard." };
    }
  }

  const limited = await rateLimit(`booking:user:${userId}`, RATE_LIMITS.bookingUser);
  if (!limited.ok) return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  const parsed = stayBookingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;

  // Dates: at least a couple of days ahead, within a year
  const today = dayKey(new Date());
  const lead = nightsBetween(today, d.checkIn);
  if (lead < MIN_STAY_LEAD_DAYS) {
    return { ok: false, error: `Please book at least ${MIN_STAY_LEAD_DAYS} days ahead so the family can get ready.`, fieldErrors: { checkIn: "Too soon" } };
  }
  if (lead > MAX_STAY_DAYS_AHEAD) return { ok: false, error: "Stays can be booked up to a year ahead.", fieldErrors: { checkIn: "Too far ahead" } };

  const homestay = await db.homestay.findFirst({
    where: { slug: d.slug, ...publicHomestayWhere },
    include: { region: { select: { id: true, name: true, slug: true, isRestricted: true } } },
  });
  if (!homestay) return { ok: false, error: "This homestay isn't taking bookings right now." };
  if (homestay.hostId === userId) return { ok: false, error: "You can't book your own homestay." };
  if (d.guests > homestay.maxGuests) {
    return { ok: false, error: `This home sleeps up to ${homestay.maxGuests}.`, fieldErrors: { guests: `Up to ${homestay.maxGuests}` } };
  }
  // Permit regions: the permit needs the lead traveler's passport
  if (homestay.region.isRestricted && (d.passportNumber.length < 2 || d.nationality.length < 2)) {
    return {
      ok: false,
      error: `${homestay.region.name} needs a government permit, which needs your passport details.`,
      fieldErrors: { ...(d.passportNumber.length < 2 && { passportNumber: "Required here" }), ...(d.nationality.length < 2 && { nationality: "Required here" }) },
    };
  }

  const checkIn = new Date(`${d.checkIn}T00:00:00Z`);
  const checkOut = new Date(`${d.checkOut}T00:00:00Z`);
  const nights = nightsBetween(d.checkIn, d.checkOut);
  const quote = stayQuote(homestay.facilities, nights);
  // Same permit processing fee as tours, for homes in permit regions
  const serviceFeeUSD = homestay.region.isRestricted ? calculateServiceFee(d.guests) : 0;
  const totalAmountUSD = Math.round((quote.totalUSD + serviceFeeUSD) * 100) / 100;
  const details = {
    primaryContact: { name: d.name, email: d.email, phone: d.phone, passportNumber: d.passportNumber, nationality: d.nationality },
    additionalTravelers: [],
    notes: d.notes,
    stay: { nights, firstNightBDT: quote.firstNightBDT, extraNightBDT: quote.extraNightBDT, totalBDT: quote.totalBDT },
    permitContext: homestay.region.isRestricted
      ? { isRestricted: true, restrictedRegions: [{ id: homestay.region.id, name: homestay.region.name, slug: homestay.region.slug }], serviceFeeUSD, tourPriceUSD: quote.totalUSD }
      : null,
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const booking = await db.$transaction(async (tx) => {
        // Lock the homestay so two people can't take the same nights at once
        await tx.$queryRaw`SELECT id FROM "Homestay" WHERE id = ${homestay.id} FOR UPDATE`;
        const [blocked, clash] = await Promise.all([
          tx.homestayBlockedDate.count({ where: { homestayId: homestay.id, date: { gte: checkIn, lt: checkOut } } }),
          tx.booking.count({
            where: {
              homestayId: homestay.id,
              status: { in: ["PAYMENT_PENDING", "PAID", "CONFIRMED", "IN_PROGRESS", "DISPUTED"] },
              NOT: { status: "PAYMENT_PENDING", createdAt: { lt: new Date(Date.now() - UNPAID_BOOKING_TTL_HOURS * 36e5) } },
              startDate: { lt: checkOut },
              endDate: { gt: checkIn },
            },
          }),
        ]);
        if (blocked || clash) throw new NightsTaken();
        return tx.booking.create({
          data: {
            bookingCode: generateBookingCode(),
            touristId: userId,
            homestayId: homestay.id,
            startDate: checkIn,
            endDate: checkOut,
            travelerCount: d.guests,
            status: "PAYMENT_PENDING",
            totalAmountUSD,
            hostPayoutBDT: quote.hostPayoutBDT,
            specialRequests: JSON.stringify(withoutPassports(details)),
            travelers: { create: travelerCreates([{ name: d.name, email: d.email, phone: d.phone, nationality: d.nationality, passport: d.passportNumber }]) },
          },
          select: { id: true },
        });
      });
      return { ok: true, bookingId: booking.id };
    } catch (err) {
      if (err instanceof NightsTaken) {
        return { ok: false, error: "Some of those nights were just taken. Please pick other dates.", fieldErrors: { checkIn: "Not available" } };
      }
      // Booking codes are random; on the rare clash, try again
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
    }
  }
  return { ok: false, error: "Couldn't create the booking. Please try again." };
}
