"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Compass, House, MapPinned, Route, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { BookOptions } from "@/lib/book-options";
import { bdt } from "@/lib/guide-shared";
import { cn } from "@/lib/utils";

type Props = {
  /** What they're booking, e.g. "Ratargul swamp forest" */
  title: string;
  options: BookOptions;
  /** The booking wizard for a custom trip here, e.g. /book/custom?district=sylhet */
  customHref: string;
  /** On a destination page: first suggest exploring the district's places */
  explore?: { href: string; districtName: string; places: number };
  /** Where "Continue to booking" goes (a booking page); without it, the popup moves on */
  continueHref?: string;
  label?: string;
  className?: string;
};

const trigger = "inline-flex items-center justify-center gap-2 rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-forest-800";

/**
 * The Book button. Every choice ends in the same booking process: a tour's
 * booking page, a homestay's, or the custom-trip wizard.
 */
export function BookDialog({ title, options, customHref, explore, continueHref, label = "Book", className }: Props) {
  const hasOptions = options.tours.length + options.homestays.length + options.guides.length > 0;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"explore" | "options">(explore ? "explore" : "options");
  const router = useRouter();

  // Nothing ready-made to choose from: go straight to the booking form
  if (!explore && !hasOptions) {
    return (
      <Link href={customHref} className={cn(trigger, className)}>
        <CalendarCheck className="size-4" aria-hidden /> {label}
      </Link>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setStep(explore ? "explore" : "options");
      }}
    >
      <DialogTrigger className={cn(trigger, className)}>
        <CalendarCheck className="size-4" aria-hidden /> {label}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Visit {title}</DialogTitle>
          <DialogDescription>
            {step === "explore" ? "Before you book, have a look around." : "Book a ready-made trip, or have us plan one around you."}
          </DialogDescription>
        </DialogHeader>

        {step === "explore" && explore && (
          <div className="space-y-4">
            <div className="rounded-lg bg-forest-100 p-5">
              <MapPinned className="size-6 text-forest-800" aria-hidden />
              <p className="mt-3 font-medium">Explore {explore.districtName} first</p>
              <p className="mt-1 text-sm text-ink-soft">
                {explore.places > 0
                  ? `${explore.districtName} has ${explore.places} places to visit, plus local food to try. You'll plan a better trip if you see them first.`
                  : `See what else ${explore.districtName} has to offer before you plan.`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href={explore.href} onClick={() => setOpen(false)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-900 px-5 py-2.5 text-sm font-medium text-paper hover:bg-forest-800">
                Explore {explore.districtName} <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (!continueHref) return setStep("options");
                  setOpen(false);
                  router.push(continueHref);
                }}
                className="flex-1 rounded-full border border-forest-900/20 px-5 py-2.5 text-sm hover:bg-forest-100"
              >
                Continue to booking
              </button>
            </div>
          </div>
        )}

        {step === "options" && (
          <div className="space-y-5">
            {options.tours.length > 0 && (
              <OptionGroup icon={Route} title="Tours that go here">
                {options.tours.map((t) => (
                  <OptionLink key={t.slug} href={`/book/${t.slug}`} title={t.title} meta={`${t.days} ${t.days === 1 ? "day" : "days"} · from $${t.fromUSD} per person`} />
                ))}
              </OptionGroup>
            )}
            {options.homestays.length > 0 && (
              <OptionGroup icon={House} title="Stay with a family nearby">
                {options.homestays.map((h) => (
                  <OptionLink key={h.slug} href={`/homestays/${h.slug}`} title={h.name} meta={`${h.area} · from ${bdt(h.firstNightBDT)}`} />
                ))}
              </OptionGroup>
            )}
            {options.guides.length > 0 && (
              <OptionGroup icon={UserRound} title="Local guides">
                {options.guides.map((g) => (
                  <OptionLink key={g.slug} href={`/guides/${g.slug}`} title={g.name} meta={g.languages.join(", ")} />
                ))}
              </OptionGroup>
            )}
            <Link href={customHref} className="flex w-full items-center gap-4 rounded-lg border border-dashed border-forest-900/30 p-4 text-left hover:bg-forest-100/60">
              <Compass className="size-6 shrink-0 text-forest-800" aria-hidden />
              <span className="flex-1">
                <span className="block font-medium">Book a custom trip here</span>
                <span className="text-sm text-ink-soft">Your dates, your pace. We send a plan and a price within 24 hours.</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-ink-mute" aria-hidden />
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OptionGroup({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-forest-700">
        <Icon className="size-4" /> {title}
      </p>
      <div className="divide-y divide-forest-900/10 rounded-lg border border-forest-900/10">{children}</div>
    </div>
  );
}

function OptionLink({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-forest-100/60">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-xs text-ink-mute">{meta}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-ink-mute" aria-hidden />
    </Link>
  );
}
