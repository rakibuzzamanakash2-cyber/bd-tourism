"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(["TOURIST", "GUIDE", "HOST", "ADMIN"]),
});

export async function adminSetUserRole(input: z.input<typeof schema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { userId, role } = parsed.data;

  if (userId === admin.id && role !== "ADMIN") {
    return { ok: false, error: "You can't remove your own admin access. Ask another admin." };
  }
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!user) return { ok: false, error: "User not found." };
  if (user.role === role) return { ok: true, message: "No change." };

  await db.user.update({ where: { id: userId }, data: { role } });
  await audit({ actorId: admin.id, action: "user.role", targetType: "User", targetId: userId, details: { from: user.role, to: role } });
  revalidatePath("/admin/users");
  return { ok: true, message: `${user.email} is now ${role.toLowerCase()}. It applies within 5 minutes.` };
}
