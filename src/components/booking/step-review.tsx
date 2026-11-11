"use client";

import Link from "next/link";
import { calculateEndDate, formatDate, formatDateRange } from "@/lib/booking-utils";
import { isNationalId, needsVisa, parseDate, visaStatusLabel } from "@/lib/travel-docs";
import { StepActions, tripDays, type RestrictedRegion, type WizardData, type WizardTrip } from "./booking-wizard";

type Props = {
  data: WizardData;
  setData: (d: WizardData) => void;
  trip: WizardTrip;
  tourPrice: number;
  serviceFee: number;
  restrictedRegions: RestrictedRegion[];
  submitting: boolean;
  onPrev: () => void;
  onSubmit: () => void;
};

/** Only the last four characters, so the full number isn't on screen again. */
const masked = (n: string) => `•••• ${n.replace(/[\s-]/g, "").slice(-4)}`;

/** Step 3: check everything, agree to the terms, confirm. */
export function StepReview({ data, setData, trip, tourPrice, serviceFee, restrictedRegions, submitting, onPrev, onSubmit }: Props) {
  const days = tripDays(trip, data);
  const start = parseDate(data.startDate)!;
  const isRestricted = restrictedRegions.length > 0;
  const isTour = trip.kind === "tour";

  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">Step 3 of 3</p>
      <h2 className="font-display text-3xl leading-tight sm:text-4xl">Review and confirm.</h2>
      <p className="mt-3 max-w-xl text-ink-soft">Check the details below. Go back to change anything.</p>

      <div className="mt-10 max-w-2xl space-y-8">
        <ReviewBlock title="Trip">
          <Row label={isTour ? "Tour" : "Custom trip to"} value={trip.title} />
          <Row label="Dates" value={formatDateRange(start, calculateEndDate(start, days))} />
          <Row label="Length" value={`${days} ${days === 1 ? "day" : "days"}`} />
          <Row label="Group" value={`${data.travelerCount} ${data.travelerCount === 1 ? "traveler" : "travelers"}`} />
        </ReviewBlock>

        <ReviewBlock title="Travelers and documents">
          {data.travelers.map((t, i) => {
            const nid = isNationalId(t.nationality, t.passportNumber);
            return (
              <Row
                key={i}
                label={data.travelers.length === 1 ? "Traveler" : `Traveler ${i + 1}`}
                value={
                  <span>
                    {t.name.trim()}
                    <br />
                    <span className="text-ink-mute">
                      {t.nationality} · born {formatDate(t.dateOfBirth)}
                      <br />
                      {nid ? "NID" : "Passport"} <span className="font-mono">{masked(t.passportNumber)}</span>
                      {!nid && ` · valid to ${formatDate(t.passportExpiry)}`}
                      <br />
                      {needsVisa(t.nationality)
                        ? `Visa: ${visaStatusLabel(t.visaStatus)}${t.visaStatus === "HAVE_VISA" ? ` (${masked(t.visaNumber)}, valid to ${formatDate(t.visaExpiry)})` : ""}`
                        : "No visa needed"}
                    </span>
                  </span>
                }
              />
            );
          })}
        </ReviewBlock>

        <ReviewBlock title="Contact">
          <Row label="Email" value={data.contact.email} />
          <Row label="Phone" value={data.contact.phone} />
          <Row label="Emergency" value={`${data.emergency.name.trim()} · ${data.emergency.phone.trim()}`} />
        </ReviewBlock>

        {isTour ? (
          <div>
            <label htmlFor="requests" className="eyebrow mb-3 block text-forest-700">Anything we should know? <span className="normal-case tracking-normal text-ink-mute">(optional)</span></label>
            <textarea
              id="requests"
              rows={3}
              maxLength={2000}
              value={data.specialRequests}
              onChange={(e) => setData({ ...data, specialRequests: e.target.value })}
              placeholder="Food needs, health conditions we should plan for, a birthday…"
              className="w-full rounded-lg border border-forest-900/10 bg-paper p-4 text-sm outline-none focus:border-forest-700"
            />
          </div>
        ) : (
          data.specialRequests.trim() && (
            <ReviewBlock title="What you'd like">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{data.specialRequests}</p>
            </ReviewBlock>
          )
        )}

        {isTour && isRestricted && (
          <div className="rounded-lg border border-clay-600/30 bg-clay-500/[0.06] p-6">
            <p className="eyebrow text-clay-700">Restricted area: permits</p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              This tour visits <span className="font-medium">{restrictedRegions.map((r) => r.name).join(", ")}</span>. We&rsquo;ll start your
              permit application as soon as you&rsquo;ve paid. Our processing fee is included in your total below.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-ink-mute">
              Government permit fees (about BDT 3,000 per person) and certified guide fees are billed separately after your permit is approved,
              usually 5&ndash;7 working days from booking.
            </p>
          </div>
        )}

        {isTour ? (
          <ReviewBlock title="Price">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Tour · {data.travelerCount} × ${trip.priceUSD.toFixed(0)}</span>
                <span>${tourPrice.toFixed(2)}</span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <span>Permit processing fee</span>
                  <span>${serviceFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-forest-900/10 pt-3">
                <span className="font-medium text-ink">Total (USD)</span>
                <span className="font-display text-3xl text-forest-900">${(tourPrice + serviceFee).toFixed(2)}</span>
              </div>
            </div>
          </ReviewBlock>
        ) : (
          <ReviewBlock title="Price">
            <p className="text-sm leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">We&rsquo;ll send your price within 24 hours.</span> We plan the route, stays, transport and guide
              for your dates and group, then email you the plan and the price. Nothing is charged until you accept it and pay.
            </p>
          </ReviewBlock>
        )}

        <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={data.agreedToTerms}
              onChange={(e) => setData({ ...data, agreedToTerms: e.target.checked })}
              className="mt-1 size-4 rounded border-forest-900/30 text-forest-900 focus:ring-forest-700"
            />
            <span className="text-sm leading-relaxed text-ink">
              The passport and visa details I gave are correct and match the travelers&rsquo; documents. I agree to the{" "}
              <Link href="/terms" target="_blank" className="underline underline-offset-4">booking terms</Link> and understand the cancellation policy.
            </span>
          </label>
        </div>
      </div>

      <StepActions
        onPrev={onPrev}
        onNext={onSubmit}
        nextLabel={isTour ? "Confirm and continue to payment" : "Send booking request"}
        nextDisabled={!data.agreedToTerms}
        submitting={submitting}
      />
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">{title}</p>
      <dl className="space-y-3 rounded-lg border border-forest-900/10 bg-paper p-6">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="col-span-2 text-ink">{value}</dd>
    </div>
  );
}
