import "server-only";
import { cookies, headers } from "next/headers";
import type { ApplicationInvite } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { kindParam } from "@/lib/applications";

type Kind = "GUIDE" | "HOST";
export type InviteLang = "en" | "bn";

/** Cookie that carries an invite through sign-up and Google sign-in. */
export const INVITE_COOKIE = "dw_invite";
export const INVITE_DAYS = 14;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);
export const isLocalOrigin = (origin: string) => {
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch {
    return true;
  }
};

/**
 * The address people should use to reach the site.
 * Normally NEXT_PUBLIC_APP_URL. But when that still says localhost (a dev
 * machine) and the admin is using the site through another address (the PC's
 * Wi-Fi IP, a tunnel, a Vercel preview), use that address instead, so the
 * link also opens on someone else's phone.
 */
export async function siteOrigin(): Promise<string> {
  const configured = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (!isLocalOrigin(configured)) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return configured;
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** Short link that goes in WhatsApp: /i/<token> */
export const inviteLink = (origin: string, token: string) => `${origin}/i/${token}`;

export type InviteState = "valid" | "expired" | "used";
export function inviteState(i: Pick<ApplicationInvite, "usedAt" | "expiresAt">, now = new Date()): InviteState {
  if (i.usedAt) return "used";
  if (i.expiresAt <= now) return "expired";
  return "valid";
}

/** Where the invite should land: the right form, in the invite's language. */
export const applyPathFor = (kind: Kind, lang: string) => `/apply/${kindParam(kind)}${lang === "bn" ? "?lang=bn" : ""}`;

/** The invite in this browser's cookie, if it's still usable for this kind. */
export async function currentInvite(kind?: Kind) {
  const token = (await cookies()).get(INVITE_COOKIE)?.value?.slice(0, 100);
  if (!token) return null;
  const invite = await db.applicationInvite.findUnique({ where: { token } });
  if (!invite || inviteState(invite) !== "valid") return null;
  if (kind && invite.kind !== kind) return null;
  return invite;
}

// ============================================================
// Messages
// ============================================================
const role = (kind: Kind, lang: InviteLang) =>
  lang === "bn" ? (kind === "GUIDE" ? "গাইড" : "হোমস্টে হোস্ট") : kind === "GUIDE" ? "guide" : "homestay host";

/** The text sent on WhatsApp (or copied into SMS / Messenger). */
export function inviteMessage(kind: Kind, name: string | null, link: string, lang: InviteLang): string {
  const first = name ? ` ${name.split(/\s+/)[0]}` : "";
  if (lang === "bn") {
    return (
      `আসসালামু আলাইকুম${first}! আমি DeltaWay থেকে বলছি। ${role(kind, "bn")} হিসেবে আবেদনের জন্য এটি আপনার নিজস্ব লিংক (১০ মিনিটের মতো লাগবে, যেকোনো সময় থেমে পরে শেষ করতে পারবেন):\n${link}\n\n` +
      `লিংকটি ${INVITE_DAYS} দিন কাজ করবে। কোনো সমস্যা হলে এখানেই উত্তর দিন।`
    );
  }
  return (
    `Assalamu alaikum${first}! This is DeltaWay. Here is your personal link to apply as a ${role(kind, "en")} (about 10 minutes, and you can stop and finish later):\n${link}\n\n` +
    `The link works for ${INVITE_DAYS} days. If anything goes wrong, just reply here.`
  );
}

/** wa.me link that opens WhatsApp with the invite message ready to send. */
export function inviteWhatsapp(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`;
}

export function inviteEmail(kind: Kind, name: string | null, link: string, lang: InviteLang) {
  const first = name ? ` ${name.split(/\s+/)[0]}` : "";
  return lang === "bn"
    ? {
        subject: `${role(kind, "bn")} হিসেবে আবেদনের আমন্ত্রণ — DeltaWay`,
        heading: `আসসালামু আলাইকুম${first}!`,
        lines: [
          `DeltaWay-তে ${role(kind, "bn")} হিসেবে আবেদনের জন্য আপনাকে আমন্ত্রণ জানাচ্ছি। আবেদনে ১০ মিনিটের মতো লাগবে, আর যেকোনো সময় থেমে পরে শেষ করতে পারবেন।`,
          `লিংকটি ${INVITE_DAYS} দিন কাজ করবে। প্রশ্ন থাকলে এই ইমেইলের উত্তর দিন।`,
        ],
        cta: "আবেদন শুরু করুন",
      }
    : {
        subject: `Your invitation to apply as a DeltaWay ${role(kind, "en")}`,
        heading: `Assalamu alaikum${first}!`,
        lines: [
          `We'd like to invite you to apply as a ${role(kind, "en")} with DeltaWay. It takes about 10 minutes, and you can stop and finish later.`,
          `The link works for ${INVITE_DAYS} days. Questions? Just reply to this email.`,
        ],
        cta: "Start your application",
      };
}

/** wa.me link to message someone directly. */
export function whatsappTo(phone: string): string {
  return `https://wa.me/${phone.replace(/^\+/, "")}`;
}
