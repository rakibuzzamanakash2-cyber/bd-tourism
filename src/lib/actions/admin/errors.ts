"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

/** Mark a bug as dealt with. It reopens itself if it happens again. */
export async function resolveErrorAction(id: string, resolved: boolean): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admins only." };

  const row = await db.errorLog
    .update({ where: { id }, data: { resolvedAt: resolved ? new Date() : null } })
    .catch(() => null);
  if (!row) return { ok: false, error: "That error is no longer listed." };

  await audit({ actorId: admin.id, action: "ops.error.resolve", targetType: "ErrorLog", targetId: id, details: { resolved } });
  revalidatePath("/admin/errors");
  revalidatePath("/admin");
  return { ok: true, message: resolved ? "Marked as sorted." : "Reopened." };
}
