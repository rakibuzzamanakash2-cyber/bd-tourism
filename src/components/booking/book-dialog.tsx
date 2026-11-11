"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Compass, House, MapPinned, Route, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TripRequestForm } from "@/components/booking/trip-request-form";
import type { BookOptions } from "@/lib/book-options";
import { bdt } from "@/lib/guide-shared";
import { cn } from "@/lib/utils";

type Props = {
  /** What they're booking, e.g. "Ratargul swamp forest" */
  title: string;
  /** Where the request came from */
  context: { districtId?: string; placeId?: string; destinationId?: string };
  options: BookOptions;
  defaults?: { name?: string; email?: string };
  /** On a destination page: first suggest exploring the district's places */
  explore?: { href: string; districtName: string; places: number };
  /** Where "Continue to booking" goes (a booking page); without it, the popup moves on */
  continueHref?: string;
  label?: string;
  className?: string;
};

type Step = "explore" | "options" | "form" | "done";


export function BookDialog({ title, context, options, defaults, explore, continueHref, label = "Book", className }: Props) {
  const hasOptions = options.tours.length + options.homestays.length + options.guides.length > 0;
  const firstStep: Step = explore ? "explore" : hasOptions ? "options" : "form";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(firstStep);
  const router = useRouter();

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) setStep(firstStep);
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-forest-800",
          className,
        )}
      >
        <CalendarCheck className="size-4" aria-hidden /> {label}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {step === "done" ? "Request sent" : `Visit ${title}`}
          </DialogTitle>
          <DialogDescription>
            {step === "explore" && "Before you book, have a look around."}
            {step === "options" && "Book a ready-made trip, or ask us to plan one around you."}
            {step === "form" && "Tell us your dates and group. We'll reply within 24 hours with a plan and a price."}
            {step === "done" && "Thanks! We'll email you within 24 hours."}
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
                  if (!continueHref) return setStep(hasOptions ? "options" : "form");
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
                  <OptionLink key={t.slug} href={`/packages/${t.slug}`} title={t.title} meta={`${t.days} ${t.days === 1 ? "day" : "days"} · from $${t.fromUSD}`} />
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
            <button type="button" onClick={() => setStep("form")} className="flex w-full items-center gap-4 rounded-lg border border-dashed border-forest-900/30 p-4 text-left hover:bg-forest-100/60">
              <Compass className="size-6 shrink-0 text-forest-800" aria-hidden />
              <span>
                <span className="block font-medium">Plan a custom trip here</span>
                <span className="text-sm text-ink-soft">Your dates, your pace. We send a plan and a price.</span>
              </span>
            </button>
          </div>
        )}

        {step === "form" && (
          <TripRequestForm
            title={title}
            context={context}
            defaults={defaults}
            onDone={() => setStep("done")}
            onBack={hasOptions ? () => setStep("options") : undefined}
          />
        )}

        {step === "done" && (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              We&rsquo;ve emailed you a copy. Our team will send a suggested plan and price for {title} within 24 hours.
            </p>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper hover:bg-forest-800">
              Done
            </button>
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
