"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { saveDistrictAction } from "@/lib/actions/admin/districts";

type Props = {
  district: { id: string; slug: string; name: string; nameBn: string; photo: string; knownFor: string; highlights: string[]; places: number; things: number; permitRequired: boolean };
  uploadsEnabled: boolean;
};

export function DistrictForm({ district: d, uploadsEnabled }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <details className="group rounded-lg border border-forest-900/10 open:bg-paper-warm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="font-medium">{d.name}</span> <span className="font-bengali text-sm text-ink-mute">{d.nameBn}</span>
          {d.permitRequired && <span className="ml-2 text-xs text-clay-700">permit</span>}
        </span>
        <span className="flex items-center gap-3 text-xs text-ink-mute">
          <span>{d.things} to do</span>
          <span className={d.photo ? "text-forest-700" : "text-clay-700"}>{d.photo ? "photo ✓" : "no photo"}</span>
        </span>
      </summary>
      <form
        className="space-y-4 border-t border-forest-900/10 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const r = await saveDistrictAction(fd);
            if (!r.ok) return void toast.error(r.error);
            toast.success(r.message ?? "Saved");
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="id" value={d.id} />
        <ImageField name="photo" label="Photo" defaultValue={d.photo} folder="destinations" uploadsEnabled={uploadsEnabled} />
        <label className="block text-sm">
          Known for
          <input name="knownFor" defaultValue={d.knownFor} maxLength={200} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-sm">
          Top places <span className="text-ink-mute">(one per line)</span>
          <textarea name="highlights" rows={4} defaultValue={d.highlights.join("\n")} className={`${inputClass} mt-1`} />
        </label>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending} className="rounded-full bg-forest-900 px-5 py-2 text-sm text-paper hover:bg-forest-800 disabled:opacity-50">
            {pending ? "Saving…" : "Save"}
          </button>
          <a href={`/admin/districts/${d.slug}`} className="text-sm underline underline-offset-4">Edit the {d.things} places</a>
          <a href={`/districts/${d.slug}`} target="_blank" className="text-sm underline underline-offset-4">View page</a>
        </div>
      </form>
    </details>
  );
}
