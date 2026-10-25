"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { adminUpdateGuide } from "@/lib/actions/admin/guides";
import { getGuideUploadSignature, updateMyGuideProfileAction } from "@/lib/actions/guide";
import { LANGUAGE_OPTIONS } from "@/lib/applications";
import { guideText } from "@/lib/i18n/guide";
import { cn } from "@/lib/utils";

export type GuideFormValues = {
  displayName: string;
  photoUrl: string;
  bio: string;
  languages: string[];
  regionIds: string[];
  yearsExperience: string;
  dayRateBDT: string;
  licenceNumber: string;
  isListed: boolean;
};

type Props = {
  initial: GuideFormValues;
  regions: { id: string; name: string }[];
  uploadsEnabled: boolean;
  lang?: "en" | "bn";
} & ({ mode: "self" } | { mode: "admin"; id: string; phone: string; isActive: boolean });

/** One form for both the guide editing their own profile and the team editing it. */
export function GuideProfileForm(props: Props) {
  const { initial, regions, uploadsEnabled } = props;
  const t = guideText[props.lang ?? "en"];
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState(initial);
  const [phone, setPhone] = useState(props.mode === "admin" ? props.phone : "");
  const [isActive, setIsActive] = useState(props.mode === "admin" ? props.isActive : true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof GuideFormValues>(k: K, value: GuideFormValues[K]) => setV((x) => ({ ...x, [k]: value }));
  const toggle = (k: "languages" | "regionIds", item: string) =>
    setV((x) => ({ ...x, [k]: x[k].includes(item) ? x[k].filter((i) => i !== item) : [...x[k], item] }));
  // Languages they listed that aren't in our list (e.g. "Bawm") stay selectable
  const languageOptions = [...new Set([...LANGUAGE_OPTIONS, ...initial.languages])];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r =
        props.mode === "admin"
          ? await adminUpdateGuide({ ...v, id: props.id, phone, isActive })
          : await updateMyGuideProfileAction(v);
      if (!r.ok) {
        setErrors(("fieldErrors" in r && r.fieldErrors) || {});
        return void toast.error(props.mode === "admin" ? r.error : (t.errors[r.error] ?? t.errors.generic));
      }
      setErrors({});
      toast.success(props.mode === "admin" ? "Guide saved" : t.saved);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field id="displayName" label={t.displayName} required error={errors.displayName}>
        <input id="displayName" className={inputClass} value={v.displayName} onChange={(e) => set("displayName", e.target.value)} />
      </Field>
      <ImageField
        name="photoUrl"
        label={t.photo}
        defaultValue={initial.photoUrl}
        folder="guides"
        uploadsEnabled={uploadsEnabled}
        onChange={(url) => set("photoUrl", url)}
        sign={props.mode === "self" ? getGuideUploadSignature : undefined}
      />
      {errors.photoUrl && <p className="-mt-4 text-xs text-clay-700">{errors.photoUrl}</p>}
      <Field id="bio" label={t.bio} hint={t.bioHint} required error={errors.bio}>
        <textarea id="bio" rows={6} maxLength={2000} className={inputClass} value={v.bio} onChange={(e) => set("bio", e.target.value)} />
      </Field>
      <Chips legend={t.languages} options={languageOptions.map((l) => ({ value: l, label: l }))} selected={v.languages} onToggle={(l) => toggle("languages", l)} error={errors.languages} />
      <Chips legend={t.regions} options={regions.map((r) => ({ value: r.id, label: r.name }))} selected={v.regionIds} onToggle={(r) => toggle("regionIds", r)} error={errors.regionIds} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="yearsExperience" label={t.years} error={errors.yearsExperience}>
          <input id="yearsExperience" type="number" min={0} max={60} className={inputClass} value={v.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} />
        </Field>
        <Field id="dayRateBDT" label={t.dayRate} hint={t.dayRateHint} required error={errors.dayRateBDT}>
          <input id="dayRateBDT" type="number" min={500} step={100} className={inputClass} value={v.dayRateBDT} onChange={(e) => set("dayRateBDT", e.target.value)} />
        </Field>
      </div>
      <Field id="licenceNumber" label={t.licence} error={errors.licenceNumber}>
        <input id="licenceNumber" className={inputClass} value={v.licenceNumber} onChange={(e) => set("licenceNumber", e.target.value)} />
      </Field>
      {props.mode === "admin" && (
        <Field id="phone" label="Phone (private)" error={errors.phone}>
          <input id="phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      )}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4" checked={v.isListed} onChange={(e) => set("isListed", e.target.checked)} />
        <span>
          {t.listed}
          <span className="block text-xs text-ink-mute">{t.listedHint}</span>
        </span>
      </label>
      {props.mode === "admin" && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>
            Active
            <span className="block text-xs text-ink-mute">Untick to pause this guide: hidden from travelers and can&rsquo;t be assigned new trips.</span>
          </span>
        </label>
      )}
      <button type="submit" disabled={pending} className="rounded-full bg-forest-900 px-8 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-60">
        {pending ? "…" : props.mode === "admin" ? "Save guide" : t.save}
      </button>
    </form>
  );
}

function Chips({ legend, options, selected, onToggle, error }: { legend: string; options: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void; error?: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">
        {legend} <span className="text-clay-600">*</span>
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-700",
                on ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 hover:border-forest-900/40",
              )}
            >
              <input type="checkbox" className="sr-only" checked={on} onChange={() => onToggle(o.value)} />
              {o.label}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-clay-700">{error}</p>}
    </fieldset>
  );
}
