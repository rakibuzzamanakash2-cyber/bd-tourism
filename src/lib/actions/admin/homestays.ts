"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, simpleEmail } from "@/lib/email";
import { homestayListingSchema } from "@/lib/homestay-shared";
import { createHomestayFromApplication, emailHost, publicHomestayWhere } from "@/lib/homestays";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

function refresh(id?: string, slug?: string) {
  revalidatePath("/admin/homestays");
  if (id) revalidatePath(`/admin/homestays/${id}`);
  revalidatePath("/homestays");
  if (slug) revalidatePath(`/homestays/${slug}`);
  revalidatePath("/dashboard/host", "layout");
}

const adminListingSchema = homestayListingSchema.extend({
  id: z.string().min(1),
  phone: z.string().trim().min(6).max(30),
  isActive: z.boolean(),
});

export async function adminUpdateHomestay(input: z.input<typeof adminListingSchema>): Promise<AdminActionResult & { fieldErrors?: Record<string, string> }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = adminListingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const { id, houseRules, address, ...data } = parsed.data;
  const h = await db.homestay.update({ where: { id }, data: { ...data, houseRules: houseRules || null, address: address || null } });
  await audit({ actorId: admin.id, action: "homestay.update", targetType: "Homestay", targetId: id, details: { isActive: data.isActive, isListed: data.isListed } });
  refresh(id, h.slug);
  return { ok: true, message: "Homestay saved." };
}

export async function adminCreateHomestay(userId: string): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const h = await createHomestayFromApplication(userId);
  if (!h) return { ok: false, error: "They have no host application to build a listing from. Ask them to apply first." };
  await audit({ actorId: admin.id, action: "homestay.create", targetType: "Homestay", targetId: h.id });
  refresh(h.id, h.slug);
  return { ok: true, message: "Listing created." };
}

/** Record that the host has been paid for a stay. */
export async function adminMarkHostPaid(input: { bookingId: string; reference?: string }): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const reference = input.reference?.trim().slice(0, 200) || null;
  const { count } = await db.booking.updateMany({
    where: { id: input.bookingId, homestayId: { not: null }, hostPayoutStatus: "UNPAID", status: { not: "CANCELLED" } },
    data: { hostPayoutStatus: "PAID", hostPaidAt: new Date(), hostPayoutReference: reference },
  });
  if (!count) return { ok: false, error: "Only paid stays that haven't been paid out can be marked paid." };
  await audit({ actorId: admin.id, action: "homestay.payout", targetType: "Booking", targetId: input.bookingId, details: { reference } });
  await emailHost("paid", input.bookingId, { reference: reference ?? undefined });
  revalidatePath(`/admin/bookings/${input.bookingId}`);
  refresh();
  return { ok: true, message: "Marked as paid. The host got an email." };
}

/** Tell everyone on the homestay waitlist that homestays are live. Once per person. */
export async function adminEmailHomestayWaitlist(): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const live = await db.homestay.count({ where: publicHomestayWhere });
  if (!live) return { ok: false, error: "Publish at least one homestay first." };
  const people = await db.waitlistEntry.findMany({ where: { kind: "HOMESTAY", notifiedAt: null }, take: 500 });
  let sent = 0;
  for (const p of people) {
    const r = await sendEmail({
      to: p.email,
      subject: "Homestays are open on DeltaWay",
      html: simpleEmail(
        "You can now stay with a family in Bangladesh",
        [
          "You asked us to tell you when homestays were ready. They are.",
          "Every home has been visited by our team and every host has had their ID checked. Meals with the family are included.",
          "This is the only email we'll send about it.",
        ],
        { label: "See the homestays", url: `${env.NEXT_PUBLIC_APP_URL}/homestays` },
      ),
    });
    if (r.success) {
      await db.waitlistEntry.update({ where: { id: p.id }, data: { notifiedAt: new Date() } });
      sent++;
    }
  }
  await audit({ actorId: admin.id, action: "homestay.waitlist_email", targetType: "WaitlistEntry", targetId: "HOMESTAY", details: { sent, of: people.length } });
  revalidatePath("/admin/homestays");
  revalidatePath("/admin/waitlist");
  if (people.length && !sent) return { ok: false, error: "No emails could be sent. Is RESEND_API_KEY set?" };
  return { ok: true, message: people.length ? `Emailed ${sent} of ${people.length} people.` : "Everyone on the waitlist has already been emailed." };
}
