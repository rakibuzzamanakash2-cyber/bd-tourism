"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  updateProfileAction,
  type ProfileState,
} from "@/lib/actions/profile";

type Props = {
  user: {
    name: string | null;
    email: string;
  };
  profile: {
    nationality: string | null;
    phoneNumber: string | null;
    passportNumber: string | null;
    emergencyContact: string | null;
    dietaryPrefs: string | null;
  } | null;
};

export function ProfileForm({ user, profile }: Props) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Profile updated", {
        description: "Your details have been saved.",
      });
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-12">
      <Section title="Account" description="Your name and login email.">
        <FormField
          label="Name"
          name="name"
          defaultValue={user.name ?? ""}
          error={state?.fieldErrors?.name}
          required
        />
        <ReadonlyField
          label="Email"
          value={user.email}
          note="Change your email in Settings (coming soon)."
        />
      </Section>

      <Section
        title="Traveler details"
        description="Used for booking, permit applications, and matching you with the right guide or homestay."
      >
        <FormField
          label="Nationality"
          name="nationality"
          defaultValue={profile?.nationality ?? ""}
          placeholder="e.g. Australian"
          error={state?.fieldErrors?.nationality}
        />
        <FormField
          label="Phone number"
          name="phoneNumber"
          type="tel"
          defaultValue={profile?.phoneNumber ?? ""}
          placeholder="+880 1XXX-XXXXXX"
          error={state?.fieldErrors?.phoneNumber}
        />
        <FormField
          label="Passport number"
          name="passportNumber"
          defaultValue={profile?.passportNumber ?? ""}
          placeholder="For permit applications"
          error={state?.fieldErrors?.passportNumber}
        />
        <FormField
          label="Emergency contact"
          name="emergencyContact"
          defaultValue={profile?.emergencyContact ?? ""}
          placeholder="Name and phone number"
          error={state?.fieldErrors?.emergencyContact}
        />
        <div>
          <Label htmlFor="dietaryPrefs" className="text-sm">
            Dietary preferences
          </Label>
          <Textarea
            id="dietaryPrefs"
            name="dietaryPrefs"
            defaultValue={profile?.dietaryPrefs ?? ""}
            placeholder="Vegetarian, halal, allergies, anything a host or guide should know..."
            rows={4}
            className="mt-1.5"
          />
          {state?.fieldErrors?.dietaryPrefs && (
            <p className="mt-1.5 text-xs text-clay-600">
              {state.fieldErrors.dietaryPrefs}
            </p>
          )}
        </div>
      </Section>

      <div className="flex items-center gap-4 border-t border-forest-900/10 pt-8">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            buttonVariants({ size: "lg" }),
            "rounded-full bg-forest-900 px-8 text-paper hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {state?.success && (
          <p className="text-sm text-forest-700">Saved.</p>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 border-b border-forest-900/10 pb-4">
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-ink-mute">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name} className="text-sm">
        {label}
        {!required && (
          <span className="ml-2 text-xs text-ink-mute">Optional</span>
        )}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1.5"
        aria-invalid={!!error}
      />
      {error && <p className="mt-1.5 text-xs text-clay-600">{error}</p>}
    </div>
  );
}

function ReadonlyField({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5 rounded-md border border-forest-900/10 bg-paper-warm px-3 py-2 text-sm text-ink">
        {value}
      </div>
      {note && <p className="mt-1.5 text-xs text-ink-mute">{note}</p>}
    </div>
  );
}
