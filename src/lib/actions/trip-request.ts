"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyTeam, sendEmail, simpleEmail } from "@/lib/email";
import { RATE_LIMITS, clientIp, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import { site } from "@/lib/site";

const optionalId = z.string().max(64).optional().transform((v) => v || undefined);

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(200),
  phone: z.string().trim().max(40).optional().transform((v) => v || undefined),
  country: z.string().trim().max(80).optional().transform((v) => v || undefined),
  travelers: z.coerce.number().int().min(1, "At least 1 traveler").max(30, "For groups over 30, message us"),
  startDate: z
    .string()
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`) >= new Date(Date.now() - 864e5)), "Pick a date from today on"),
  days: z.coerce.number().int().min(1).max(60).optional().or(z.literal("").transform(() => undefined)),
  message: z.string().trim().min(5, "Tell us a little about your trip").max(3000),
  districtId: optionalId,
  placeId: optionalId,
  destinationId: optionalId,
  website: z.string().optional(), // honeypot
});

export type TripRequestInput = z.input<typeof schema>;
export type TripRequestResult = { ok: true } | { ok: false; error: string; field?: string };

/** "Plan a trip here" from a district, place or destination page. */
export async function createTripRequestAction(input: TripRequestInput): Promise<TripRequestResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check the form.", field: issue?.path[0]?.toString() };
  }
  const v = parsed.data;
  if (v.website) return { ok: true };

  const limited = await rateLimit(`trip:ip:${await clientIp()}`, RATE_LIMITS.contactIp);
  if (!limited.ok) return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  // Only keep links to things that exist
  const [district, place, destination] = await Promise.all([
    v.districtId ? db.district.findUnique({ where: { id: v.districtId }, select: { id: true, name: true } }) : null,
    v.placeId ? db.districtPlace.findUnique({ where: { id: v.placeId }, select: { id: true, name: true, district: { select: { id: true, name: true } } } }) : null,
    v.destinationId ? db.destination.findUnique({ where: { id: v.destinationId }, select: { id: true, name: true } }) : null,
  ]);
  const where = place ? `${place.name}, ${place.district.name}` : destination?.name ?? district?.name ?? "Bangladesh";

  const session = await auth();
  await db.tripRequest.create({
    data: {
      name: v.name,
      email: v.email,
      phone: v.phone ?? null,
      country: v.country ?? null,
      travelers: v.travelers,
      startDate: v.startDate ? new Date(`${v.startDate}T00:00:00Z`) : null,
      days: v.days ?? null,
      message: v.message,
      districtId: district?.id ?? place?.district.id ?? null,
      placeId: place?.id ?? null,
      destinationId: destination?.id ?? null,
      userId: session?.user?.id ?? null,
    },
  });

  const when = [v.startDate ? `from ${v.startDate}` : "dates open", v.days ? `${v.days} days` : null].filter(Boolean).join(", ");
  await Promise.all([
    notifyTeam({
      subject: `Trip request: ${where}`,
      replyTo: v.email,
      lines: [
        `From: ${v.name} <${v.email}>${v.phone ? `, ${v.phone}` : ""}${v.country ? ` (${v.country})` : ""}`,
        `Where: ${where}`,
        `When: ${when} · ${v.travelers} traveler${v.travelers === 1 ? "" : "s"}`,
        v.message,
        `See it in the admin: /admin/trip-requests`,
      ],
    }),
    sendEmail({
      to: v.email,
      subject: `Your trip to ${where} — ${site.name}`,
      html: simpleEmail("Thanks, we're planning your trip.", [
        `Hi ${v.name.split(/\s+/)[0]}, thanks for asking about ${where}.`,
        "We'll reply within 24 hours with a suggested plan and a price. You only pay once you're happy with it.",
        `For anything urgent, message us on WhatsApp: ${site.whatsappDisplay}.`,
      ]),
    }),
  ]);
  return { ok: true };
}
