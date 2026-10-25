"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, simpleEmail } from "@/lib/email";
import { PERMIT_STATUS } from "@/lib/permit-labels";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const schema = z.object({
  permitId: z.string().min(1),
  status: z.enum(["NOT_STARTED", "DOCUMENTS_NEEDED", "SUBMITTED", "APPROVED", "REJECTED"]),
  referenceNumber: z.string().trim().max(120),
  noteToTraveler: z.string().trim().max(2000),
  notifyTraveler: z.boolean(),
});

// The traveler gets an email when one of these is reached
const EMAIL_ON = ["DOCUMENTS_NEEDED", "SUBMITTED", "APPROVED", "REJECTED"];

export async function adminUpdatePermit(input: z.input<typeof schema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const p = parsed.data;
  if (p.status === "DOCUMENTS_NEEDED" && !p.noteToTraveler) {
    return { ok: false, error: "Tell the traveler which documents you need (note to traveler)." };
  }

  const permit = await db.permit.findUnique({
    where: { id: p.permitId },
    include: {
      region: { select: { name: true } },
      booking: { select: { id: true, bookingCode: true, tourist: { select: { email: true, name: true } } } },
    },
  });
  if (!permit) return { ok: false, error: "Permit not found." };

  const now = new Date();
  await db.permit.update({
    where: { id: p.permitId },
    data: {
      status: p.status,
      referenceNumber: p.referenceNumber || null,
      noteToTraveler: p.noteToTraveler || null,
      submittedAt: p.status === "SUBMITTED" && !permit.submittedAt ? now : permit.submittedAt,
      decidedAt: p.status === "APPROVED" || p.status === "REJECTED" ? now : null,
    },
  });
  await audit({
    actorId: admin.id,
    action: "permit.update",
    targetType: "Booking",
    targetId: permit.booking.id,
    details: { region: permit.region.name, from: permit.status, to: p.status, reference: p.referenceNumber || null },
  });

  const statusChanged = permit.status !== p.status;
  if (p.notifyTraveler && statusChanged && EMAIL_ON.includes(p.status)) {
    const info = PERMIT_STATUS[p.status];
    await sendEmail({
      to: permit.booking.tourist.email,
      subject: `Permit update for ${permit.region.name}: ${info.label} — ${permit.booking.bookingCode}`,
      html: simpleEmail(`${permit.region.name} permit: ${info.label}`, [
        `Hi ${permit.booking.tourist.name?.split(/\s+/)[0] ?? "there"}, here's an update on your permit for ${permit.region.name}.`,
        info.traveler,
        ...(p.noteToTraveler ? [`Note from our team: ${p.noteToTraveler}`] : []),
        `See your booking: ${env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${permit.booking.id}`,
      ]),
    });
  }

  revalidatePath(`/admin/bookings/${permit.booking.id}`);
  revalidatePath("/admin/permits");
  revalidatePath("/admin");
  revalidatePath(`/dashboard/bookings/${permit.booking.id}`);
  return { ok: true, message: statusChanged ? `Permit marked ${PERMIT_STATUS[p.status].label.toLowerCase()}.` : "Permit saved." };
}
