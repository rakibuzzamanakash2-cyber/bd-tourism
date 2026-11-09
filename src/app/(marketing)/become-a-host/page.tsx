import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  CookingPot,
  MessageCircle,
  ShieldCheck,
  Star,
  Sunrise,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/db";
import { creditsFor } from "@/lib/image-credits";
import { PhotoCredit } from "@/components/photo-credit";
import { EarningsCalculator } from "@/components/homestays/earnings-calculator";
import { buttonVariants } from "@/components/ui/button";
import { becomeHostText, toBn, type HostPageLang } from "@/lib/i18n/become-host";
import { whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "Become a host",
  description:
    "Host travelers in your home with DeltaWay. Receive 85% of every booking, get paid after every stay, and welcome verified guests from around the world.",
  alternates: { canonical: "/become-a-host" },
};

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1602800458591-eddda28a498b?w=1600&q=80";
const OFFER_ICONS = [BedDouble, CookingPot, Sunrise];
const CARE_ICONS = [ShieldCheck, Wallet, CalendarDays, MessageCircle, Star, Compass];

async function heroPhoto() {
  const d = await db.destination.findFirst({
    where: { slug: { in: ["srimangal-tea-gardens", "sylhet"] } },
    orderBy: { slug: "asc" }, // srimangal… before sylhet
    select: { featuredImage: true },
  });
  const url = d?.featuredImage || FALLBACK_PHOTO;
  const credit = (await creditsFor([url])).get(url);
  return { url, credit };
}

export default async function BecomeAHostPage({ searchParams }: Props) {
  const sp = await searchParams;
  const lang: HostPageLang = sp.lang === "bn" ? "bn" : "en";
  const t = becomeHostText[lang];
  const bnFont = lang === "bn" && "font-bengali";
  const applyHref = `/apply/host${lang === "bn" ? "?lang=bn" : ""}`;
  const photo = await heroPhoto();

  const applyButton = (
    <Link href={applyHref} className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-forest-900 px-8 text-paper hover:bg-forest-800")}>
      {t.apply} <ArrowRight className="size-4" />
    </Link>
  );

  return (
    <div lang={lang === "bn" ? "bn" : undefined} className={cn(lang === "bn" && "font-bengali")}>
      {/* Hero */}
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:px-8">
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="eyebrow text-forest-700">{t.eyebrow}</p>
              <Link
                href={lang === "bn" ? "/become-a-host" : "/become-a-host?lang=bn"}
                className={cn("rounded-full border border-forest-900/20 px-4 py-1.5 text-sm hover:bg-forest-100", lang === "en" && "font-bengali")}
              >
                {t.switchTo}
              </Link>
            </div>
            <h1 className={cn("font-display text-5xl leading-[0.98] sm:text-6xl", bnFont && "font-bengali leading-tight")}>
              {t.heroTitle[0]} <em className="italic text-forest-700">{t.heroTitle[1]}</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{t.heroIntro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {applyButton}
              <a href="#earnings" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full border border-forest-900/20")}>
                {t.seeEarnings}
              </a>
            </div>
            <p className="mt-4 text-sm text-ink-mute">{t.applyNote}</p>
          </div>
          <figure>
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image src={photo.url} alt={t.photoAlt} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <PhotoCredit credit={photo.credit} className="mt-2 text-ink-mute" />
          </figure>
        </div>
      </section>

      {/* Key facts */}
      <section className="border-b border-forest-900/10">
        <dl className="mx-auto grid max-w-7xl gap-px bg-forest-900/10 sm:grid-cols-2 lg:grid-cols-4">
          {t.facts.map(([big, small]) => (
            <div key={big} className="bg-paper px-6 py-8 sm:px-8">
              <dt className="font-display text-3xl text-forest-800">{big}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-soft">{small}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Earnings calculator */}
      <section id="earnings" className="scroll-mt-24 bg-forest-100/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">{t.calcEyebrow}</p>
          <h2 className="max-w-3xl font-display text-4xl sm:text-5xl">{t.calcTitle}</h2>
          <p className="mt-4 max-w-2xl text-ink-soft">{t.calcIntro}</p>
          <div className="mt-10">
            <EarningsCalculator lang={lang} />
          </div>
        </div>
      </section>

      {/* What guests come for */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <p className="eyebrow mb-4 text-forest-700">{t.offerEyebrow}</p>
        <h2 className="max-w-3xl font-display text-4xl sm:text-5xl">{t.offerTitle}</h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {t.offer.map(([title, body], i) => {
            const Icon = OFFER_ICONS[i];
            return (
              <div key={title}>
                <Icon className="size-8 text-clay-600" aria-hidden />
                <h3 className="mt-5 font-display text-2xl">{title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-forest-950 text-paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="eyebrow mb-4 text-forest-200">{t.stepsEyebrow}</p>
          <h2 className="max-w-3xl font-display text-4xl sm:text-5xl">{t.stepsTitle}</h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {t.steps.map(([title, body], i) => (
              <li key={title} className="border-t border-paper/20 pt-6">
                <span className="font-display text-5xl text-forest-200">{lang === "bn" ? toBn(i + 1) : i + 1}</span>
                <h3 className="mt-4 text-xl font-medium">{title}</h3>
                <p className="mt-3 leading-relaxed text-paper/70">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What we do */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <p className="eyebrow mb-4 text-forest-700">{t.careEyebrow}</p>
        <h2 className="max-w-3xl font-display text-4xl sm:text-5xl">{t.careTitle}</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.care.map(([title, body], i) => {
            const Icon = CARE_ICONS[i];
            return (
              <div key={title} className="rounded-lg border border-forest-900/10 bg-paper-warm p-6">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-forest-100 text-forest-800">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who can host + FAQ */}
      <section className="border-t border-forest-900/10 bg-paper-warm">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="eyebrow mb-4 text-forest-700">{t.whoEyebrow}</p>
            <h2 className="font-display text-4xl sm:text-5xl">{t.whoTitle}</h2>
            <ul className="mt-10 space-y-5">
              {t.who.map((line) => (
                <li key={line} className="flex gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-forest-700" aria-hidden />
                  <span className="leading-relaxed text-ink-soft">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4 text-forest-700">{t.faqEyebrow}</p>
            <h2 className="font-display text-4xl sm:text-5xl">{t.faqTitle}</h2>
            <div className="mt-10 divide-y divide-forest-900/10 border-y border-forest-900/10">
              {t.faq.map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="size-5 shrink-0 text-ink-mute transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final call */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h2 className="font-display text-4xl sm:text-6xl">{t.finalTitle}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">{t.finalBody}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {applyButton}
          <a
            href={whatsappLink(t.whatsappText)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full border border-forest-900/20")}
          >
            <MessageCircle className="size-4" /> {t.whatsapp}
          </a>
        </div>
        <p className="mt-4 text-sm text-ink-mute">{t.applyNote}</p>
      </section>
    </div>
  );
}
