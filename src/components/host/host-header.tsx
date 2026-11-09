"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setHostLanguageAction } from "@/lib/actions/host";
import { hostText } from "@/lib/i18n/host";
import { cn } from "@/lib/utils";

export function HostHeader({ lang, title, intro }: { lang: "en" | "bn"; title: string; intro?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className={cn("font-display text-4xl leading-tight", lang === "bn" && "font-bengali leading-snug")}>{title}</h1>
        {intro && <p className="mt-3 text-ink-soft">{intro}</p>}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await setHostLanguageAction(lang === "bn" ? "en" : "bn"); router.refresh(); })}
        className={cn("shrink-0 self-start rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100", lang === "en" && "font-bengali")}
      >
        {hostText[lang].switchTo}
      </button>
    </div>
  );
}
