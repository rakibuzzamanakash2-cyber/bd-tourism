"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email-verification";
import { RATE_LIMITS, rateLimit, tooManyMessage } from "@/lib/rate-limit";

export async function resendVerificationAction(): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: "Please sign in again." };
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true, emailVerified: true } });
  if (!user) return { ok: false, message: "Please sign in again." };
  if (user.emailVerified) return { ok: true, message: "Your email is already confirmed." };
  const limited = await rateLimit(`verify:email:${user.email}`, RATE_LIMITS.resetEmail);
  if (!limited.ok) return { ok: false, message: tooManyMessage(limited.retryAfterSeconds) };
  const sent = await sendVerificationEmail(user);
  return sent ? { ok: true, message: `We've sent a new link to ${user.email}.` } : { ok: false, message: "The email couldn't be sent right now. Please try again later." };
}
