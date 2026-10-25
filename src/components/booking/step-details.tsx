"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { AdditionalTraveler, WizardData } from "./booking-wizard";
import { StepActions } from "./booking-wizard";

type Props = {
  data: WizardData;
  setData: (d: WizardData) => void;
  isRestricted: boolean;
  onNext: () => void;
  onPrev: () => void;
};

export function StepDetails({
  data,
  setData,
  isRestricted,
  onNext,
  onPrev,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updatePrimary(
    field: keyof WizardData["primaryContact"],
    value: string,
  ) {
    setData({
      ...data,
      primaryContact: { ...data.primaryContact, [field]: value },
    });
  }

  function updateAdditional(
    index: number,
    field: keyof AdditionalTraveler,
    value: string,
  ) {
    const next = [...data.additionalTravelers];
    next[index] = { ...next[index], [field]: value };
    setData({ ...data, additionalTravelers: next });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (
      !data.primaryContact.name.trim() ||
      data.primaryContact.name.length < 2
    ) {
      newErrors["primary.name"] = "Name is required";
    }
    if (
      !data.primaryContact.phone.trim() ||
      data.primaryContact.phone.length < 6
    ) {
      newErrors["primary.phone"] = "Phone is required";
    }

    // Restricted-area tours require passport + nationality for primary traveler
    if (isRestricted) {
      if (!data.primaryContact.passportNumber.trim()) {
        newErrors["primary.passport"] = "Passport number required for permit";
      }
      if (!data.primaryContact.nationality.trim()) {
        newErrors["primary.nationality"] = "Nationality required for permit";
      }
    }

    data.additionalTravelers.forEach((t, i) => {
      if (!t.name.trim() || t.name.length < 2) {
        newErrors[`t${i}.name`] = "Name required";
      }
      // Passport details are only required when the tour needs a permit
      if (isRestricted) {
        if (!t.passportNumber.trim()) {
          newErrors[`t${i}.passport`] = "Passport number required for permit";
        }
        if (!t.nationality.trim()) {
          newErrors[`t${i}.nationality`] = "Nationality required for permit";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleContinue() {
    if (validate()) onNext();
  }

  return (
    <div>
      <p className="eyebrow mb-3 text-forest-700">Step 3 of 4</p>
      <h2 className="font-display text-3xl leading-tight sm:text-4xl">
        Traveler details.
      </h2>
      <p className="mt-3 max-w-xl text-ink-soft">
        {isRestricted
          ? "This tour requires permit paperwork — please provide passport details for all travelers."
          : "We'll use these to contact you and match you with the right guide."}
      </p>

      {/* Primary contact */}
      <div className="mt-10 max-w-2xl">
        <div className="mb-6 border-b border-forest-900/10 pb-4">
          <h3 className="font-display text-2xl">Primary contact</h3>
          <p className="mt-1 text-sm text-ink-mute">
            You&rsquo;re traveler #1. This is who we&rsquo;ll contact about the
            booking.
          </p>
        </div>

        <div className="space-y-4">
          <Field
            label="Full name"
            required
            value={data.primaryContact.name}
            onChange={(v) => updatePrimary("name", v)}
            error={errors["primary.name"]}
          />
          <Field
            label="Email"
            value={data.primaryContact.email}
            readOnly
            note="This is your account email."
          />
          <Field
            label="Phone number"
            required
            type="tel"
            placeholder="+880 1XXX-XXXXXX"
            value={data.primaryContact.phone}
            onChange={(v) => updatePrimary("phone", v)}
            error={errors["primary.phone"]}
          />

          {/* Passport + nationality — only shown when restricted */}
          {isRestricted && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Passport number"
                required
                value={data.primaryContact.passportNumber}
                onChange={(v) => updatePrimary("passportNumber", v)}
                error={errors["primary.passport"]}
                note="For your permit application"
              />
              <Field
                label="Nationality"
                required
                placeholder="e.g. British"
                value={data.primaryContact.nationality}
                onChange={(v) => updatePrimary("nationality", v)}
                error={errors["primary.nationality"]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Additional travelers */}
      {data.additionalTravelers.length > 0 && (
        <div className="mt-14 max-w-2xl">
          <div className="mb-6 border-b border-forest-900/10 pb-4">
            <h3 className="font-display text-2xl">Additional travelers</h3>
            <p className="mt-1 text-sm text-ink-mute">
              {isRestricted
                ? "Passport number and nationality are required for permit processing."
                : "Passport and nationality are helpful if this tour visits any restricted areas — otherwise optional."}
            </p>
          </div>

          <div className="space-y-10">
            {data.additionalTravelers.map((t, i) => (
              <div key={i}>
                <p className="eyebrow mb-4 text-ink-mute">
                  Traveler #{i + 2}
                </p>
                <div className="space-y-4">
                  <Field
                    label="Full name"
                    required
                    value={t.name}
                    onChange={(v) => updateAdditional(i, "name", v)}
                    error={errors[`t${i}.name`]}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Passport number"
                      required={isRestricted}
                      value={t.passportNumber}
                      onChange={(v) =>
                        updateAdditional(i, "passportNumber", v)
                      }
                      error={errors[`t${i}.passport`]}
                    />
                    <Field
                      label="Nationality"
                      required={isRestricted}
                      placeholder="e.g. British"
                      value={t.nationality}
                      onChange={(v) => updateAdditional(i, "nationality", v)}
                      error={errors[`t${i}.nationality`]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special requests */}
      <div className="mt-14 max-w-2xl">
        <div className="mb-6 border-b border-forest-900/10 pb-4">
          <h3 className="font-display text-2xl">Anything we should know?</h3>
          <p className="mt-1 text-sm text-ink-mute">
            Dietary needs, mobility considerations, celebrations, whatever you
            want us to plan around.
          </p>
        </div>
        <Textarea
          rows={5}
          placeholder="Vegetarian meals for two, arriving late on day 1, quiet room preferred…"
          value={data.specialRequests}
          onChange={(e) =>
            setData({ ...data, specialRequests: e.target.value })
          }
        />
      </div>

      <StepActions onPrev={onPrev} onNext={handleContinue} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  readOnly,
  error,
  note,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  error?: string;
  note?: string;
}) {
  return (
    <div>
      <Label className="text-sm">
        {label}
        {!required && !readOnly && (
          <span className="ml-2 text-xs text-ink-mute">Optional</span>
        )}
      </Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={`mt-1.5 ${readOnly ? "bg-paper-warm text-ink-soft" : ""}`}
        aria-invalid={!!error}
      />
      {error && <p className="mt-1.5 text-xs text-clay-600">{error}</p>}
      {note && !error && (
        <p className="mt-1.5 text-xs text-ink-mute">{note}</p>
      )}
    </div>
  );
}
