"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyTeam, sendEmail, simpleEmail } from "@/lib/email";
import { RATE_LIMITS, clientIp, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import { site } from "@/lib/site";

// ============================================================
// CONTACT FORM
// ============================================================

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(200),
  subject: z.string().trim().min(3, "Subject is too short").max(150),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(5000),
  // Honeypot: hidden from people, bots fill it in
  website: z.string().optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactResult = { success: true } | { success: false; error: string };

export async function sendContactMessageAction(input: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { name, email, subject, message, website } = parsed.data;

  // Pretend success for bots so they don't retry
  if (website) return { success: true };

  const limited = await rateLimit(`contact:ip:${await clientIp()}`, RATE_LIMITS.contactIp);
  if (!limited.ok) return { success: false, error: tooManyMessage(limited.retryAfterSeconds) };

  const session = await auth();
  await db.contactMessage.create({
    data: { name, email, subject, message, userId: session?.user?.id ?? null },
  });

  // Emails are best-effort: the message is already safely stored
  await Promise.all([
    notifyTeam({
      subject: `New message: ${subject}`,
      replyTo: email,
      lines: [`From: ${name} <${email}>`, `Subject: ${subject}`, message],
    }),
    sendEmail({
      to: email,
      subject: `We got your message — ${site.name}`,
      html: simpleEmail("Thanks, we got your message.", [
        `Hi ${name.split(/\s+/)[0]}, thanks for getting in touch. We usually reply within 24 hours.`,
        `For anything urgent, message us on WhatsApp: ${site.whatsappDisplay}.`,
        `Your message:\n${message}`,
      ]),
    }),
  ]);

  return { success: true };
}

// ============================================================
// HOMESTAY WAITLIST
// ============================================================

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(200),
  website: z.string().optional(),
});

export type WaitlistState = { success?: boolean; error?: string } | null;

export async function joinHomestayWaitlistAction(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = waitlistSchema.safeParse({
    email: formData.get("email"),
    website: formData.get("website") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid email" };
  }
  if (parsed.data.website) return { success: true };

  const limited = await rateLimit(`waitlist:ip:${await clientIp()}`, RATE_LIMITS.waitlistIp);
  if (!limited.ok) return { error: tooManyMessage(limited.retryAfterSeconds) };

  // Joining twice is fine — same friendly answer, no duplicate row
  await db.waitlistEntry.upsert({
    where: { email_kind: { email: parsed.data.email, kind: "HOMESTAY" } },
    create: { email: parsed.data.email, kind: "HOMESTAY" },
    update: {},
  });

  return { success: true };
}
