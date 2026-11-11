"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { savePlaceAction } from "@/lib/actions/admin/districts";
import { PLACE_KINDS } from "@/lib/places-data/types";

type Place = { id?: string; name: string; kind: string; description: string; tip: string; photo: string; isPublished: boolean };

export function PlaceForm({ districtId, place, uploadsEnabled }: { districtId: string; place: Place; uploadsEnabled: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const isNew = !place.id;
  const form = (
    <form
      className="space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const el = e.currentTarget;
        const fd = new FormData(el);
        start(async () => {
          const r = await savePlaceAction(fd);
          if (!r.ok) return void toast.error(r.error);
          toast.success(r.message ?? "Saved");
          if (isNew) el.reset();
          router.refresh();
        });
      }}
    >
      {place.id && <input type="hidden" name="id" value={place.id} />}
      <input type="hidden" name="districtId" value={districtId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <label className="block text-sm">
          Name
          <input name="name" required defaultValue={place.name} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-sm">
          Type
          <select name="kind" defaultValue={place.kind || "SIGHT"} className={`${inputClass} mt-1`}>
            {PLACE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        Description
        <textarea name="description" rows={3} required defaultValue={place.description} maxLength={600} className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-sm">
        Tip <span className="text-ink-mute">(optional)</span>
        <input name="tip" defaultValue={place.tip} maxLength={300} className={`${inputClass} mt-1`} />
      </label>
      <ImageField name="photo" label="Photo" defaultValue={place.photo} folder="destinations" uploadsEnabled={uploadsEnabled} />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublished" defaultChecked={place.isPublished} /> Show on the site
        </label>
        <button type="submit" disabled={pending} className="rounded-full bg-forest-900 px-5 py-2 text-sm text-paper hover:bg-forest-800 disabled:opacity-50">
          {pending ? "Saving…" : isNew ? "Add place" : "Save"}
        </button>
      </div>
    </form>
  );
  if (isNew) return <div className="rounded-lg border border-dashed border-forest-900/25">{form}</div>;
  return (
    <details className="rounded-lg border border-forest-900/10 open:bg-paper-warm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="font-medium">{place.name}</span>{" "}
          <span className="text-xs text-ink-mute">{PLACE_KINDS.find((k) => k.value === place.kind)?.label}</span>
        </span>
        <span className="flex items-center gap-3 text-xs">
          {!place.isPublished && <span className="text-clay-700">hidden</span>}
          <span className={place.photo ? "text-forest-700" : "text-clay-700"}>{place.photo ? "photo ✓" : "no photo"}</span>
        </span>
      </summary>
      <div className="border-t border-forest-900/10">{form}</div>
    </details>
  );
}
