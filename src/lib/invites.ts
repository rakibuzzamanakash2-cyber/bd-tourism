import "server-only";
import { env } from "@/lib/env";
import { kindParam } from "@/lib/applications";

type Kind = "GUIDE" | "HOST";

export function inviteLink(kind: Kind, token: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/apply/${kindParam(kind)}?invite=${token}`;
}

/** wa.me link that opens WhatsApp with the invite message ready to send. */
export function inviteWhatsapp(phone: string, kind: Kind, name: string | null, link: string): string {
  const first = name ? ` ${name.split(/\s+/)[0]}` : "";
  const role = kind === "GUIDE" ? "guide" : "homestay host";
  const text =
    `Assalamu alaikum${first}! This is DeltaWay. Here is your personal link to apply as a ${role} (English or Bangla, about 10 minutes):\n${link}\n\n` +
    `আসসালামু আলাইকুম! এটি DeltaWay। ${kind === "GUIDE" ? "গাইড" : "হোস্ট"} হিসেবে আবেদনের জন্য আপনার লিংক উপরে দেওয়া হলো।`;
  return `https://wa.me/${phone.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`;
}

/** wa.me link to message an applicant directly. */
export function whatsappTo(phone: string): string {
  return `https://wa.me/${phone.replace(/^\+/, "")}`;
}
