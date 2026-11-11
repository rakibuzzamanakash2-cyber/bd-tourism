"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calculateEndDate, earliestBookableDate, formatDateRange, MIN_BOOKING_LEAD_DAYS } from "@/lib/booking-utils";
import { parseDate } from "@/lib/travel-docs";
import { StepActions, tripDays, type WizardData, type WizardTrip } from "./booking-wizard";

type Props = { data: WizardData; setData: (d: WizardData) => void; trip: WizardTrip; onNext: () => void };

/** Step 1: when, how many people, and (for a custom trip) how many days. */
export function StepTrip({ data, setData, trip, onNext }: Props) {
  const [error, setError] = useState<string | null>(null);
  const minDate = useMemo(() => earliestBookableDate(), []);
  const days = tripDays(trip, data);
  const start = parseDate(data.startDate);
  const preview = start ? formatDateRange(start, calculateEndDate(start, days)) : null;

  function handleContinue() {
    if (!start) return setError("Please pick a start date.");
    if (data.startDate < minDate) {
      return setError(`Please pick a date at least ${MIN_BOOKING_LEAD_DAYS} days from today. We need this time to arrange guides and permits.`);
    }
    if (trip.kind === "custom" && (data.days < 1 || data.days > 30)) return setError("Choose between 1 and 30 days.");
    setError(null);
    onNext();
  }

  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">Step 1 of 3</p>
      <h2 className="font-display text-3xl leading-tight sm:text-4xl">Your trip.</h2>
      <p className="mt-3 max-w-xl text-ink-soft">
        {trip.kind === "tour"
          ? `This is a ${trip.days}-day tour. Pick your start date and how many of you are coming.`
          : "Pick when you'd like to start, how long you have and how many of you are coming."}
      </p>

      <div className="mt-8 grid max-w-2xl gap-8 sm:grid-cols-2">
        <div>
          <Label htmlFor="startDate" className="text-sm">Start date</Label>
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
          <p className="mt-2 text-xs text-ink-mute">Earliest start: {formatDateRange(minDate, minDate).split(" → ")[0]}</p>
        </div>

        {trip.kind === "custom" && (
          <Stepper
            id="days"
            label="How many days?"
            value={data.days}
            min={1}
            max={30}
            unit={data.days === 1 ? "day" : "days"}
            noun="days"
            onChange={(n) => setData({ ...data, days: n })}
          />
        )}

        <Stepper
          id="travelers"
          label="How many travelers?"
          value={data.travelerCount}
          min={1}
          max={trip.maxTravelers}
          unit={data.travelerCount === 1 ? "traveler" : "travelers"}
          noun="travelers"
          hint={`Up to ${trip.maxTravelers}. Children count as travelers.`}
          onChange={(n) => setData({ ...data, travelerCount: n })}
        />
      </div>

      {trip.kind === "custom" && (
        <div className="mt-8 max-w-2xl">
          <Label htmlFor="notes" className="text-sm">What would you like to see and do? <span className="text-ink-mute">(optional)</span></Label>
          <Textarea
            id="notes"
            rows={3}
            maxLength={2000}
            value={data.specialRequests}
            onChange={(e) => setData({ ...data, specialRequests: e.target.value })}
            placeholder="Places you don't want to miss, your budget, hotel or homestay, food needs, how active you like to be…"
            className="mt-1.5"
          />
        </div>
      )}

      {preview && (
        <div className="mt-8 max-w-md rounded-lg border border-forest-900/10 bg-paper-warm p-4">
          <p className="eyebrow text-forest-700">Your trip</p>
          <p className="mt-2 font-display text-xl leading-tight text-ink">{preview}</p>
          <p className="mt-1 text-sm text-ink-mute">
            {days} {days === 1 ? "day" : "days"} · {data.travelerCount} {data.travelerCount === 1 ? "traveler" : "travelers"}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-clay-600" role="alert">
          {error}
        </p>
      )}

      <StepActions onNext={handleContinue} />
    </div>
  );
}

function Stepper({
  id,
  label,
  value,
  min,
  max,
  unit,
  noun,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  /** For the button labels: "Fewer days", "More travelers" */
  noun: string;
  hint?: string;
  onChange: (n: number) => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div>
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="mt-1.5 flex items-center gap-3">
        <button
          type="button"
          aria-label={`Fewer ${noun}`}
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          className="flex size-10 items-center justify-center rounded-full border border-forest-900/20 hover:bg-forest-100 disabled:opacity-40"
        >
          <Minus className="size-4" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number.parseInt(e.target.value, 10) || min))}
          className="w-16 rounded-md border border-forest-900/15 bg-paper py-2 text-center font-display text-xl outline-none focus:border-forest-700"
        />
        <button
          type="button"
          aria-label={`More ${noun}`}
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          className="flex size-10 items-center justify-center rounded-full border border-forest-900/20 hover:bg-forest-100 disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
        <span className="text-sm text-ink-soft">{unit}</span>
      </div>
      {hint && <p className="mt-2 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}
