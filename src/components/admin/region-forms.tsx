"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { saveCategoryAction, saveRegionAction } from "@/lib/actions/admin/regions";

type Region = { id?: string; name: string; description: string; isRestricted: boolean; permitFeeBDT: string; destinations?: number };

function useSubmit(action: (fd: FormData) => Promise<{ ok: boolean; error?: string; message?: string }>, after?: (form: HTMLFormElement) => void) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      const r = await action(fd);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message ?? "Saved");
      after?.(form);
      router.refresh();
    });
  };
  return { pending, onSubmit };
}

export function RegionForm({ region }: { region: Region }) {
  const isNew = !region.id;
  const [restricted, setRestricted] = useState(region.isRestricted);
  const { pending, onSubmit } = useSubmit(saveRegionAction, (f) => {
    if (isNew) {
      f.reset();
      setRestricted(false);
    }
  });
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-forest-900/10 p-4">
      {region.id && <input type="hidden" name="id" value={region.id} />}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input name="name" required defaultValue={region.name} placeholder="Region name" aria-label="Region name" className={`${inputClass} sm:flex-1`} />
        {region.destinations !== undefined && (
          <span className="self-center text-xs text-ink-mute">{region.destinations} destination(s)</span>
        )}
      </div>
      <textarea name="description" rows={2} defaultValue={region.description} placeholder="Short description" aria-label="Description" className={inputClass} />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isRestricted" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />
          Foreigners need a permit
        </label>
        {restricted && (
          <label className="flex items-center gap-2 text-sm">
            Government fee per person (BDT)
            <input name="permitFeeBDT" type="number" min={0} step={1} required defaultValue={region.permitFeeBDT} className={`${inputClass} w-28`} />
          </label>
        )}
        <button type="submit" disabled={pending} className="ml-auto rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800 disabled:opacity-60">
          {pending ? "Saving…" : isNew ? "Add region" : "Save"}
        </button>
      </div>
    </form>
  );
}

export function CategoryForm({ id, name, count }: { id?: string; name?: string; count?: number }) {
  const { pending, onSubmit } = useSubmit(saveCategoryAction, (f) => !id && f.reset());
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      {id && <input type="hidden" name="id" value={id} />}
      <input name="name" required defaultValue={name} placeholder="New type, e.g. Tea gardens" aria-label="Type name" className={inputClass} />
      {count !== undefined && <span className="shrink-0 text-xs text-ink-mute">{count}</span>}
      <button type="submit" disabled={pending} className="shrink-0 rounded-full border border-forest-900/20 px-3 py-2 text-sm hover:bg-forest-100 disabled:opacity-60">
        {id ? "Rename" : "Add"}
      </button>
    </form>
  );
}
