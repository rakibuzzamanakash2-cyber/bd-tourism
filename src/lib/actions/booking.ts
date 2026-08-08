"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  calculateEndDate,
  calculateServiceFee,
  generateBookingCode,
  MIN_BOOKING_LEAD_DAYS,
} from "@/lib/booking-utils";

const additionalTravelerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  passportNumber: z.string().min(2, "Passport number required for permits"),
  nationality: z.string().min(2, "Nationality required for permits"),
});

const bookingSchema = z.object({
  packageSlug: z.string().min(1),
  startDate: z.string().min(1, "Start date is required"),
  travelerCount: z.number().int().min(1).max(20),
  primaryContact: z.object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email(),
    phone: z.string().min(6, "Phone number is required"),
    passportNumber: z.string().optional().default(""),
    nationality: z.string().optional().default(""),
  }),
  additionalTravelers: z.array(additionalTravelerSchema),
  specialRequests: z.string().max(2000).optional().nullable(),
  agreedToTerms: z.literal(true, {
    message: "You must agree to the terms",
  }),
});

export type BookingData = z.infer<typeof bookingSchema>;

export type CreateBookingResult =
  | { success: true; bookingId: string; bookingCode: string }
  | { success: false; error: string };

export async function createBookingAction(
  data: BookingData,
): Promise<CreateBookingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to book." };
  }

  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid booking data",
    };
  }

  // Fetch package with itinerary destinations to check restricted regions
  const pkg = await db.tourPackage.findUnique({
    where: { slug: parsed.data.packageSlug },
    include: {
      itinerary: {
        include: {
          destination: {
            include: { region: true },
          },
        },
      },
    },
  });

  if (!pkg) {
    return { success: false, error: "Tour package no longer available." };
  }

  // Determine if this tour visits a restricted region
  const restrictedRegions = Array.from(
    new Map(
      pkg.itinerary
        .flatMap((d) => (d.destination?.region ? [d.destination.region] : []))
        .filter((r) => r.isRestricted)
        .map((r) => [r.id, r]),
    ).values(),
  );
  const isRestricted = restrictedRegions.length > 0;

  // Server-side enforcement: restricted tours require primary passport + nationality
  if (isRestricted) {
    if (!parsed.data.primaryContact.passportNumber || parsed.data.primaryContact.passportNumber.length < 2) {
      return {
        success: false,
        error: "Passport number is required for the primary traveler on restricted-area tours.",
      };
    }
    if (!parsed.data.primaryContact.nationality || parsed.data.primaryContact.nationality.length < 2) {
      return {
        success: false,
        error: "Nationality is required for the primary traveler on restricted-area tours.",
      };
    }
  }

  // Traveler count validation
  if (parsed.data.travelerCount > pkg.maxTravelers) {
    return {
      success: false,
      error: `This tour is limited to ${pkg.maxTravelers} travelers.`,
    };
  }

  const expectedAdditional = parsed.data.travelerCount - 1;
  if (parsed.data.additionalTravelers.length !== expectedAdditional) {
    return {
      success: false,
      error: "Please provide details for every additional traveler.",
    };
  }

  // Date validation
  const startDate = new Date(parsed.data.startDate);
  const now = new Date();
  const leadDays = Math.ceil(
    (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (leadDays < MIN_BOOKING_LEAD_DAYS) {
    return {
      success: false,
      error: `Please pick a start date at least ${MIN_BOOKING_LEAD_DAYS} days from today.`,
    };
  }

  const endDate = calculateEndDate(startDate, pkg.durationDays);

  // Price calculation
  const tourPriceUSD = Number(pkg.basePriceUSD) * parsed.data.travelerCount;
  const serviceFeeUSD = isRestricted
    ? calculateServiceFee(parsed.data.travelerCount)
    : 0;
  const totalAmountUSD = tourPriceUSD + serviceFeeUSD;

  // Payload we stash in specialRequests until we build proper models
  const detailsPayload = {
    primaryContact: parsed.data.primaryContact,
    additionalTravelers: parsed.data.additionalTravelers,
    notes: parsed.data.specialRequests ?? "",
    permitContext: isRestricted
      ? {
          isRestricted: true,
          restrictedRegions: restrictedRegions.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
          })),
          serviceFeeUSD,
          tourPriceUSD,
        }
      : null,
  };

  const booking = await db.booking.create({
    data: {
      bookingCode: generateBookingCode(),
      touristId: session.user.id,
      packageId: pkg.id,
      startDate,
      endDate,
      travelerCount: parsed.data.travelerCount,
      status: "PAYMENT_PENDING",
      totalAmountUSD,
      specialRequests: JSON.stringify(detailsPayload),
    },
  });

  return {
    success: true,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
  };
}
