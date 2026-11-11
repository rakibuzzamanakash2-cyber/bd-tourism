"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { createBookingAction } from "@/lib/actions/booking";
import { calculateServiceFee } from "@/lib/booking-utils";
import { emptyTraveler, type TravelerDocs } from "@/lib/travel-docs";
import { StepTrip } from "./step-trip";
import { StepTravelers } from "./step-travelers";
import { StepReview } from "./step-review";

// One booking process for every kind of trip:
//   1. Trip        when, how many people (and how long, for a custom trip)
//   2. Travelers   passport and visa for everyone, plus an emergency contact
//   3. Review      check it all and confirm
// A tour has a fixed price and goes on to payment. A custom trip (a district,
// a place or a destination) is priced by the team first, then paid the same way.

export type WizardTrip =
  | { kind: "tour"; slug: string; title: string; days: number; priceUSD: number; maxTravelers: number; backHref: string }
  | {
      kind: "custom";
      title: string;
      maxTravelers: number;
      backHref: string;
      target: { districtId?: string; placeId?: string; destinationId?: string };
      permitNote: boolean;
    };

export type WizardData = {
  startDate: string;
  days: number; // custom trips only; a tour has its own length
  travelerCount: number;
  contact: { email: string; phone: string };
  travelers: TravelerDocs[];
  emergency: { name: string; phone: string };
  specialRequests: string;
  agreedToTerms: boolean;
};

export type RestrictedRegion = { id: string; name: string; slug: string };

type Props = {
  trip: WizardTrip;
  user: { name: string | null; email: string; phone: string | null; passportNumber: string | null; nationality: string | null };
  restrictedRegions: RestrictedRegion[];
  requestedGuide?: { slug: string; displayName: string; photoUrl: string | null } | null;
};

const STEPS = [
  { number: 1, label: "Trip" },
  { number: 2, label: "Travelers & documents" },
  { number: 3, label: "Review" },
];

export const tripDays = (trip: WizardTrip, data: WizardData) => (trip.kind === "tour" ? trip.days : data.days);

