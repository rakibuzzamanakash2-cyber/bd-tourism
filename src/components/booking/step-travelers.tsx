"use client";

import { Minus, Plus } from "lucide-react";
import type { TourPackage } from "@prisma/client";
import type { WizardData } from "./booking-wizard";
import { StepActions } from "./booking-wizard";

type Props = {
  data: WizardData;
  setData: (d: WizardData) => void;
  pkg: TourPackage;
  onNext: () => void;
  onPrev: () => void;
};

export function StepTravelers({ data, setData, pkg, onNext, onPrev }: Props) {
  const pricePerPerson = Number(pkg.basePriceUSD);
  const total = pricePerPerson * data.travelerCount;

  function decrement() {
    if (data.travelerCount > 1) {
      setData({ ...data, travelerCount: data.travelerCount - 1 });
    }
  }

  function increment() {
    if (data.travelerCount < pkg.maxTravelers) {
      setData({ ...data, travelerCount: data.travelerCount + 1 });
    }
  }

  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">Step 2 of 4</p>
      <h2 className="font-display text-3xl leading-tight sm:text-4xl">
        How many travelers?
      </h2>
      <p className="mt-3 max-w-xl text-ink-soft">
        Including yourself. Maximum group size for this tour is{" "}
        {pkg.maxTravelers}.
      </p>

      <div className="mt-10 max-w-md">
        <div className="flex items-center justify-between rounded-lg border border-forest-900/10 bg-paper-warm p-6">
          <div>
            <p className="eyebrow text-ink-mute">Travelers</p>
            <p className="mt-1 font-display text-4xl text-forest-900">
              {data.travelerCount}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={decrement}
              disabled={data.travelerCount <= 1}
              aria-label="Decrease travelers"
              className="flex size-11 items-center justify-center rounded-full border border-forest-900/20 bg-paper text-forest-900 transition-colors hover:border-forest-900/50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={increment}
              disabled={data.travelerCount >= pkg.maxTravelers}
              aria-label="Increase travelers"
              className="flex size-11 items-center justify-center rounded-full border border-forest-900/20 bg-paper text-forest-900 transition-colors hover:border-forest-900/50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Live price preview */}
        <div className="mt-6 rounded-lg border border-forest-900/10 bg-paper p-6">
          <p className="eyebrow text-forest-700">Price</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>
                {data.travelerCount}{" "}
                {data.travelerCount === 1 ? "traveler" : "travelers"} × $
                {pricePerPerson.toFixed(0)}
              </span>
              <span>${total.toFixed(0)}</span>
            </div>
            <div className="border-t border-forest-900/10 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-ink">Total</span>
                <span className="font-display text-3xl text-forest-900">
                  ${total.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-mute">
            Restricted-area permit fees (if applicable) are billed separately
            after confirmation and depend on the destinations in this tour.
          </p>
        </div>
      </div>

      <StepActions onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
