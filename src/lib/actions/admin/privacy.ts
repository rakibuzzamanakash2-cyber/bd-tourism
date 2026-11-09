"use server";

import { audit } from "@/lib/audit";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";

/** Show one traveler's full passport number to the team. Every view is logged. */
export async function revealPassportAction(travelerId: string): Promise<{ ok: true; passport: string } | { ok: false; error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const t = await db.bookingTraveler.findUnique({ where: { id: travelerId }, select: { bookingId: true, name: true, passportEnc: true, passportPurgedAt: true } });
  if (!t) return { ok: false, error: "Not found." };
  if (!t.passportEnc) return { ok: false, error: t.passportPurgedAt ? "Deleted after the trip, as our privacy policy says." : "No passport number on file." };
  const passport = decrypt(t.passportEnc);
  if (!passport) return { ok: false, error: "Couldn't decrypt it. Has DATA_ENCRYPTION_KEY changed?" };
  await audit({ actorId: admin.id, action: "privacy.passport_view", targetType: "Booking", targetId: t.bookingId, details: { traveler: t.name } });
  return { ok: true, passport };
}
