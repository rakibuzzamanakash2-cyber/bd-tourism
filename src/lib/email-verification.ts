import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { env, features } from "@/lib/env";
import { sendEmail, simpleEmail } from "@/lib/email";

const TTL_MS = 48 * 60 * 60 * 1000;
const identifierFor = (email: string) => `verify-email:${email.toLowerCase()}`;
// Only a hash of the token is stored, like password-reset links
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

/** Booking needs a verified email, but only once emails can actually be sent. */
export const verificationRequired = () => features.email;

export async function sendVerificationEmail(user: { email: string; name: string | null }): Promise<boolean> {
  const token = randomBytes(32).toString("hex");
  const identifier = identifierFor(user.email);
  await db.$transaction([
    db.verificationToken.deleteMany({ where: { identifier } }),
    db.verificationToken.create({ data: { identifier, token: hash(token), expires: new Date(Date.now() + TTL_MS) } }),
  ]);
  const url = `${env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${token}`;
  const sent = await sendEmail({
    to: user.email,
    subject: "Confirm your email — DeltaWay",
    html: simpleEmail(
      `Hi ${user.name?.split(/\s+/)[0] ?? "there"}, please confirm your email`,
      ["Tap the button to confirm this is your email address. You'll need it confirmed before you book, so we can send your tickets, permits and receipts.", "The link works for 48 hours. If you didn't sign up for DeltaWay, ignore this email."],
      { label: "Confirm my email", url },
    ),
  });
  // On your own PC without an email service, the link goes to the terminal
  if (!sent.success && env.NODE_ENV !== "production") console.log(`[verify-email] Email not sent. Link for ${user.email}:\n${url}`);
  return sent.success;
}

/** Marks the email verified if the token is good. Returns the user id, or null. */
export async function verifyEmailToken(token: string): Promise<string | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await db.verificationToken.findUnique({ where: { token: hash(token) } });
  if (!row || !row.identifier.startsWith("verify-email:")) return null;
  await db.verificationToken.delete({ where: { token: row.token } });
  if (row.expires < new Date()) return null;
  const email = row.identifier.slice("verify-email:".length);
  const user = await db.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } });
  if (!user) return null;
  if (!user.emailVerified) await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  return user.id;
}
