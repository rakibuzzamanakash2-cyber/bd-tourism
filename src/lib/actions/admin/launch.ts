"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { LAUNCH_MODE_KEY, type LaunchMode } from "@/lib/launch-mode";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

/** Turn online card payments on or off for the whole site. */
export async function setLaunchModeAction(mode: LaunchMode): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admins only." };
  if (mode !== "requests" && mode !== "payments") return { ok: false, error: "Unknown mode." };

  await db.setting.upsert({
    where: { key: LAUNCH_MODE_KEY },
    update: { value: mode },
    create: { key: LAUNCH_MODE_KEY, value: mode },
  });
  await audit({ actorId: admin.id, action: "settings.launchMode.update", targetType: "Setting", targetId: LAUNCH_MODE_KEY, details: { mode } });

  // Wording changes across the public site and the dashboard.
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: mode === "payments" ? "Online payments are on." : "Switched to taking requests only.",
  };
}
