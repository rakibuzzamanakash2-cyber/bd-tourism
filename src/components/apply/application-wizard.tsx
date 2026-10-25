"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FileCheck2, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/admin/form";
import {
  getApplicantUploadSignature,
  saveApplicationStepAction,
  submitApplicationAction,
} from "@/lib/actions/applications";
import {
  FACILITY_OPTIONS,
  LANGUAGE_OPTIONS,
  STEPS,
  kindParam,
  type Kind,
  type PrivateFile,
  type StepId,
} from "@/lib/applications";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import { applyText, type Lang } from "@/lib/i18n/apply";
import { cn } from "@/lib/utils";

type Reference = { name: string; phone: string; relation: string };
export type WizardValues = {
  fullName: string;
  phone: string;
  regionIds: string[];
  heardFrom: string;
  // guide
  languages: string[];
  yearsExperience: string;
  bio: string;
  dayRateBDT: string;
  availability: string;
  licenceNumber: string;
  references: Reference[];
  photoUrl: string;
  licenceDocument: PrivateFile | null;
  // host
  district: string;
  area: string;
  rooms: string;
  maxGuests: string;
  facilities: string[];
  family: string;
  houseRules: string;
  pricePerNightBDT: string;
  homePhotos: string[];
  // both
  idDocument: PrivateFile | null;
  shareIdLater: boolean;
};

type Props = {
  kind: Kind;
  lang: Lang;
  step: number; // 1-based
  maxStep: number;
  uploadsEnabled: boolean;
  regions: { id: string; name: string }[];
  initial: WizardValues;
};

