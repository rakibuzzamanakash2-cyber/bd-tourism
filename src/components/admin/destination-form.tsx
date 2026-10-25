"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox, Field, FormSection, inputClass } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { saveDestinationAction } from "@/lib/actions/admin/destinations";
import { slugify } from "@/lib/slug";

type Option = { id: string; name: string; isRestricted?: boolean };

export type DestinationFormValues = {
  id?: string;
  name: string;
  slug: string;
  shortDesc: string;
  longDesc: string;
  regionId: string;
  categoryIds: string[];
  bestSeason: string;
  averageBudget: string;
  latitude: string;
  longitude: string;
  featuredImage: string;
  isFeatured: boolean;
  isPublished: boolean;
};

export function DestinationForm({
  initial,
  regions,
  categories,
  uploadsEnabled,
}: {
  initial: DestinationFormValues;
  regions: Option[];
  categories: Option[];
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const isNew = !initial.id;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await saveDestinationAction(fd);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.error);
        return;
      }
      setErrors({});
      toast.success(r.message);
      if (isNew) router.push(`/admin/destinations/${r.id}`);
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
          <Field id="name" label="Name" required error={err("name")}>
            <input
              id="name"
              name="name"
              className={inputClass}
              value={name}
              aria-invalid={invalid("name")}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field
            id="slug"
            label="Web address"
            hint={`deltaway…/destinations/${slug || "…"}${initial.id ? " — changing it breaks old links" : ""}`}
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
          <Field id="shortDesc" label="Short description" hint="One or two sentences, shown on cards" required error={err("shortDesc")}>
            <textarea id="shortDesc" name="shortDesc" rows={2} maxLength={300} defaultValue={initial.shortDesc} className={inputClass} aria-invalid={invalid("shortDesc")} />
          </Field>
          <Field id="longDesc" label="Full description" required error={err("longDesc")}>
            <textarea id="longDesc" name="longDesc" rows={8} defaultValue={initial.longDesc} className={inputClass} aria-invalid={invalid("longDesc")} />
          </Field>
        </FormSection>

        <FormSection title="Practical details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="bestSeason" label="Best time to visit" hint='e.g. "October to March"' error={err("bestSeason")}>
              <input id="bestSeason" name="bestSeason" defaultValue={initial.bestSeason} className={inputClass} />
            </Field>
            <Field id="averageBudget" label="Budget level">
              <select id="averageBudget" name="averageBudget" defaultValue={initial.averageBudget} className={inputClass}>
                <option value="">Not set</option>
                <option value="$">$ — budget</option>
                <option value="$$">$$ — mid-range</option>
                <option value="$$$">$$$ — premium</option>
              </select>
            </Field>
            <Field id="latitude" label="Latitude" hint="For the map link, e.g. 21.4272" error={err("latitude")}>
              <input id="latitude" name="latitude" inputMode="decimal" defaultValue={initial.latitude} className={inputClass} aria-invalid={invalid("latitude")} />
            </Field>
            <Field id="longitude" label="Longitude" hint="e.g. 91.9702" error={err("longitude")}>
              <input id="longitude" name="longitude" inputMode="decimal" defaultValue={initial.longitude} className={inputClass} aria-invalid={invalid("longitude")} />
            </Field>
          </div>
        </FormSection>
      </div>

      <div className="space-y-6">
        <FormSection title="Visibility">
          <Checkbox name="isPublished" label="Published" hint="Visible on the website" defaultChecked={initial.isPublished} />
          <Checkbox name="isFeatured" label="Featured" hint="Shown on the home page" defaultChecked={initial.isFeatured} />
        </FormSection>

        <FormSection title="Photo">
          <ImageField name="featuredImage" label="Main photo" defaultValue={initial.featuredImage} folder="destinations" uploadsEnabled={uploadsEnabled} required />
          {err("featuredImage") && <p className="text-xs text-clay-700">{err("featuredImage")}</p>}
        </FormSection>

        <FormSection title="Where">
          <Field id="regionId" label="Region" required error={err("regionId")}>
            <select id="regionId" name="regionId" defaultValue={initial.regionId} className={inputClass} aria-invalid={invalid("regionId")}>
              <option value="">Choose…</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.isRestricted ? " (permit needed)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <fieldset>
            <legend className="text-sm font-medium">Types</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <Checkbox key={c.id} name="categoryIds" value={c.id} label={c.name} defaultChecked={initial.categoryIds.includes(c.id)} />
              ))}
            </div>
          </fieldset>
        </FormSection>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-forest-900 px-6 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : isNew ? "Create destination" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
