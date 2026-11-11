"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Compass, House, MapPinned, Route, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createTripRequestAction } from "@/lib/actions/trip-request";
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
  label?: string;
  className?: string;
};

type Step = "explore" | "options" | "form" | "done";

const inputClass =
  "w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-700/15";

export function BookDialog({ title, context, options, defaults, explore, label = "Book", className }: Props) {
  const hasOptions = options.tours.length + options.homestays.length + options.guides.length > 0;
  const firstStep: Step = explore ? "explore" : hasOptions ? "options" : "form";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(firstStep);
  const [pending, start] = useTransition();
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      setStep(firstStep);
      setError(null);
    }
  };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string | null) ?? "";
    start(async () => {
      const r = await createTripRequestAction({
        name: get("name"),
        email: get("email"),
        phone: get("phone"),
        country: get("country"),
        travelers: get("travelers"),
        startDate: get("startDate"),
        days: get("days"),
        message: get("message"),
        website: get("website"),
        ...context,
      });
      if (!r.ok) {
        setError({ field: r.field, message: r.error });
        return void toast.error(r.error);
      }
      setStep("done");
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const fieldError = (f: string) => error?.field === f && <p className="mt-1 text-xs text-clay-700">{error.message}</p>;

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
              <button type="button" onClick={() => setStep(hasOptions ? "options" : "form")} className="flex-1 rounded-full border border-forest-900/20 px-5 py-2.5 text-sm hover:bg-forest-100">
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
          <form onSubmit={submit} className="space-y-3" noValidate>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-ink-mute">
                Your name
                <input name="name" required defaultValue={defaults?.name} autoComplete="name" className={`${inputClass} mt-1`} />
                {fieldError("name")}
              </label>
              <label className="text-xs text-ink-mute">
                Email
                <input name="email" type="email" required defaultValue={defaults?.email} autoComplete="email" className={`${inputClass} mt-1`} />
                {fieldError("email")}
              </label>
              <label className="text-xs text-ink-mute">
                WhatsApp or phone <span className="text-ink-mute/70">(optional)</span>
                <input name="phone" type="tel" autoComplete="tel" className={`${inputClass} mt-1`} />
              </label>
              <label className="text-xs text-ink-mute">
                Country <span className="text-ink-mute/70">(optional)</span>
                <input name="country" autoComplete="country-name" className={`${inputClass} mt-1`} />
              </label>
              <label className="text-xs text-ink-mute">
                Arriving around
                <input name="startDate" type="date" min={today} className={`${inputClass} mt-1`} />
                {fieldError("startDate")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-ink-mute">
                  Days
                  <input name="days" type="number" min={1} max={60} placeholder="3" className={`${inputClass} mt-1`} />
                </label>
                <label className="text-xs text-ink-mute">
                  People
                  <input name="travelers" type="number" min={1} max={30} defaultValue={2} required className={`${inputClass} mt-1`} />
                  {fieldError("travelers")}
                </label>
              </div>
            </div>
            <label className="block text-xs text-ink-mute">
              Anything we should know?
              <textarea
                name="message"
                rows={3}
                required
                defaultValue={`I'd like to visit ${title}.`}
                className={`${inputClass} mt-1`}
              />
              {fieldError("message")}
            </label>
            <div className="flex items-center justify-between gap-3 pt-1">
              {hasOptions ? (
                <button type="button" onClick={() => setStep("options")} className="text-sm underline underline-offset-4">
                  Back
                </button>
              ) : (
                <span />
              )}
              <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-50">
                <Send className="size-4" aria-hidden /> {pending ? "Sending…" : "Send my request"}
              </button>
            </div>
            <p className="text-xs text-ink-mute">No payment now. You only pay once you&rsquo;re happy with the plan.</p>
          </form>
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
