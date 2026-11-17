"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { RATE_LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/report-error";

/**
 * Lets the browser tell us a page blew up. Called from the error boundary,
 * which is a client component and so cannot write to the database itself.
 *
 * Anyone can call this, so it is rate limited and takes only a message and a
 * digest — never a stack from the client, which would be attacker-controlled
 * text going straight into our admin screen.
 */
export async function reportClientErrorAction(input: { message: string; digest?: string }): Promise<void> {
  const ip = await clientIp();
  const limited = await rateLimit(`error:ip:${ip}`, RATE_LIMITS.errorIp);
  if (!limited.ok) return;

  const session = await auth().catch(() => null);
  const path = (await headers()).get("referer");

  await reportError(new Error(String(input.message ?? "").slice(0, 500)), {
    where: "page",
    path,
    digest: input.digest ? String(input.digest).slice(0, 64) : null,
    userId: session?.user?.id ?? null,
  });
}
