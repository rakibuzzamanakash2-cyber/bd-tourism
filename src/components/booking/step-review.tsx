"use client";

import {
  calculateEndDate,
  formatDateRange,
} from "@/lib/booking-utils";
import type {
  RestrictedRegion,
  WizardData,
  WizardPackage,
} from "./booking-wizard";
import { StepActions } from "./booking-wizard";

type Props = {
  data: WizardData;
  setData: (d: WizardData) => void;
  pkg: WizardPackage;
  tourPrice: number;
  serviceFee: number;
  totalPrice: number;
  isRestricted: boolean;
  restrictedRegions: RestrictedRegion[];
  submitting: boolean;
  onPrev: () => void;
  onSubmit: () => void;
};

export function StepReview({
  data,
  setData,
  pkg,
  tourPrice,
  serviceFee,
  totalPrice,
  isRestricted,
  restrictedRegions,
  submitting,
  onPrev,
  onSubmit,
}: Props) {
  const dateRange = data.startDate
    ? formatDateRange(
      data.startDate,
      calculateEndDate(new Date(data.startDate), pkg.durationDays),
    )
    : "—";

  const pricePerPerson = Number(pkg.basePriceUSD);

  const restrictedNames =
    restrictedRegions.length === 0
      ? ""
      : restrictedRegions.length === 1
        ? restrictedRegions[0].name
        : restrictedRegions.length === 2
          ? `${restrictedRegions[0].name} and ${restrictedRegions[1].name}`
          : `${restrictedRegions
            .slice(0, -1)
            .map((r) => r.name)
            .join(", ")}, and ${restrictedRegions[restrictedRegions.length - 1].name}`;
  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">Step 4 of 4</p>
      <h2 className="font-display text-3xl leading-tight sm:text-4xl">
        Review and confirm.
      </h2>
      <p className="mt-3 max-w-xl text-ink-soft">
        Everything below can still be changed &mdash; hit back and edit any
        section.
      </p>

      <div className="mt-10 max-w-2xl space-y-8">
        {/* Trip summary */}
        <ReviewBlock title="Trip">
          <Row label="Tour" value={pkg.title} />
          <Row
            label="Duration"
            value={`${pkg.durationDays} ${pkg.durationDays === 1 ? "day" : "days"}`}
          />
          <Row label="Dates" value={dateRange} />
        </ReviewBlock>

        {/* Travelers */}
        <ReviewBlock title="Travelers">
          <Row
            label="Group size"
            value={`${data.travelerCount} ${data.travelerCount === 1 ? "traveler" : "travelers"
              }`}
          />
          <Row
            label={data.travelerCount === 1 ? "Traveler" : "#1 (Primary)"}
            value={
              <span>
                {data.primaryContact.name}
                <br />
                <span className="text-ink-mute">
                  {data.primaryContact.email} · {data.primaryContact.phone}
                </span>
                {isRestricted && data.primaryContact.passportNumber && (
                  <>
                    <br />
                    <span className="text-ink-mute">
                      {data.primaryContact.nationality} · Passport{" "}
                      {data.primaryContact.passportNumber}
                    </span>
                  </>
                )}
              </span>
            }
          />
          {data.additionalTravelers.map((t, i) => (
            <Row
              key={i}
              label={`#${i + 2}`}
              value={
                <span>
                  {t.name}
                  <br />
                  <span className="text-ink-mute">
                    {t.nationality} · Passport {t.passportNumber}
                  </span>
                </span>
              }
            />
          ))}
        </ReviewBlock>

        {/* Special requests */}
        {data.specialRequests.trim() && (
          <ReviewBlock title="Special requests">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {data.specialRequests}
            </p>
          </ReviewBlock>
        )}

        {/* Restricted area callout */}
        {isRestricted && (
          <div className="rounded-lg border border-clay-600/30 bg-clay-500/[0.06] p-6">
            <p className="eyebrow text-clay-700">Restricted area — permits</p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              This tour visits{" "}
              <span className="font-medium">{restrictedNames}</span>. We&rsquo;ll
              start your permit application immediately after payment. Our
              processing fee is included in your total below.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-ink-mute">
              Government permit fees (~BDT 3,000 per person) and certified
              guide fees are billed separately after your permit is approved,
              typically 5&ndash;7 working days from booking.
            </p>
          </div>
        )}

        {/* Price */}
        <ReviewBlock title="Price">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>
                Tour · {data.travelerCount} × ${pricePerPerson.toFixed(0)}
              </span>
              <span>${tourPrice.toFixed(2)}</span>
            </div>
            {isRestricted && (
              <div className="flex justify-between text-ink-soft">
                <span>Permit processing fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-forest-900/10 pt-3">
              <span className="font-medium text-ink">Charged now (USD)</span>
              <span className="font-display text-3xl text-forest-900">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </ReviewBlock>

        {/* Terms */}
        <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={data.agreedToTerms}
              onChange={(e) =>
                setData({ ...data, agreedToTerms: e.target.checked })
              }
              className="mt-1 size-4 rounded border-forest-900/30 text-forest-900 focus:ring-forest-700"
            />
            <span className="text-sm leading-relaxed text-ink">
              I agree to the booking terms and understand the cancellation
              policy. {isRestricted && "My permit application will start immediately after payment."}
            </span>
          </label>
        </div>
      </div>

      <StepActions
        onPrev={onPrev}
        onNext={onSubmit}
        nextLabel="Confirm & continue"
        nextDisabled={!data.agreedToTerms}
        submitting={submitting}
      />
    </div>
  );
}

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">{title}</p>
      <div className="space-y-3 rounded-lg border border-forest-900/10 bg-paper p-6">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="col-span-2 text-ink">{value}</dd>
    </div>
  );
}
