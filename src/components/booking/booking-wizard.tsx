"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { createBookingAction } from "@/lib/actions/booking";
import { calculateServiceFee } from "@/lib/booking-utils";
import { StepDates } from "./step-dates";
import { StepTravelers } from "./step-travelers";
import { StepDetails } from "./step-details";
import { StepReview } from "./step-review";

// ============================================================
// TYPES
// ============================================================

export type AdditionalTraveler = {
  name: string;
  passportNumber: string;
  nationality: string;
};

export type WizardData = {
  startDate: string;
  travelerCount: number;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    passportNumber: string;
    nationality: string;
  };
  additionalTravelers: AdditionalTraveler[];
  specialRequests: string;
  agreedToTerms: boolean;
};

export type WizardPackage = {
  id: string;
  slug: string;
  title: string;
  durationDays: number;
  basePriceUSD: number;
  maxTravelers: number;
};

export type RestrictedRegion = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  package: WizardPackage;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
    passportNumber: string | null;
    nationality: string | null;
  };
  restrictedRegions: RestrictedRegion[];
  requestedGuide?: { slug: string; displayName: string; photoUrl: string | null } | null;
};

const STEPS = [
  { number: 1, label: "Dates" },
  { number: 2, label: "Travelers" },
  { number: 3, label: "Details" },
  { number: 4, label: "Review" },
];

// ============================================================
// WIZARD
// ============================================================

