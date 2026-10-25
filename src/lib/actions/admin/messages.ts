"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const schema = z.object({
  messageId: z.string().min(1),
  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]),
});

export async function adminSetMessageStatus(input: z.input<typeof schema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const msg = await db.contactMessage.findUnique({ where: { id: parsed.data.messageId }, select: { status: true } });
  if (!msg) return { ok: false, error: "Message not found." };
  await db.contactMessage.update({ where: { id: parsed.data.messageId }, data: { status: parsed.data.status } });
  await audit({
    actorId: admin.id,
    action: "contact.status",
    targetType: "ContactMessage",
    targetId: parsed.data.messageId,
    details: { from: msg.status, to: parsed.data.status },
  });
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${parsed.data.messageId}`);
  return { ok: true, message: "Updated." };
}
