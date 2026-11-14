import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

// "Download my data": everything we hold about the signed-in person, as JSON.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Please sign in.", { status: 401 });
  const u = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true,
      accounts: { select: { provider: true } },
      touristProfile: { select: { nationality: true, phoneNumber: true, passportNumber: true, emergencyContact: true, dietaryPrefs: true } },
      bookings: {
        select: {
          bookingCode: true, status: true, startDate: true, endDate: true, travelerCount: true, totalAmountUSD: true, createdAt: true, cancelledAt: true, cancellationReason: true, refundAmountUSD: true, specialRequests: true,
          package: { select: { title: true } }, homestay: { select: { name: true } },
          travelers: {
            select: { name: true, email: true, phone: true, nationality: true, dateOfBirth: true, passportEnc: true, passportExpiry: true, passportPurgedAt: true, visaStatus: true, visaNumberEnc: true, visaExpiry: true },
            orderBy: { position: "asc" },
          },
          payment: { select: { amountUSD: true, currency: true, amountBDT: true, status: true, paidAt: true, refundedAt: true, method: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      reviews: { select: { rating: true, title: true, comment: true, guideRating: true, guideComment: true, createdAt: true, status: true } },
      savedDestinations: { select: { destination: { select: { name: true } }, createdAt: true } },
      savedPackages: { select: { package: { select: { title: true } }, createdAt: true } },
      contactMessages: { select: { subject: true, message: true, createdAt: true } },
      savedDistricts: { select: { district: { select: { name: true } }, createdAt: true } },
      savedPlaces: { select: { place: { select: { name: true } }, createdAt: true } },
      savedHomestays: { select: { homestay: { select: { name: true } }, createdAt: true } },
      tripRequests: { select: { travelers: true, startDate: true, days: true, message: true, status: true, createdAt: true } },
      travelerPhotos: {
        select: { url: true, caption: true, creditName: true, status: true, placeName: true, createdAt: true, district: { select: { name: true } }, place: { select: { name: true } } },
      },
      applications: { select: { kind: true, status: true, fullName: true, phone: true, details: true, createdAt: true, submittedAt: true } },
    },
  });
  if (!u) return new NextResponse("Not found.", { status: 404 });

  const data = {
    exportedAt: new Date().toISOString(),
    note: "This is everything DeltaWay holds about your account. Passport numbers are deleted 90 days after each trip.",
    account: { email: u.email, name: u.name, role: u.role, emailVerified: u.emailVerified, createdAt: u.createdAt, signInMethods: u.accounts.map((a) => a.provider) },
    profile: u.touristProfile && { ...u.touristProfile, passportNumber: decrypt(u.touristProfile.passportNumber) },
    bookings: u.bookings.map(({ travelers, specialRequests, ...b }) => ({
      ...b,
      details: (() => {
        try {
          return specialRequests ? JSON.parse(specialRequests) : null;
        } catch {
          return specialRequests;
        }
      })(),
      travelers: travelers.map(({ passportEnc, visaNumberEnc, ...t }) => ({ ...t, passportNumber: decrypt(passportEnc), visaNumber: decrypt(visaNumberEnc) })),
    })),
    reviews: u.reviews,
    saved: { destinations: u.savedDestinations, tours: u.savedPackages, districts: u.savedDistricts, places: u.savedPlaces, homestays: u.savedHomestays },
    messages: u.contactMessages,
    tripRequests: u.tripRequests,
    sharedPhotos: u.travelerPhotos,
    applications: u.applications,
  };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="deltaway-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
