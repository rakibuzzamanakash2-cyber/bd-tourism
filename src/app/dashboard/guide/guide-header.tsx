import { GuideLanguageToggle } from "@/components/guide/trip-response";
import { cn } from "@/lib/utils";

export function GuideHeader({ lang, title, intro }: { lang: "en" | "bn"; title: string; intro?: string }) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className={cn("font-display text-4xl leading-tight", lang === "bn" && "font-bengali leading-snug")}>{title}</h1>
        {intro && <p className="mt-3 text-ink-soft">{intro}</p>}
      </div>
      <GuideLanguageToggle lang={lang} />
    </div>
  );
}