export function ApplicationWizard({ kind, lang, step, maxStep, uploadsEnabled, regions, initial }: Props) {
  const t = applyText[lang];
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState<WizardValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const steps = STEPS[kind] as readonly StepId[];
  const current = steps[step - 1];
  const base = `/apply/${kindParam(kind)}`;
  const href = (n: number) => `${base}?step=${n}${lang === "bn" ? "&lang=bn" : ""}`;

  const set = <K extends keyof WizardValues>(k: K, val: WizardValues[K]) => setV((x) => ({ ...x, [k]: val }));
  const toggle = (k: "regionIds" | "languages" | "facilities", item: string) =>
    setV((x) => ({ ...x, [k]: x[k].includes(item) ? x[k].filter((i) => i !== item) : [...x[k], item] }));
  const err = (k: string) => (errors[k] ? (t.errors[errors[k]] ?? t.errors.generic) : undefined);

  function dataFor(s: StepId) {
    switch (s) {
      case "basics":
        return { fullName: v.fullName, phone: v.phone, regionIds: v.regionIds, heardFrom: v.heardFrom };
      case "experience":
        return { languages: v.languages, yearsExperience: v.yearsExperience, bio: v.bio, dayRateBDT: v.dayRateBDT, availability: v.availability, licenceNumber: v.licenceNumber };
      case "home":
        return { district: v.district, area: v.area, rooms: v.rooms, maxGuests: v.maxGuests, facilities: v.facilities, languages: v.languages, family: v.family, houseRules: v.houseRules, pricePerNightBDT: v.pricePerNightBDT };
      case "references":
        return { references: v.references };
      case "documents":
        return kind === "GUIDE"
          ? { photoUrl: v.photoUrl, licenceDocument: v.licenceDocument, idDocument: v.idDocument, shareIdLater: v.shareIdLater }
          : { homePhotos: v.homePhotos, idDocument: v.idDocument, shareIdLater: v.shareIdLater };
      default:
        return {};
    }
  }

  function save(then: "next" | "later") {
    start(async () => {
      const r = await saveApplicationStepAction({ kind, step: current, data: dataFor(current), language: lang });
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.error === "fixErrors" ? t.fixErrors : r.error === "signin" ? "Please sign in again." : t.errors.generic);
        return;
      }
      setErrors({});
      if (then === "later") {
        toast.success(t.saved);
        router.push("/dashboard/application");
      } else {
        router.push(href(r.nextStep));
      }
    });
  }

  function submit() {
    if (!confirmed) return void toast.error(t.confirmRequired);
    start(async () => {
      const r = await submitApplicationAction({ kind, confirmed });
      if (!r.ok) {
        if (r.goToStep) {
          toast.error(t.fixErrors);
          router.push(href(r.goToStep));
        } else toast.error(r.error === "confirmRequired" ? t.confirmRequired : t.errors.generic);
        return;
      }
      router.push("/dashboard/application?submitted=1");
    });
  }

  const regionName = (id: string) => regions.find((r) => r.id === id)?.name ?? "—";

  return (
    <div>
      {/* Progress */}
      <ol className="mb-10 flex flex-wrap gap-2">
        {steps.map((s, i) => {
          const n = i + 1;
          const reachable = n <= maxStep;
          const label = (
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                n === step ? "border-forest-900 bg-forest-900 text-paper" : reachable ? "border-forest-900/20 text-ink" : "border-forest-900/10 text-ink-mute",
              )}
            >
              <span className="text-xs">{n < step || (reachable && n !== step) ? <Check className="size-3.5" /> : n}</span>
              {t.steps[s]}
            </span>
          );
          return <li key={s}>{reachable && n !== step ? <Link href={href(n)}>{label}</Link> : label}</li>;
        })}
      </ol>

      <p className="eyebrow mb-2 text-forest-700">{t.stepOf(step, steps.length)}</p>
      <h2 className="mb-8 font-display text-3xl">{t.steps[current]}</h2>

      <div className="space-y-6">
        {current === "basics" && (
          <>
            <Field id="fullName" label={t.fullName} required error={err("fullName")}>
              <input id="fullName" className={inputClass} value={v.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" />
            </Field>
            <Field id="phone" label={t.phone} hint={t.phoneHint} required error={err("phone")}>
              <input id="phone" className={inputClass} value={v.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXX-XXXXXX" />
            </Field>
            <CheckGroup
              legend={kind === "GUIDE" ? t.regionsGuide : t.regionsHost}
              options={regions.map((r) => ({ value: r.id, label: r.name }))}
              selected={v.regionIds}
              onToggle={(id) => (kind === "HOST" ? set("regionIds", [id]) : toggle("regionIds", id))}
              error={err("regionIds")}
              single={kind === "HOST"}
            />
            <Field id="heardFrom" label={`${t.heardFrom} (${t.optional})`} hint={t.heardFromHint}>
              <input id="heardFrom" className={inputClass} value={v.heardFrom} onChange={(e) => set("heardFrom", e.target.value)} />
            </Field>
          </>
        )}

        {current === "experience" && (
          <>
            <CheckGroup legend={t.languages} options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))} selected={v.languages} onToggle={(l) => toggle("languages", l)} error={err("languages")} />
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="yearsExperience" label={t.yearsExperience} required error={err("yearsExperience")}>
                <input id="yearsExperience" type="number" min={0} max={60} className={inputClass} value={v.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} />
              </Field>
              <Field id="dayRateBDT" label={t.dayRate} hint={t.dayRateHint} required error={err("dayRateBDT")}>
                <input id="dayRateBDT" type="number" min={500} step={100} className={inputClass} value={v.dayRateBDT} onChange={(e) => set("dayRateBDT", e.target.value)} />
              </Field>
            </div>
            <Field id="bio" label={t.bio} hint={t.bioHint} required error={err("bio")}>
              <textarea id="bio" rows={5} className={inputClass} value={v.bio} onChange={(e) => set("bio", e.target.value)} maxLength={2000} />
            </Field>
            <Field id="availability" label={`${t.availability} (${t.optional})`} hint={t.availabilityHint}>
              <input id="availability" className={inputClass} value={v.availability} onChange={(e) => set("availability", e.target.value)} />
            </Field>
            <Field id="licenceNumber" label={`${t.licenceNumber} (${t.optional})`} hint={t.licenceHint}>
              <input id="licenceNumber" className={inputClass} value={v.licenceNumber} onChange={(e) => set("licenceNumber", e.target.value)} />
            </Field>
          </>
        )}

        {current === "home" && (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="district" label={t.district} required error={err("district")}>
                <input id="district" className={inputClass} value={v.district} onChange={(e) => set("district", e.target.value)} />
              </Field>
              <Field id="area" label={t.area} hint={t.areaHint} required error={err("area")}>
                <input id="area" className={inputClass} value={v.area} onChange={(e) => set("area", e.target.value)} />
              </Field>
              <Field id="rooms" label={t.rooms} required error={err("rooms")}>
                <input id="rooms" type="number" min={1} max={20} className={inputClass} value={v.rooms} onChange={(e) => set("rooms", e.target.value)} />
              </Field>
              <Field id="maxGuests" label={t.maxGuests} required error={err("maxGuests")}>
                <input id="maxGuests" type="number" min={1} max={30} className={inputClass} value={v.maxGuests} onChange={(e) => set("maxGuests", e.target.value)} />
              </Field>
            </div>
            <CheckGroup legend={t.facilities} options={FACILITY_OPTIONS.map((f) => ({ value: f, label: t.facility[f] }))} selected={v.facilities} onToggle={(f) => toggle("facilities", f)} />
            <CheckGroup legend={t.languagesHost} options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))} selected={v.languages} onToggle={(l) => toggle("languages", l)} error={err("languages")} />
            <Field id="family" label={t.family} hint={t.familyHint} required error={err("family")}>
              <textarea id="family" rows={3} className={inputClass} value={v.family} onChange={(e) => set("family", e.target.value)} maxLength={1000} />
            </Field>
            <Field id="houseRules" label={`${t.houseRules} (${t.optional})`} hint={t.houseRulesHint}>
              <textarea id="houseRules" rows={3} className={inputClass} value={v.houseRules} onChange={(e) => set("houseRules", e.target.value)} maxLength={1000} />
            </Field>
            <Field id="pricePerNightBDT" label={t.pricePerNight} required error={err("pricePerNightBDT")}>
              <input id="pricePerNightBDT" type="number" min={300} step={50} className={`${inputClass} sm:w-60`} value={v.pricePerNightBDT} onChange={(e) => set("pricePerNightBDT", e.target.value)} />
            </Field>
          </>
        )}

        {current === "documents" && (
          <>
            {kind === "GUIDE" ? (
              <PhotoUpload
                label={t.profilePhoto}
                hint={t.profilePhotoHint}
                value={v.photoUrl ? [v.photoUrl] : []}
                onChange={(urls) => set("photoUrl", urls[0] ?? "")}
                max={1}
                enabled={uploadsEnabled}
                t={t}
                error={err("photoUrl")}
              />
            ) : (
              <PhotoUpload
                label={t.homePhotos}
                hint={t.homePhotosHint}
                value={v.homePhotos}
                onChange={(urls) => set("homePhotos", urls)}
                max={12}
                enabled={uploadsEnabled}
                t={t}
                error={err("homePhotos")}
              />
            )}
            {!uploadsEnabled && <p className="rounded-md bg-paper-warm px-4 py-3 text-sm text-ink-soft">{t.uploadsUnavailable}</p>}
            <DocumentUpload label={t.idDocument} hint={t.idHint} value={v.idDocument} onChange={(f) => set("idDocument", f)} enabled={uploadsEnabled} t={t} error={err("idDocument")} />
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" className="mt-0.5 size-4" checked={v.shareIdLater} onChange={(e) => set("shareIdLater", e.target.checked)} />
              {t.shareIdLater}
            </label>
            {kind === "GUIDE" && (
              <DocumentUpload
                label={`${t.licenceDocument} (${t.optional})`}
                value={v.licenceDocument}
                onChange={(f) => set("licenceDocument", f)}
                enabled={uploadsEnabled}
                t={t}
              />
            )}
          </>
        )}

        {current === "references" && (
          <>
            <p className="text-sm text-ink-soft">{t.referencesIntro}</p>
            {err("references") && <p className="text-xs text-clay-700">{err("references")}</p>}
            {[0, 1].map((i) => {
              const ref = v.references[i] ?? { name: "", phone: "", relation: "" };
              const update = (patch: Partial<Reference>) =>
                setV((x) => {
                  const refs = [0, 1].map((j) => x.references[j] ?? { name: "", phone: "", relation: "" });
                  refs[i] = { ...refs[i], ...patch };
                  return { ...x, references: refs };
                });
              return (
                <fieldset key={i} className="rounded-lg border border-forest-900/10 p-5">
                  <legend className="px-1 text-sm font-medium">{t.reference(i + 1)}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id={`ref${i}-name`} label={t.refName} error={err(`references.${i}.name`)}>
                      <input id={`ref${i}-name`} className={inputClass} value={ref.name} onChange={(e) => update({ name: e.target.value })} />
                    </Field>
                    <Field id={`ref${i}-phone`} label={t.refPhone} error={err(`references.${i}.phone`)}>
                      <input id={`ref${i}-phone`} className={inputClass} value={ref.phone} onChange={(e) => update({ phone: e.target.value })} inputMode="tel" placeholder="01XXX-XXXXXX" />
                    </Field>
                    <Field id={`ref${i}-relation`} label={t.refRelation} error={err(`references.${i}.relation`)} className="sm:col-span-2">
                      <input id={`ref${i}-relation`} className={inputClass} value={ref.relation} onChange={(e) => update({ relation: e.target.value })} />
                    </Field>
                  </div>
                </fieldset>
              );
            })}
          </>
        )}

        {current === "review" && (
          <>
            <p className="text-ink-soft">{t.reviewIntro}</p>
            <Summary title={t.steps.basics} editHref={href(1)} t={t} rows={[
              [t.fullName, v.fullName],
              [t.phone, v.phone],
              [kind === "GUIDE" ? t.regionsGuide : t.regionsHost, v.regionIds.map(regionName).join(", ")],
              [t.heardFrom, v.heardFrom],
            ]} />
            {kind === "GUIDE" ? (
              <>
                <Summary title={t.steps.experience} editHref={href(2)} t={t} rows={[
                  [t.languages, v.languages.join(", ")],
                  [t.yearsExperience, v.yearsExperience],
                  [t.dayRate, v.dayRateBDT && `৳${Number(v.dayRateBDT).toLocaleString()}`],
                  [t.bio, v.bio],
                  [t.availability, v.availability],
                  [t.licenceNumber, v.licenceNumber],
                ]} />
                <Summary title={t.steps.documents} editHref={href(3)} t={t} rows={[
                  [t.profilePhoto, v.photoUrl ? t.uploaded : ""],
                  [t.idDocument, v.idDocument ? t.uploaded : v.shareIdLater ? t.idOnWhatsapp : ""],
                  [t.licenceDocument, v.licenceDocument ? t.uploaded : ""],
                ]} />
                <Summary title={t.steps.references} editHref={href(4)} t={t} rows={v.references.map((r, i) => [t.reference(i + 1), r.name && `${r.name} · ${r.phone} · ${r.relation}`])} />
              </>
            ) : (
              <>
                <Summary title={t.steps.home} editHref={href(2)} t={t} rows={[
                  [t.district, v.district],
                  [t.area, v.area],
                  [t.rooms, v.rooms],
                  [t.maxGuests, v.maxGuests],
                  [t.facilities, v.facilities.map((f) => t.facility[f]).join(", ")],
                  [t.languagesHost, v.languages.join(", ")],
                  [t.family, v.family],
                  [t.houseRules, v.houseRules],
                  [t.pricePerNight, v.pricePerNightBDT && `৳${Number(v.pricePerNightBDT).toLocaleString()}`],
                ]} />
                <Summary title={t.steps.documents} editHref={href(3)} t={t} rows={[
                  [t.homePhotos, v.homePhotos.length ? `${v.homePhotos.length}` : ""],
                  [t.idDocument, v.idDocument ? t.uploaded : v.shareIdLater ? t.idOnWhatsapp : ""],
                ]} />
              </>
            )}
            <label className="flex items-start gap-2.5 rounded-lg border border-forest-900/10 bg-paper-warm p-4 text-sm">
              <input type="checkbox" className="mt-0.5 size-4" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              {t.confirm}
            </label>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-forest-900/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          {step > 1 && (
            <Link href={href(step - 1)} className="text-sm text-ink-soft hover:text-forest-800">
              ← {t.back}
            </Link>
          )}
          {current !== "review" && current !== "basics" && (
            <button type="button" disabled={pending} onClick={() => save("later")} className="text-sm text-ink-soft underline underline-offset-4 hover:text-forest-800">
              {t.saveLater}
            </button>
          )}
        </div>
        {current === "review" ? (
          <button type="button" disabled={pending} onClick={submit} className="rounded-full bg-forest-900 px-8 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-60">
            {pending ? t.submitting : t.submit}
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => save("next")} className="rounded-full bg-forest-900 px-8 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-60">
            {pending ? t.saving : t.saveContinue}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Pieces
// ============================================================
function CheckGroup({
  legend,
  options,
  selected,
  onToggle,
  error,
  single,
}: {
  legend: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  error?: string;
  single?: boolean;
}) {
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
              <input type={single ? "radio" : "checkbox"} className="sr-only" checked={on} onChange={() => onToggle(o.value)} />
              {o.label}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-clay-700">{error}</p>}
    </fieldset>
  );
}

function Summary({ title, editHref, rows, t }: { title: string; editHref: string; rows: [string, string | undefined | false][]; t: (typeof applyText)["en"] }) {
  return (
    <section className="rounded-lg border border-forest-900/10 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-sans text-xs uppercase tracking-wider text-ink-mute">{title}</h3>
        <Link href={editHref} className="text-sm underline underline-offset-4">
          {t.edit}
        </Link>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-[200px_1fr]">
        {rows.map(([k, val], i) => (
          <div key={i} className="contents">
            <dt className="text-ink-mute">{k}</dt>
            <dd className={cn("whitespace-pre-wrap", !val && "text-ink-mute italic")}>{val || t.missing}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const MAX_BYTES = 10 * 1024 * 1024;

function PhotoUpload({
  label,
  hint,
  value,
  onChange,
  max,
  enabled,
  t,
  error,
}: {
  label: string;
  hint: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max: number;
  enabled: boolean;
  t: (typeof applyText)["en"];
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function add(files: FileList) {
    setProblem(null);
    setBusy(true);
    try {
      const next = [...value];
      for (const file of Array.from(files).slice(0, max - value.length)) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("JPG, PNG or WebP only.");
        if (file.size > MAX_BYTES) throw new Error("Max 10 MB per photo.");
        const s = await getApplicantUploadSignature("applications");
        if (!s.ok) throw new Error(s.error);
        const up = await uploadToCloudinary(file, s.signature, false);
        next.push(up.secureUrl);
        onChange([...next]);
      }
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <p className="text-sm font-medium">{label}{enabled && <span className="text-clay-600"> *</span>}</p>
      <p className="mt-1 text-xs text-ink-mute">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {value.map((url) => (
          <div key={url} className="relative size-28 overflow-hidden rounded-md border border-forest-900/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
            <button type="button" aria-label={t.remove} onClick={() => onChange(value.filter((u) => u !== url))} className="absolute right-1 top-1 rounded-full bg-paper/90 p-1 hover:bg-paper">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {enabled && value.length < max && (
          <>
            <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} className="hidden" onChange={(e) => e.target.files && add(e.target.files)} />
            <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="flex size-28 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-forest-900/30 text-xs text-ink-soft hover:bg-forest-100 disabled:opacity-60">
              {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              {busy ? t.uploading : t.addPhoto}
            </button>
          </>
        )}
      </div>
      {(problem || error) && <p className="mt-2 text-xs text-clay-700">{problem ?? error}</p>}
    </div>
  );
}

function DocumentUpload({
  label,
  hint,
  value,
  onChange,
  enabled,
  t,
  error,
}: {
  label: string;
  hint?: string;
  value: PrivateFile | null;
  onChange: (f: PrivateFile | null) => void;
  enabled: boolean;
  t: (typeof applyText)["en"];
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function upload(file: File) {
    setProblem(null);
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) return setProblem("JPG, PNG, WebP or PDF only.");
    if (file.size > MAX_BYTES) return setProblem("Max 10 MB.");
    setBusy(true);
    try {
      const s = await getApplicantUploadSignature("documents");
      if (!s.ok) throw new Error(s.error);
      const up = await uploadToCloudinary(file, s.signature, false);
      onChange({ publicId: up.publicId, format: up.format });
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {value && (
          <span className="inline-flex items-center gap-2 rounded-md bg-forest-100 px-3 py-2 text-sm text-forest-900">
            <FileCheck2 className="size-4" /> {t.uploaded} ({value.format.toUpperCase()})
            <button type="button" aria-label={t.remove} onClick={() => onChange(null)} className="ml-1 rounded p-0.5 hover:bg-paper">
              <X className="size-3.5" />
            </button>
          </span>
        )}
        {enabled && (
          <>
            <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100 disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? t.uploading : value ? t.replace : t.upload}
            </button>
          </>
        )}
      </div>
      {(problem || error) && <p className="mt-2 text-xs text-clay-700">{problem ?? error}</p>}
    </div>
  );
}
