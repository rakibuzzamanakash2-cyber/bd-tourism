import { db } from "@/lib/db";

/**
 * Whether the site takes money yet.
 *
 * "requests" — every trip, tour or custom, becomes a request. We reply with a
 *   plan and a price, and arrange payment off-site. This is how the site
 *   launches, before the trade licence and the live SSLCommerz store exist.
 *
 * "payments" — tours with a fixed price are paid for online at the time of
 *   booking, the way the checkout was originally built.
 *
 * Switching is a setting, not a deploy: Admin > Settings.
 */
export type LaunchMode = "requests" | "payments";

export const LAUNCH_MODE_KEY = "launchMode";

/** Requests, unless someone has deliberately turned payments on. */
export async function readLaunchMode(): Promise<LaunchMode> {
  const row = await db.setting.findUnique({ where: { key: LAUNCH_MODE_KEY } }).catch(() => null);
  return row?.value === "payments" ? "payments" : "requests";
}

export const takesPaymentNow = (mode: LaunchMode) => mode === "payments";
