"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES, HOME_COUNTRY } from "@/lib/countries";
import { calculateEndDate, formatDate } from "@/lib/booking-utils";
import {
  VISA_STATUSES,
  checkTraveler,
  isNationalId,
  needsVisa,
  parseDate,
  passportMustBeValidUntil,
  type TravelerDocs,
} from "@/lib/travel-docs";
import { StepActions, tripDays, type WizardData, type WizardTrip } from "./booking-wizard";

type Props = { data: WizardData; setData: (d: WizardData) => void; trip: WizardTrip; onNext: () => void; onPrev: () => void };

const selectClass =
  "mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Step 2: passport and visa for every traveler, the contact details and an emergency contact. */
export function StepTravelers({ data, setData, trip, onNext, onPrev }: Props) {
  // Errors only show after the first try to continue, then update as they type
  const [tried, setTried] = useState(false);

  const start = parseDate(data.startDate)!;
  const end = calculateEndDate(start, tripDays(trip, data));
  const mustReach = passportMustBeValidUntil(end);

  const docErrors = data.travelers.map((t, i) => checkTraveler(t, { start, end }, { lead: i === 0 }));
  const numbers = data.travelers.map((t) => t.passportNumber.toUpperCase().replace(/[\s-]/g, ""));
  const duplicate = numbers.findIndex((n, i) => n && numbers.indexOf(n) !== i);
  const contactErrors = {
    phone: data.contact.phone.trim().length < 6 ? "Enter a phone or WhatsApp number we can reach you on." : "",
    emergencyName: data.emergency.name.trim().length < 2 ? "Give the name of someone we can call in an emergency." : "",
    emergencyPhone: data.emergency.phone.trim().length < 6 ? "Give their phone number." : "",
  };
  const problems =
    docErrors.reduce((n, e) => n + Object.keys(e).length, 0) + Object.values(contactErrors).filter(Boolean).length + (duplicate !== -1 ? 1 : 0);

  function update(i: number, patch: Partial<TravelerDocs>) {
    const travelers = data.travelers.map((t, n) => (n === i ? { ...t, ...patch } : t));
    setData({ ...data, travelers });
  }

  function handleContinue() {
    setTried(true);
    if (problems > 0) {
      // Take them to the first thing that needs fixing
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    onNext();
  }

  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">Step 2 of 3</p>
      <h2 className="font-display text-3xl leading-tight sm:text-4xl">Travelers and documents.</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Enter each traveler exactly as in their passport. Passports must be valid until at least{" "}
        <span className="font-medium text-ink">{formatDate(mustReach)}</span>, six months after your trip ends.
      </p>

      <div className="mt-10 max-w-3xl space-y-10">
        {data.travelers.map((t, i) => {
          const e = tried ? docErrors[i] : {};
          const id = (f: string) => `t${i}-${f}`;
          const local = t.nationality === HOME_COUNTRY;
          const nid = isNationalId(t.nationality, t.passportNumber);
          return (
            <fieldset key={i} className="rounded-lg border border-forest-900/10 p-5 sm:p-6">
              <legend className="px-2 font-display text-2xl">
                {i === 0 ? (data.travelers.length === 1 ? "Traveler" : "Traveler 1 (you)") : `Traveler ${i + 1}`}
              </legend>
              {i === 0 && <p className="mb-5 text-sm text-ink-mute">You make the booking, so you must be 18 or older. We contact you about the trip.</p>}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={id("name")} label="Full name, as in the passport" error={e.name} className="sm:col-span-2">
                  <Input id={id("name")} value={t.name} autoComplete={i === 0 ? "name" : "off"} onChange={(ev) => update(i, { name: ev.target.value })} aria-invalid={!!e.name} />
                </Field>
                <Field id={id("dob")} label="Date of birth" error={e.dateOfBirth}>
                  <Input id={id("dob")} type="date" value={t.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(ev) => update(i, { dateOfBirth: ev.target.value })} aria-invalid={!!e.dateOfBirth} />
                </Field>
                <Field id={id("nationality")} label="Nationality" error={e.nationality}>
                  <select
                    id={id("nationality")}
                    value={t.nationality}
                    onChange={(ev) => update(i, { nationality: ev.target.value, ...(ev.target.value === HOME_COUNTRY ? { visaStatus: "", visaNumber: "", visaExpiry: "" } : {}) })}
                    aria-invalid={!!e.nationality}
                    className={selectClass}
                  >
                    <option value="">Choose a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field id={id("passport")} label={local ? "Passport or NID number" : "Passport number"} error={e.passportNumber}>
                  <Input
                    id={id("passport")}
                    value={t.passportNumber}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    onChange={(ev) => update(i, { passportNumber: ev.target.value.toUpperCase() })}
                    aria-invalid={!!e.passportNumber}
                    className="font-mono tracking-wider"
                  />
                </Field>
                {!nid && (
                  <Field id={id("expiry")} label="Passport expiry date" error={e.passportExpiry}>
                    <Input id={id("expiry")} type="date" value={t.passportExpiry} onChange={(ev) => update(i, { passportExpiry: ev.target.value })} aria-invalid={!!e.passportExpiry} />
                  </Field>
                )}
              </div>

              {t.nationality && needsVisa(t.nationality) && (
                <div className="mt-6 rounded-md bg-paper-warm p-4">
                  <p className="text-sm font-medium">Visa for Bangladesh</p>
                  <div className="mt-3 space-y-2" role="radiogroup" aria-label="Visa for Bangladesh">
                    {VISA_STATUSES.map((v) => (
                      <label key={v.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
                        <input
                          type="radio"
                          name={id("visa")}
                          value={v.value}
                          checked={t.visaStatus === v.value}
                          onChange={() => update(i, { visaStatus: v.value, ...(v.value === "HAVE_VISA" ? {} : { visaNumber: "", visaExpiry: "" }) })}
                          className="size-4 accent-forest-800"
                        />
                        {v.label}
                      </label>
                    ))}
                  </div>
                  {e.visaStatus && <ErrorText>{e.visaStatus}</ErrorText>}
                  {t.visaStatus === "HAVE_VISA" && (
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <Field id={id("visaNumber")} label="Visa number" error={e.visaNumber}>
                        <Input id={id("visaNumber")} value={t.visaNumber} autoComplete="off" spellCheck={false} onChange={(ev) => update(i, { visaNumber: ev.target.value.toUpperCase() })} aria-invalid={!!e.visaNumber} className="font-mono tracking-wider" />
                      </Field>
                      <Field id={id("visaExpiry")} label="Visa expiry date" error={e.visaExpiry}>
                        <Input id={id("visaExpiry")} type="date" value={t.visaExpiry} onChange={(ev) => update(i, { visaExpiry: ev.target.value })} aria-invalid={!!e.visaExpiry} />
                      </Field>
                    </div>
                  )}
                  {(t.visaStatus === "ON_ARRIVAL" || t.visaStatus === "APPLYING") && (
                    <p className="mt-3 text-xs leading-relaxed text-ink-mute">
                      {t.visaStatus === "ON_ARRIVAL"
                        ? "Visa on arrival isn't available to every nationality. Check with the nearest Bangladesh embassy before you fly."
                        : "Send us your visa as soon as you have it."}{" "}
                      We&rsquo;ll ask to see the visa before your trip starts.
                    </p>
                  )}
                </div>
              )}
              {tried && duplicate === i && <ErrorText>This passport number is already used for another traveler.</ErrorText>}
            </fieldset>
          );
        })}

        <fieldset className="rounded-lg border border-forest-900/10 p-5 sm:p-6">
          <legend className="px-2 font-display text-2xl">How we reach you</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="contact-email" label="Email">
              <Input id="contact-email" type="email" value={data.contact.email} readOnly className="bg-paper-warm text-ink-soft" />
            </Field>
            <Field id="contact-phone" label="Phone or WhatsApp, with country code" error={tried ? contactErrors.phone : ""}>
              <Input id="contact-phone" type="tel" autoComplete="tel" placeholder="+44 7700 900123" value={data.contact.phone} onChange={(ev) => setData({ ...data, contact: { ...data.contact, phone: ev.target.value } })} />
            </Field>
          </div>
          <p className="mb-4 mt-8 text-sm font-medium">Emergency contact <span className="font-normal text-ink-mute">(someone not travelling with you)</span></p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="emergency-name" label="Their name" error={tried ? contactErrors.emergencyName : ""}>
              <Input id="emergency-name" value={data.emergency.name} autoComplete="off" onChange={(ev) => setData({ ...data, emergency: { ...data.emergency, name: ev.target.value } })} />
            </Field>
            <Field id="emergency-phone" label="Their phone, with country code" error={tried ? contactErrors.emergencyPhone : ""}>
              <Input id="emergency-phone" type="tel" autoComplete="off" value={data.emergency.phone} onChange={(ev) => setData({ ...data, emergency: { ...data.emergency, phone: ev.target.value } })} />
            </Field>
          </div>
        </fieldset>
      </div>

      {tried && problems > 0 && (
        <p className="mt-6 text-sm text-clay-600" role="alert">
          {problems === 1 ? "One thing needs fixing above." : `${problems} things need fixing above.`}
        </p>
      )}

      <StepActions onPrev={onPrev} onNext={handleContinue} />
    </div>
  );
}

function Field({ id, label, error, className, children }: { id: string; label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p data-field-error className="mt-1.5 text-xs text-clay-600" role="alert">
      {children}
    </p>
  );
}
