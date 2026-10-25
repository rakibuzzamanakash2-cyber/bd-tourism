import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

type Rule = { limit: number; windowSeconds: number };

/** Limits per action. Tune here; every caller uses these. */
export const RATE_LIMITS = {
  /** Sign-in attempts for one email address */
  loginEmail: { limit: 10, windowSeconds: 15 * 60 },
  /** Sign-in attempts from one IP address (many accounts) */
  loginIp: { limit: 30, windowSeconds: 15 * 60 },
  /** Direct calls to the credentials endpoint, bypassing our form */
  authorizeIp: { limit: 60, windowSeconds: 15 * 60 },
  signupIp: { limit: 5, windowSeconds: 60 * 60 },
  resetEmail: { limit: 3, windowSeconds: 60 * 60 },
  resetIp: { limit: 10, windowSeconds: 60 * 60 },
  bookingUser: { limit: 10, windowSeconds: 60 * 60 },
  paymentUser: { limit: 10, windowSeconds: 10 * 60 },
} satisfies Record<string, Rule>;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Counts one hit against `key` and says whether it's still within the limit.
 *
 * Fixed window, stored in Postgres so it works across serverless instances.
 * One atomic statement: either starts a fresh window or adds 1 to the current
 * one. Fails open — if the database errors, the request is allowed (and the
 * error is logged) rather than locking everyone out.
 */
export async function rateLimit(key: string, rule: Rule): Promise<RateLimitResult> {
  try {
    const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, timezone('utc', now()) + ${rule.windowSeconds}::integer * interval '1 second')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= timezone('utc', now())
                       THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= timezone('utc', now())
                         THEN timezone('utc', now()) + ${rule.windowSeconds}::integer * interval '1 second'
                         ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;

    // Tidy up long-expired rows now and then (about 1 call in 100)
    if (Math.random() < 0.01) {
      void db.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < timezone('utc', now()) - interval '1 day'`.catch(() => {});
    }

    const row = rows[0];
    if (!row || row.count <= rule.limit) return { ok: true };
    const retryAfterSeconds = Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
    return { ok: false, retryAfterSeconds };
  } catch (err) {
    console.error("[rate-limit] check failed, allowing request:", err);
    return { ok: true };
  }
}

/** Best-effort client IP from the proxy headers set by Vercel or other hosts. */
export function ipFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Client IP for the current server action or page request. */
export async function clientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

/** "Please wait 12 minutes" style message for a blocked request. */
export function tooManyMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  const wait = minutes <= 1 ? "a minute" : `${minutes} minutes`;
  return `Too many attempts. Please wait ${wait} and try again.`;
}
