"use client";

import { useMemo, useState } from "react";
import type { TourPackage } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateEndDate,
  earliestBookableDate,
  formatDateRange,
  MIN_BOOKING_LEAD_DAYS,
} from "@/lib/booking-utils";
import type { WizardData } from "./booking-wizard";
import { StepActions } from "./booking-wizard";

type Props = {
  data: WizardData;
  setData: (d: WizardData) => void;
  pkg: TourPackage;
  onNext: () => void;
};

export function StepDates({ data, setData, pkg, onNext }: Props) {
  const [error, setError] = useState<string | null>(null);
  const minDate = useMemo(() => earliestBookableDate(), []);

  const preview = data.startDate
    ? formatDateRange(
        data.startDate,
        calculateEndDate(new Date(data.startDate), pkg.durationDays),
      )
    : null;

  function handleContinue() {
    if (!data.startDate) {
      setError("Please pick a start date.");
      return;
    }

    const start = new Date(data.startDate);
    const earliest = new Date();
    earliest.setDate(earliest.getDate() + MIN_BOOKING_LEAD_DAYS);
    earliest.setHours(0, 0, 0, 0);

    if (start < earliest) {
      setError(
        `Please pick a date at least ${MIN_BOOKING_LEAD_DAYS} days from today. We need this time to process permits and confirm guides.`,
      );
      return;
    }

    setError(null);
    onNext();
  }

  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">Step 1 of 4</p>
      <h2 className="font-display text-3xl leading-tight sm:text-4xl">
        When would you like to travel?
      </h2>
      <p className="mt-3 max-w-xl text-ink-soft">
        This is a {pkg.durationDays}-day tour — pick your start date and
        we&rsquo;ll work out the rest.
      </p>

      <div className="mt-8 max-w-md">
        <Label htmlFor="startDate" className="text-sm">
          Start date
        </Label>
        <Input
          id="startDate"
          type="date"
          value={data.startDate}
          min={minDate}
          onChange={(e) => {
            setData({ ...data, startDate: e.target.value });
            setError(null);
          }}
          className="mt-1.5"
        />
        <p className="mt-2 text-xs text-ink-mute">
          Earliest booking: {formatDateRange(minDate, calculateEndDate(new Date(minDate), pkg.durationDays))}
        </p>

        {preview && (
          <div className="mt-6 rounded-lg border border-forest-900/10 bg-paper-warm p-4">
            <p className="eyebrow text-forest-700">Your trip</p>
            <p className="mt-2 font-display text-xl leading-tight text-ink">
              {preview}
            </p>
            <p className="mt-1 text-sm text-ink-mute">
              {pkg.durationDays} {pkg.durationDays === 1 ? "day" : "days"}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-clay-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <StepActions onNext={handleContinue} />
    </div>
  );
}