export function BookingWizard({ trip, user, restrictedRegions, requestedGuide }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const isRestricted = restrictedRegions.length > 0;

  const [data, setData] = useState<WizardData>({
    startDate: "",
    days: 3,
    travelerCount: 1,
    contact: { email: user.email, phone: user.phone ?? "" },
    travelers: [{ ...emptyTraveler(), name: user.name ?? "", nationality: user.nationality ?? "", passportNumber: user.passportNumber ?? "" }],
    emergency: { name: "", phone: "" },
    specialRequests: "",
    agreedToTerms: false,
  });

  const tourPrice = trip.kind === "tour" ? trip.priceUSD * data.travelerCount : 0;
  const serviceFee = trip.kind === "tour" && isRestricted ? calculateServiceFee(data.travelerCount) : 0;

  function go(to: number) {
    if (to === 2) {
      // One form per traveler, keeping what was already typed
      const travelers = Array.from({ length: data.travelerCount }, (_, i) => data.travelers[i] ?? emptyTraveler());
      setData({ ...data, travelers });
    }
    setStep(to);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!data.agreedToTerms) {
      toast.error("Please agree to the booking terms before continuing.");
      return;
    }
    setSubmitting(true);
    const result = await createBookingAction({
      trip: trip.kind === "tour" ? { kind: "tour", packageSlug: trip.slug } : { kind: "custom", days: data.days, ...trip.target },
      startDate: data.startDate,
      travelerCount: data.travelerCount,
      contact: data.contact,
      travelers: data.travelers,
      emergency: data.emergency,
      specialRequests: data.specialRequests || null,
      agreedToTerms: true,
      requestedGuideSlug: requestedGuide?.slug ?? null,
    });
    if (result.success) {
      toast.success(result.quote ? "Booking request sent" : "Booking created", { description: `Booking code: ${result.bookingCode}` });
      router.push(`/dashboard/bookings/${result.bookingId}`);
    } else {
      toast.error(result.error);
      setSubmitting(false);
    }
  }

  return (
    <>
      {requestedGuide && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-forest-700/20 bg-forest-100 px-4 py-3 text-sm text-forest-900">
          <span>
            You asked for{" "}
            <Link href={`/guides/${requestedGuide.slug}`} className="font-medium underline underline-offset-4">
              {requestedGuide.displayName}
            </Link>{" "}
            as your guide. We&rsquo;ll ask them first. If they&rsquo;re not free on your dates, we&rsquo;ll suggest someone just as good.
          </span>
        </div>
      )}
      <Link href={trip.backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <p className="eyebrow mb-2 text-forest-700">{trip.kind === "tour" ? "Booking" : "Booking a custom trip"}</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">{trip.title}</h1>
      <p className="mt-3 text-ink-soft">
        {trip.kind === "tour"
          ? `${trip.days} ${trip.days === 1 ? "day" : "days"} · From $${trip.priceUSD.toFixed(0)} per person`
          : "Tell us your dates and group. We plan the trip and send you a price within 24 hours; you pay only when you're happy with it."}
      </p>

      {trip.kind === "tour" && isRestricted && <RestrictedBanner regions={restrictedRegions} />}
      {trip.kind === "custom" && trip.permitNote && (
        <Note icon={AlertCircle} tone="clay" title="Permit required: we handle it">
          This area is in the Chittagong Hill Tracts. Foreign visitors need a government permit, which we arrange using the passport details
          you give here. The permit cost is included in your quote.{" "}
          <Link href="/permits" className="underline underline-offset-4">How permits work</Link>
        </Note>
      )}

      <ProgressIndicator currentStep={step} />

      <div className="mt-12">
        {step === 1 && <StepTrip data={data} setData={setData} trip={trip} onNext={() => go(2)} />}
        {step === 2 && <StepTravelers data={data} setData={setData} trip={trip} onNext={() => go(3)} onPrev={() => go(1)} />}
        {step === 3 && (
          <StepReview
            data={data}
            setData={setData}
            trip={trip}
            tourPrice={tourPrice}
            serviceFee={serviceFee}
            restrictedRegions={restrictedRegions}
            submitting={submitting}
            onPrev={() => go(2)}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-ink-mute">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest-700" aria-hidden />
        Passport and visa numbers are encrypted when we store them, shown only to the staff handling your booking, and deleted 90 days after
        your trip.
      </p>
    </>
  );
}

function Note({ icon: Icon, tone, title, children }: { icon: typeof AlertCircle; tone: "clay"; title: string; children: React.ReactNode }) {
  return (
    <div className={cn("mt-8 rounded-lg border p-5", tone === "clay" && "border-clay-600/30 bg-clay-500/[0.06]")}>
      <div className="flex gap-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-clay-600 text-paper">
          <Icon className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-clay-700">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p>
        </div>
      </div>
    </div>
  );
}

function RestrictedBanner({ regions }: { regions: RestrictedRegion[] }) {
  const names =
    regions.length === 1
      ? regions[0].name
      : regions.length === 2
        ? `${regions[0].name} and ${regions[1].name}`
        : `${regions.slice(0, -1).map((r) => r.name).join(", ")}, and ${regions[regions.length - 1].name}`;
  return (
    <Note icon={AlertCircle} tone="clay" title="Permit required: we handle it">
      This tour visits <span className="font-medium text-ink">{names}</span>, which requires official permission for foreign visitors. We use
      the passport details you give here, and charge a permit processing fee alongside your tour.{" "}
      <Link href="/permits" className="underline underline-offset-4">How permits work</Link>
    </Note>
  );
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mt-10 border-b border-forest-900/10 pb-6">
      <ol className="flex items-center gap-2 sm:gap-4">
        {STEPS.map((s, i) => {
          const isDone = currentStep > s.number;
          const isCurrent = currentStep === s.number;
          return (
            <li key={s.number} className="flex flex-1 items-center gap-2 sm:gap-4" aria-current={isCurrent ? "step" : undefined}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm transition-colors",
                    isDone && "border-forest-900 bg-forest-900 text-paper",
                    isCurrent && "border-forest-900 bg-paper font-medium text-forest-900",
                    !isDone && !isCurrent && "border-forest-900/20 bg-paper text-ink-mute",
                  )}
                >
                  {isDone ? <Check className="size-4" /> : s.number}
                </div>
                <span className={cn("hidden text-sm sm:inline", isCurrent ? "font-medium text-ink" : "text-ink-mute")}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("h-px flex-1 transition-colors", isDone ? "bg-forest-900" : "bg-forest-900/15")} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The Back / Continue row at the bottom of each step. */
export function StepActions({
  onPrev,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  submitting = false,
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  submitting?: boolean;
}) {
  return (
    <div className="mt-12 flex items-center justify-between gap-4 border-t border-forest-900/10 pt-8">
      <div>
        {onPrev && (
          <button type="button" onClick={onPrev} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-forest-800">
            <ArrowLeft className="size-4" />
            Back
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || submitting}
        className={cn(
          buttonVariants({ size: "lg" }),
          "rounded-full bg-forest-900 px-8 text-paper hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {submitting ? "Submitting…" : nextLabel}
      </button>
    </div>
  );
}
