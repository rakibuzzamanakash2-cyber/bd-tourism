import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { encrypt, isEncrypted, last4 } from "@/lib/crypto";

/** How long after a trip passport numbers are kept (for permits and any questions). */
export const PASSPORT_RETENTION_DAYS = 90;

export type TravelerInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  passport?: string | null;
  dateOfBirth?: Date | null;
  passportExpiry?: Date | null;
  visaStatus?: "NOT_REQUIRED" | "HAVE_VISA" | "ON_ARRIVAL" | "APPLYING" | null;
  visaNumber?: string | null;
  visaExpiry?: Date | null;
};

/** Rows for a nested create inside booking.create (no bookingId yet). */
export function travelerCreates(people: TravelerInput[]): Prisma.BookingTravelerCreateWithoutBookingInput[] {
  return travelerRows("", people).map((row) => {
    const { bookingId, ...rest } = row;
    void bookingId;
    return rest;
  });
}

export function travelerRows(bookingId: string, people: TravelerInput[]): Prisma.BookingTravelerCreateManyInput[] {
  return people.map((p, i) => {
    const passport = p.passport?.trim() || null;
    const visa = p.visaNumber?.trim() || null;
    return {
      bookingId,
      position: i,
      name: p.name.trim().slice(0, 120),
      email: p.email?.trim() || null,
      phone: p.phone?.trim() || null,
      nationality: p.nationality?.trim() || null,
      dateOfBirth: p.dateOfBirth ?? null,
      passportEnc: passport ? encrypt(passport) : null,
      passportLast4: passport ? last4(passport) : null,
      passportExpiry: p.passportExpiry ?? null,
      visaStatus: p.visaStatus ?? null,
      visaNumberEnc: visa ? encrypt(visa) : null,
      visaExpiry: p.visaExpiry ?? null,
    };
  });
}

/** The details payload without passport numbers (those live, encrypted, in BookingTraveler). */
export function withoutPassports<T extends { primaryContact?: object; additionalTravelers?: object[] }>(details: T): T {
  const strip = (o: object) => {
    const rest = { ...(o as Record<string, unknown>) };
    delete rest.passportNumber;
    return rest;
  };
  return {
    ...details,
    ...(details.primaryContact && { primaryContact: strip(details.primaryContact) }),
    ...(details.additionalTravelers && { additionalTravelers: details.additionalTravelers.map(strip) }),
  } as T;
}

type LegacyDetails = {
  primaryContact?: { name?: string; email?: string; phone?: string; passportNumber?: string; nationality?: string };
  additionalTravelers?: { name?: string; passportNumber?: string; nationality?: string }[];
};

/**
 * Bookings made before this change kept passport numbers in plain text
 * inside the details JSON, and profiles kept them in plain text too. Move
 * them into encrypted storage. Safe to run any number of times; the daily
 * job runs it, and `npm run privacy:migrate` runs it by hand.
 */
export async function migrateLegacyTravelerData(): Promise<{ bookings: number; profiles: number }> {
  let bookings = 0;
  const legacy = await db.booking.findMany({
    where: { specialRequests: { contains: "passportNumber" } },
    select: { id: true, specialRequests: true, _count: { select: { travelers: true } } },
    take: 500,
  });
  for (const b of legacy) {
    let d: LegacyDetails;
    try {
      d = JSON.parse(b.specialRequests ?? "{}");
    } catch {
      continue;
    }
    const people: TravelerInput[] = [
      ...(d.primaryContact?.name ? [{ name: d.primaryContact.name, email: d.primaryContact.email, phone: d.primaryContact.phone, nationality: d.primaryContact.nationality, passport: d.primaryContact.passportNumber }] : []),
      ...(d.additionalTravelers ?? []).filter((t) => t.name).map((t) => ({ name: t.name!, nationality: t.nationality, passport: t.passportNumber })),
    ];
    await db.$transaction([
      ...(b._count.travelers === 0 && people.length ? [db.bookingTraveler.createMany({ data: travelerRows(b.id, people) })] : []),
      db.booking.update({ where: { id: b.id }, data: { specialRequests: JSON.stringify(withoutPassports(d)) } }),
    ]);
    bookings++;
  }

  let profiles = 0;
  const plain = await db.touristProfile.findMany({ where: { passportNumber: { not: null } }, select: { id: true, passportNumber: true } });
  for (const p of plain) {
    if (!p.passportNumber || isEncrypted(p.passportNumber)) continue;
    await db.touristProfile.update({ where: { id: p.id }, data: { passportNumber: encrypt(p.passportNumber) } });
    profiles++;
  }
  return { bookings, profiles };
}

/** Delete passport and visa numbers (and birth dates) once a trip is long over. Last 4 digits are kept for reference. */
export async function purgeOldPassports(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - PASSPORT_RETENTION_DAYS * 86_400_000);
  const { count } = await db.bookingTraveler.updateMany({
    where: { OR: [{ passportEnc: { not: null } }, { visaNumberEnc: { not: null } }], booking: { endDate: { lt: cutoff } } },
    data: { passportEnc: null, visaNumberEnc: null, dateOfBirth: null, passportPurgedAt: now },
  });
  return count;
}

/** Masked passport for display: "•••• 4567". */
export const maskedPassport = (t: { passportLast4: string | null; passportPurgedAt?: Date | null }) =>
  t.passportLast4 ? `•••• ${t.passportLast4}${t.passportPurgedAt ? " (deleted after the trip)" : ""}` : null;
