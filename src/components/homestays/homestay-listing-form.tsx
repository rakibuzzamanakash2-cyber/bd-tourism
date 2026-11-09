"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/admin/form";
import { Chips } from "@/components/guides/guide-profile-form";
import { PhotosField } from "@/components/homestays/photos-field";
import { adminUpdateHomestay } from "@/lib/actions/admin/homestays";
import { getHostUploadSignature, updateMyHomestayAction } from "@/lib/actions/host";
import { FACILITY_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/applications";
import { bdt } from "@/lib/guide-shared";
import { guestNightlyBDT } from "@/lib/homestay-shared";
import { applyText } from "@/lib/i18n/apply";
import { hostText } from "@/lib/i18n/host";

export type HomestayFormValues = {
  name: string;
  regionId: string;
  district: string;
  area: string;
  address: string;
  description: string;
  houseRules: string;
  rooms: string;
  maxGuests: string;
  facilities: string[];
  languages: string[];
  pricePerNightBDT: string;
  photos: string[];
  isListed: boolean;
};

type Props = {
  initial: HomestayFormValues;
  regions: { id: string; name: string }[];
  uploadsEnabled: boolean;
  lang?: "en" | "bn";
} & ({ mode: "self" } | { mode: "admin"; id: string; phone: string; isActive: boolean });

export function HomestayListingForm(props: Props) {
  const lang = props.lang ?? "en";
  const t = hostText[lang];
  const facilityLabel = applyText[lang].facility;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState(props.initial);
  const [phone, setPhone] = useState(props.mode === "admin" ? props.phone : "");
  const [isActive, setIsActive] = useState(props.mode === "admin" ? props.isActive : true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof HomestayFormValues>(k: K, value: HomestayFormValues[K]) => setV((x) => ({ ...x, [k]: value }));
  const toggle = (k: "facilities" | "languages", item: string) =>
    setV((x) => ({ ...x, [k]: x[k].includes(item) ? x[k].filter((i) => i !== item) : [...x[k], item] }));
  const languageOptions = [...new Set([...LANGUAGE_OPTIONS, ...props.initial.languages])];
  const guestPrice = Number(v.pricePerNightBDT) > 0 ? bdt(guestNightlyBDT(Number(v.pricePerNightBDT))) : "—";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const data = { ...v, facilities: v.facilities as (typeof FACILITY_OPTIONS)[number][] };
      const r = props.mode === "admin" ? await adminUpdateHomestay({ ...data, id: props.id, phone, isActive }) : await updateMyHomestayAction(data);
      if (!r.ok) {
        setErrors(("fieldErrors" in r && r.fieldErrors) || {});
        return void toast.error(props.mode === "admin" ? r.error : (t.errors[r.error] ?? t.errors.generic));
      }
      setErrors({});
      toast.success(props.mode === "admin" ? "Homestay saved" : t.saved);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PhotosField value={v.photos} onChange={(p) => set("photos", p)} uploadsEnabled={props.uploadsEnabled} sign={props.mode === "self" ? getHostUploadSignature : undefined} t={t.photos} error={errors.photos} />
      <Field id="name" label={t.name} required error={errors.name}>
        <input id="name" className={inputClass} value={v.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="regionId" label={t.region} required error={errors.regionId}>
          <select id="regionId" className={inputClass} value={v.regionId} onChange={(e) => set("regionId", e.target.value)}>
            {props.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field id="district" label={t.district} required error={errors.district}>
          <input id="district" className={inputClass} value={v.district} onChange={(e) => set("district", e.target.value)} />
        </Field>
      </div>
      <Field id="area" label={t.area} required error={errors.area}>
        <input id="area" className={inputClass} value={v.area} onChange={(e) => set("area", e.target.value)} />
      </Field>
      <Field id="address" label={t.address} error={errors.address}>
        <textarea id="address" rows={2} className={inputClass} value={v.address} onChange={(e) => set("address", e.target.value)} />
      </Field>
      <Field id="description" label={t.description} hint={t.descriptionHint} required error={errors.description}>
        <textarea id="description" rows={6} maxLength={3000} className={inputClass} value={v.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field id="houseRules" label={t.houseRules} error={errors.houseRules}>
        <textarea id="houseRules" rows={3} maxLength={1500} className={inputClass} value={v.houseRules} onChange={(e) => set("houseRules", e.target.value)} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field id="rooms" label={t.rooms} error={errors.rooms}>
          <input id="rooms" type="number" min={1} max={20} className={inputClass} value={v.rooms} onChange={(e) => set("rooms", e.target.value)} />
        </Field>
        <Field id="maxGuests" label={t.maxGuests} error={errors.maxGuests}>
          <input id="maxGuests" type="number" min={1} max={30} className={inputClass} value={v.maxGuests} onChange={(e) => set("maxGuests", e.target.value)} />
        </Field>
        <Field id="pricePerNightBDT" label={t.price} required error={errors.pricePerNightBDT}>
          <input id="pricePerNightBDT" type="number" min={300} step={50} className={inputClass} value={v.pricePerNightBDT} onChange={(e) => set("pricePerNightBDT", e.target.value)} />
        </Field>
      </div>
      <p className="-mt-3 text-xs text-ink-mute">{t.priceHint(guestPrice)}</p>
      <Chips legend={t.facilities} options={FACILITY_OPTIONS.map((f) => ({ value: f, label: facilityLabel[f] ?? f }))} selected={v.facilities} onToggle={(f) => toggle("facilities", f)} error={errors.facilities} />
      <Chips legend={t.languages} options={languageOptions.map((l) => ({ value: l, label: l }))} selected={v.languages} onToggle={(l) => toggle("languages", l)} error={errors.languages} />
      {props.mode === "admin" && (
        <Field id="phone" label="Host phone (private)" error={errors.phone}>
          <input id="phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      )}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4" checked={v.isListed} onChange={(e) => set("isListed", e.target.checked)} />
        <span>{t.listed}<span className="block text-xs text-ink-mute">{t.listedHint}</span></span>
      </label>
      {props.mode === "admin" && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Active<span className="block text-xs text-ink-mute">Untick to pause: hidden from travelers and no new bookings.</span></span>
        </label>
      )}
      <button type="submit" disabled={pending} className="rounded-full bg-forest-900 px-8 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-60">
        {pending ? "…" : props.mode === "admin" ? "Save homestay" : t.save}
      </button>
    </form>
  );
}