export function BookingWizard({ package: pkg, user, restrictedRegions, requestedGuide }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const isRestricted = restrictedRegions.length > 0;

  const [data, setData] = useState<WizardData>({
    startDate: "",
    travelerCount: 1,
    primaryContact: {
      name: user.name ?? "",
      email: user.email,
      phone: user.phone ?? "",
      passportNumber: user.passportNumber ?? "",
      nationality: user.nationality ?? "",
    },
    additionalTravelers: [],
    specialRequests: "",
    agreedToTerms: false,
  });

  const tourPrice = Number(pkg.basePriceUSD) * data.travelerCount;
  const serviceFee = isRestricted ? calculateServiceFee(data.travelerCount) : 0;
  const totalPrice = tourPrice + serviceFee;

  // ============================================================
  // NAVIGATION
  // ============================================================
  function goNext() {
    if (step === 2) {
      // Sync additionalTravelers to travelerCount when moving from step 2 → 3
      const needed = data.travelerCount - 1;
      const current = data.additionalTravelers.length;
      if (current < needed) {
        const additions: AdditionalTraveler[] = Array.from(
          { length: needed - current },
          () => ({ name: "", passportNumber: "", nationality: "" }),
        );
        setData({
          ...data,
          additionalTravelers: [...data.additionalTravelers, ...additions],
        });
      } else if (current > needed) {
        setData({
          ...data,
          additionalTravelers: data.additionalTravelers.slice(0, needed),
        });
      }
    }
    setStep(Math.min(step + 1, 4));
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    setStep(Math.max(step - 1, 1));
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ============================================================
  // SUBMIT
  // ============================================================
  async function handleSubmit() {
    if (!data.agreedToTerms) {
      toast.error("Please agree to the booking terms before continuing.");
      return;
    }

    setSubmitting(true);
    const result = await createBookingAction({
      packageSlug: pkg.slug,
      startDate: data.startDate,
      travelerCount: data.travelerCount,
      primaryContact: data.primaryContact,
      additionalTravelers: data.additionalTravelers,
      specialRequests: data.specialRequests || null,
      agreedToTerms: true,
      requestedGuideSlug: requestedGuide?.slug ?? null,
    });

    if (result.success) {
      toast.success("Booking created", {
        description: `Confirmation: ${result.bookingCode}`,
      });
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
            You asked for <Link href={`/guides/${requestedGuide.slug}`} className="font-medium underline underline-offset-4">{requestedGuide.displayName}</Link> as your guide.
            We&rsquo;ll ask them first. If they&rsquo;re not free on your dates, we&rsquo;ll suggest someone just as good.
          </span>
        </div>
      )}
      {/* Back to package link */}
      <Link
        href={`/packages/${pkg.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800"
      >
        <ArrowLeft className="size-4" />
        Back to tour
      </Link>

      {/* Wizard header */}
      <div className="mb-2">
        <p className="eyebrow text-forest-700">Booking</p>
      </div>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        {pkg.title}
      </h1>
      <p className="mt-3 text-ink-soft">
        {pkg.durationDays} {pkg.durationDays === 1 ? "day" : "days"} · From $
        {Number(pkg.basePriceUSD).toFixed(0)} per person
      </p>

      {/* Restricted area banner */}
      {isRestricted && (
        <RestrictedBanner regions={restrictedRegions} />
      )}

      {/* Progress indicator */}
      <ProgressIndicator currentStep={step} />

      {/* Step content */}
      <div className="mt-12">
        {step === 1 && (
          <StepDates
            data={data}
            setData={setData}
            pkg={pkg}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <StepTravelers
            data={data}
            setData={setData}
            pkg={pkg}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
        {step === 3 && (
          <StepDetails
            data={data}
            setData={setData}
            isRestricted={isRestricted}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
        {step === 4 && (
          <StepReview
            data={data}
            setData={setData}
            pkg={pkg}
            tourPrice={tourPrice}
            serviceFee={serviceFee}
            totalPrice={totalPrice}
            isRestricted={isRestricted}
            restrictedRegions={restrictedRegions}
            submitting={submitting}
            onPrev={goPrev}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </>
  );
}

// ============================================================
// RESTRICTED AREA BANNER
// ============================================================
function RestrictedBanner({ regions }: { regions: RestrictedRegion[] }) {
  const names =
    regions.length === 1
      ? regions[0].name
      : regions.length === 2
        ? `${regions[0].name} and ${regions[1].name}`
        : `${regions.slice(0, -1).map((r) => r.name).join(", ")}, and ${regions[regions.length - 1].name}`;

  return (
    <div className="mt-8 rounded-lg border border-clay-600/30 bg-clay-500/[0.06] p-5">
      <div className="flex gap-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-clay-600 text-paper">
          <AlertCircle className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-clay-700">
            Permit required &mdash; we handle it
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            This tour visits <span className="font-medium text-ink">{names}</span>,
            which requires official permission for foreign visitors. All
            travelers need to provide passport details, and we&rsquo;ll charge
            a permit processing fee alongside your tour.
          </p>
          <Link
            href="/permits"
            className="mt-3 inline-flex items-center gap-1 text-xs text-clay-700 underline underline-offset-4 hover:text-clay-600"
          >
            How permits work →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PROGRESS INDICATOR
// ============================================================
function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mt-10 border-b border-forest-900/10 pb-6">
      <ol className="flex items-center gap-2 sm:gap-4">
        {STEPS.map((s, i) => {
          const isDone = currentStep > s.number;
          const isCurrent = currentStep === s.number;
          return (
            <li
              key={s.number}
              className="flex flex-1 items-center gap-2 sm:gap-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm transition-colors",
                    isDone && "border-forest-900 bg-forest-900 text-paper",
                    isCurrent &&
                      "border-forest-900 bg-paper font-medium text-forest-900",
                    !isDone &&
                      !isCurrent &&
                      "border-forest-900/20 bg-paper text-ink-mute",
                  )}
                >
                  {isDone ? <Check className="size-4" /> : s.number}
                </div>
                <span
                  className={cn(
                    "hidden text-sm sm:inline",
                    isCurrent ? "font-medium text-ink" : "text-ink-mute",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 transition-colors",
                    isDone ? "bg-forest-900" : "bg-forest-900/15",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ============================================================
// SHARED — action row at bottom of each step
// ============================================================
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
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-forest-800"
          >
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
