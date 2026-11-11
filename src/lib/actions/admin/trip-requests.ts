"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "REPLIED", "BOOKED", "CLOSED"]),
  adminNote: z.string().trim().max(5000),
});

export async function updateTripRequestAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = schema.safeParse({
    id: formData.get("id") ?? "",
    status: formData.get("status") ?? "",
    adminNote: formData.get("adminNote") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Please check the form." };
  const v = parsed.data;
  const updated = await db.tripRequest.update({ where: { id: v.id }, data: { status: v.status, adminNote: v.adminNote || null } }).catch(() => null);
  if (!updated) return { ok: false, error: "Request not found." };
  await audit({ actorId: admin.id, action: "trip_request.update", targetType: "TripRequest", targetId: v.id, details: { status: v.status } });
  revalidatePath("/admin/trip-requests");
  return { ok: true, message: "Saved." };
}
