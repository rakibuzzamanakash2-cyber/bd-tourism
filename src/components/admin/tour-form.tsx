"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox, Field, FormSection, inputClass } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { saveTourAction } from "@/lib/actions/admin/tours";
import { slugify } from "@/lib/slug";

type Day = { key: number; title: string; description: string; destinationId: string | null };
type DestinationOption = { id: string; name: string; regionName: string; isRestricted: boolean };

export type TourFormValues = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  basePriceUSD: string;
  maxTravelers: string;
  featuredImage: string;
  includesGuide: boolean;
  includesLodging: boolean;
  includesTransport: boolean;
  isPublished: boolean;
  itinerary: Omit<Day, "key">[];
};

let nextKey = 1;
const withKey = (d: Omit<Day, "key">): Day => ({ ...d, key: nextKey++ });

export function TourForm({
  initial,
  destinations,
  uploadsEnabled,
}: {
  initial: TourFormValues;
  destinations: DestinationOption[];
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [days, setDays] = useState<Day[]>(() =>
    (initial.itinerary.length ? initial.itinerary : [{ title: "", description: "", destinationId: null }]).map(withKey),
  );
  const isNew = !initial.id;

  const setDay = (i: number, patch: Partial<Day>) => setDays((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const move = (i: number, dir: -1 | 1) =>
    setDays((ds) => {
      const j = i + dir;
      if (j < 0 || j >= ds.length) return ds;
      const copy = [...ds];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const restrictedRegions = [
    ...new Set(
      days
        .map((d) => destinations.find((x) => x.id === d.destinationId))
        .filter((x): x is DestinationOption => Boolean(x?.isRestricted))
        .map((x) => x.regionName),
    ),
  ];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("itinerary", JSON.stringify(days.map(({ title, description, destinationId }) => ({ title, description, destinationId }))));
    start(async () => {
      const r = await saveTourAction(fd);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.error);
        return;
      }
      setErrors({});
      toast.success(r.message);
      if (isNew) router.push(`/admin/tours/${r.id}`);
      else router.refresh();
    });
  }
  const err = (k: string) => errors[k];
  const invalid = (k: string) => (errors[k] ? true : undefined);

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-3" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="space-y-6 xl:col-span-2">
        <FormSection title="Basics">
          <Field id="title" label="Title" required error={err("title")}>
            <input
              id="title"
              name="title"
              className={inputClass}
              value={title}
              aria-invalid={invalid("title")}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field
            id="slug"
            label="Web address"
            hint={`deltaway…/packages/${slug || "…"}${initial.id ? " — changing it breaks old links" : ""}`}
            error={err("slug")}
          >
            <input
              id="slug"
              name="slug"
              className={inputClass}
              value={slug}
              aria-invalid={invalid("slug")}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
            />
          </Field>
          <Field id="summary" label="Summary" hint="One line, shown on cards" required error={err("summary")}>
            <input id="summary" name="summary" maxLength={300} defaultValue={initial.summary} className={inputClass} aria-invalid={invalid("summary")} />
          </Field>
          <Field id="description" label="Overview" required error={err("description")}>
            <textarea id="description" name="description" rows={6} defaultValue={initial.description} className={inputClass} aria-invalid={invalid("description")} />
          </Field>
        </FormSection>

        <FormSection title={`Day by day · ${days.length} ${days.length === 1 ? "day" : "days"}`}>
          {err("itinerary") && <p className="text-xs text-clay-700">{err("itinerary")}</p>}
          {restrictedRegions.length > 0 && (
            <p className="rounded-md border border-clay-600/30 bg-clay-500/10 px-3 py-2 text-xs text-clay-700">
              Visits {restrictedRegions.join(" and ")}: travelers will be asked for passport details and charged the permit fee.
            </p>
          )}
          <ol className="space-y-4">
            {days.map((d, i) => (
              <li key={d.key} className="rounded-md border border-forest-900/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Day {i + 1}</p>
                  <div className="flex gap-1">
                    <IconButton label="Move day up" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton label="Move day down" disabled={i === days.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <IconButton
                      label="Remove day"
                      disabled={days.length === 1}
                      onClick={() => window.confirm(`Remove day ${i + 1}?`) && setDays((ds) => ds.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-4 text-clay-700" />
                    </IconButton>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={`day${i + 1}-title`} label="Title" error={err(`day${i + 1}.title`)}>
                    <input
                      id={`day${i + 1}-title`}
                      className={inputClass}
                      value={d.title}
                      aria-invalid={invalid(`day${i + 1}.title`)}
                      onChange={(e) => setDay(i, { title: e.target.value })}
                      placeholder="e.g. Into the mangroves"
                    />
                  </Field>
                  <Field id={`day${i + 1}-dest`} label="Destination" hint="Optional">
                    <select
                      id={`day${i + 1}-dest`}
                      className={inputClass}
                      value={d.destinationId ?? ""}
                      onChange={(e) => setDay(i, { destinationId: e.target.value || null })}
                    >
                      <option value="">None</option>
                      {destinations.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name} — {x.regionName}
                          {x.isRestricted ? " (permit)" : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field id={`day${i + 1}-desc`} label="What happens" error={err(`day${i + 1}.description`)} className="mt-3">
                  <textarea
                    id={`day${i + 1}-desc`}
                    rows={3}
                    className={inputClass}
                    value={d.description}
                    aria-invalid={invalid(`day${i + 1}.description`)}
                    onChange={(e) => setDay(i, { description: e.target.value })}
                  />
                </Field>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setDays((ds) => [...ds, withKey({ title: "", description: "", destinationId: null })])}
            className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100"
          >
            <Plus className="size-4" /> Add day {days.length + 1}
          </button>
        </FormSection>
      </div>

      <div className="space-y-6">
        <FormSection title="Visibility">
          <Checkbox name="isPublished" label="Published" hint="Bookable on the website" defaultChecked={initial.isPublished} />
        </FormSection>
        <FormSection title="Price & group">
          <Field id="basePriceUSD" label="Price per person (USD)" required error={err("basePriceUSD")}>
            <input id="basePriceUSD" name="basePriceUSD" type="number" min={1} step="0.01" defaultValue={initial.basePriceUSD} className={inputClass} aria-invalid={invalid("basePriceUSD")} />
          </Field>
          <Field id="maxTravelers" label="Maximum group size" required error={err("maxTravelers")}>
            <input id="maxTravelers" name="maxTravelers" type="number" min={1} max={50} defaultValue={initial.maxTravelers} className={inputClass} aria-invalid={invalid("maxTravelers")} />
          </Field>
        </FormSection>
        <FormSection title="Included">
          <Checkbox name="includesGuide" label="Local guide" defaultChecked={initial.includesGuide} />
          <Checkbox name="includesLodging" label="Accommodation" defaultChecked={initial.includesLodging} />
          <Checkbox name="includesTransport" label="Transport between stops" defaultChecked={initial.includesTransport} />
        </FormSection>
        <FormSection title="Photo">
          <ImageField name="featuredImage" label="Main photo" defaultValue={initial.featuredImage} folder="tours" uploadsEnabled={uploadsEnabled} required />
          {err("featuredImage") && <p className="text-xs text-clay-700">{err("featuredImage")}</p>}
        </FormSection>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-forest-900 px-6 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : isNew ? "Create tour" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="rounded p-1 hover:bg-forest-100 disabled:opacity-30">
      {children}
    </button>
  );
}
