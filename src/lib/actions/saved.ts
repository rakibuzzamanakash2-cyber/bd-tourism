"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { RATE_LIMITS, rateLimit, tooManyMessage } from "@/lib/rate-limit";

const schema = z.object({
  kind: z.enum(["destination", "package"]),
  id: z.string().min(1).max(64),
});

export type ToggleSavedResult =
  | { ok: true; saved: boolean }
  | { ok: false; needsLogin?: boolean; error: string };

/** Saves or un-saves a destination or tour for the signed-in user. */
export async function toggleSavedAction(input: z.input<typeof schema>): Promise<ToggleSavedResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, needsLogin: true, error: "Sign in to save" };
  const userId = session.user.id;

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const { kind, id } = parsed.data;

  const limited = await rateLimit(`saved:user:${userId}`, RATE_LIMITS.savedUser);
  if (!limited.ok) return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  let saved: boolean;
  if (kind === "destination") {
    const where = { userId_destinationId: { userId, destinationId: id } };
    const existing = await db.savedDestination.findUnique({ where });
    if (existing) {
      await db.savedDestination.delete({ where });
      saved = false;
    } else {
      const target = await db.destination.findFirst({ where: { id, isPublished: true }, select: { id: true } });
      if (!target) return { ok: false, error: "This destination is no longer available" };
      await db.savedDestination.create({ data: { userId, destinationId: id } });
      saved = true;
    }
  } else {
    const where = { userId_packageId: { userId, packageId: id } };
    const existing = await db.savedPackage.findUnique({ where });
    if (existing) {
      await db.savedPackage.delete({ where });
      saved = false;
    } else {
      const target = await db.tourPackage.findFirst({ where: { id, isPublished: true }, select: { id: true } });
      if (!target) return { ok: false, error: "This tour is no longer available" };
      await db.savedPackage.create({ data: { userId, packageId: id } });
      saved = true;
    }
  }

  revalidatePath("/dashboard/saved");
  return { ok: true, saved };
}
