import Link from "next/link";
import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Invite link", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TEXT = {
  en: {
    expired: ["This invite link has expired", "Invite links work for 14 days. Message us and we'll send you a fresh one, or start your application without it."],
    used: ["This invite link has already been used", "If you started your application with a different account or browser, sign in with that account to continue. Otherwise, message us and we'll help."],
    invalid: ["We couldn't find this invite link", "Please check the whole link was copied. If it still doesn't work, message us on WhatsApp."],
    whatsapp: "Message us on WhatsApp",
    whatsappText: "Hi DeltaWay, my invite link to apply doesn't work. Can you send me a new one?",
    applyGuide: "Apply as a guide",
    applyHost: "Apply as a host",
    signIn: "Sign in",
    other: "বাংলায় দেখুন",
  },
  bn: {
    expired: ["এই আমন্ত্রণ লিংকের মেয়াদ শেষ", "আমন্ত্রণ লিংক ১৪ দিন কাজ করে। আমাদের মেসেজ দিন, নতুন লিংক পাঠিয়ে দেব। চাইলে লিংক ছাড়াও আবেদন শুরু করতে পারেন।"],
    used: ["এই আমন্ত্রণ লিংকটি আগেই ব্যবহার হয়েছে", "অন্য অ্যাকাউন্ট বা ব্রাউজার দিয়ে আবেদন শুরু করে থাকলে সেই অ্যাকাউন্টে সাইন ইন করে চালিয়ে যান। না হলে আমাদের মেসেজ দিন, আমরা সাহায্য করব।"],
    invalid: ["এই আমন্ত্রণ লিংকটি খুঁজে পাওয়া যায়নি", "পুরো লিংকটি কপি হয়েছে কি না দেখুন। তারপরও কাজ না করলে হোয়াটসঅ্যাপে মেসেজ দিন।"],
    whatsapp: "হোয়াটসঅ্যাপে মেসেজ দিন",
    whatsappText: "আসসালামু আলাইকুম DeltaWay, আমার আবেদনের লিংকটি কাজ করছে না। নতুন লিংক পাঠাবেন?",
    applyGuide: "গাইড হিসেবে আবেদন",
    applyHost: "হোস্ট হিসেবে আবেদন",
    signIn: "সাইন ইন",
    other: "View in English",
  },
} as const;

export default async function InviteProblemPage({ searchParams }: Props) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const status = one("status") === "expired" || one("status") === "used" ? (one("status") as "expired" | "used") : "invalid";
  const lang = one("lang") === "en" ? "en" : "bn";
  const kind = one("kind") === "host" ? "host" : one("kind") === "guide" ? "guide" : null;
  const t = TEXT[lang];
  const [title, body] = t[status];
  const q = (l: string) => `/invite?status=${status}${kind ? `&kind=${kind}` : ""}&lang=${l}`;
  const applyQ = lang === "bn" ? "?lang=bn" : "";

  return (
    <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="flex justify-end">
        <Link href={q(lang === "bn" ? "en" : "bn")} className={cn("rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100", lang === "en" && "font-bengali")}>
          {t.other}
        </Link>
      </div>
      <h1 className={cn("mt-6 font-display text-4xl leading-tight", lang === "bn" && "font-bengali leading-snug")}>{title}</h1>
      <p className="mt-4 text-ink-soft">{body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={whatsappLink(t.whatsappText)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-forest-900 text-paper hover:bg-forest-800")}
        >
          <MessageCircle className="size-4" /> {t.whatsapp}
        </a>
        {status === "used" && (
          <Link href={`/login?callbackUrl=${encodeURIComponent("/dashboard/application")}`} className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full border border-forest-900/20")}>
            {t.signIn}
          </Link>
        )}
        {status !== "used" && (kind !== "host") && (
          <Link href={`/apply/guide${applyQ}`} className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full border border-forest-900/20")}>
            {t.applyGuide}
          </Link>
        )}
        {status !== "used" && (kind !== "guide") && (
          <Link href={`/apply/host${applyQ}`} className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full border border-forest-900/20")}>
            {t.applyHost}
          </Link>
        )}
      </div>
    </section>
  );
}
