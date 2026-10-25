import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Records an admin action in the activity log. Never throws. */
export async function audit(entry: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Prisma.InputJsonValue;
}) {
  try {
    await db.auditLog.create({ data: entry });
  } catch (err) {
    console.error("[audit] failed to record", entry.action, err);
  }
}
