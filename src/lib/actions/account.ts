"use server";

import { auth } from "@/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/guide-shared";
import { removeTravelerPhoto } from "@/lib/traveler-photos";

export type DeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Delete my account. Personal details are removed for good; bookings stay
 * (anonymised) because we must keep payment records. Reviews stay, shown
 * as "A traveler".
 */
export async function deleteMyAccountAction(input: { confirmEmail: string }): Promise<DeleteResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in again." };
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, role: true } });
  if (!user) return { ok: false, error: "Please sign in again." };
  if (input.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) return { ok: false, error: "Type your email address exactly to confirm." };
  if (user.role !== "TOURIST") return { ok: false, error: "Guide, host and team accounts are closed by the DeltaWay team. Please message us." };

  const today = new Date(dayKey(new Date()));
  const upcoming = await db.booking.count({ where: { touristId: user.id, status: { in: ["PAID", "CONFIRMED", "IN_PROGRESS", "DISPUTED"] }, endDate: { gte: today } } });
  if (upcoming) return { ok: false, error: "You have a trip coming up. Cancel it first (or message us), then delete your account." };

  // Photos they shared come off the site, files included
  for (const photo of await db.travelerPhoto.findMany({ where: { userId: user.id }, select: { id: true, url: true, publicId: true } })) {
    await removeTravelerPhoto(photo);
  }

  const bookings = await db.booking.findMany({ where: { touristId: user.id }, select: { id: true, specialRequests: true } });
  const scrub = (json: string | null) => {
    try {
      const d = JSON.parse(json ?? "{}");
      return JSON.stringify({ ...d, primaryContact: { name: "Deleted traveler" }, additionalTravelers: [], notes: "" });
    } catch {
      return null;
    }
  };

  await db.$transaction([
    // Unpaid bookings just go away as cancelled
    db.booking.updateMany({ where: { touristId: user.id, status: "PAYMENT_PENDING" }, data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: "Account deleted" } }),
    ...bookings.map((b) => db.booking.update({ where: { id: b.id }, data: { specialRequests: scrub(b.specialRequests), emergencyName: null, emergencyPhone: null } })),
    db.bookingTraveler.updateMany({
      where: { booking: { touristId: user.id } },
      data: {
        name: "Deleted traveler",
        email: null,
        phone: null,
        nationality: null,
        dateOfBirth: null,
        passportEnc: null,
        passportLast4: null,
        passportExpiry: null,
        visaStatus: null,
        visaNumberEnc: null,
        visaExpiry: null,
      },
    }),
    db.account.deleteMany({ where: { userId: user.id } }),
    db.session.deleteMany({ where: { userId: user.id } }),
    db.touristProfile.deleteMany({ where: { userId: user.id } }),
    db.savedDestination.deleteMany({ where: { userId: user.id } }),
    db.savedPackage.deleteMany({ where: { userId: user.id } }),
    db.contactMessage.deleteMany({ where: { userId: user.id } }),
    db.savedDistrict.deleteMany({ where: { userId: user.id } }),
    db.savedPlace.deleteMany({ where: { userId: user.id } }),
    db.savedHomestay.deleteMany({ where: { userId: user.id } }),
    db.tripRequest.deleteMany({ where: { userId: user.id } }),
    db.partnerApplication.deleteMany({ where: { userId: user.id } }),
    db.verificationToken.deleteMany({ where: { identifier: { endsWith: user.email } } }),
    db.user.update({
      where: { id: user.id },
      data: { email: `deleted-${user.id}@deleted.invalid`, name: null, image: null, passwordHash: null, emailVerified: null, deletedAt: new Date() },
    }),
  ]);
  await audit({ actorId: user.id, action: "account.delete", targetType: "User", targetId: user.id });
  return { ok: true };
}
