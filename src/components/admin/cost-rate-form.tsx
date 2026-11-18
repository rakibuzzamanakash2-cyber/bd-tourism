"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCostRateAction, saveCostSettingsAction } from "@/lib/actions/admin/costs";
import { UNIT_LABEL, bdt, usd } from "@/lib/costs";
import { PriceCheckBadge } from "@/components/admin/ui";
import type { CostUnit } from "@prisma/client";

const input = "w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm";
const btn = "rounded-full bg-forest-900 px-4 py-1.5 text-sm text-paper hover:bg-forest-800 disabled:opacity-50";

function useSave() {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: (fd: FormData) => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await fn(fd);
        if (!r.ok) return void toast.error(r.error);
        toast.success(r.message ?? "Saved");
        router.refresh();
      });
    };
  return { pending, run };
}

/** One cost line — what it's called, what it costs, and whether we use it. */
export function CostRateForm({
  rate,
}: {
  rate: {
    id: string;
    label: string;
    amountBdt: number;
    unit: CostUnit;
    note: string | null;
    isActive: boolean;
    verifiedAt: Date | null;
  };
}) {
  const { pending, run } = useSave();
  return (
    <form onSubmit={run(saveCostRateAction)} className="grid gap-3 border-t border-forest-900/10 py-4 sm:grid-cols-[1.2fr_0.8fr_1.4fr_auto] sm:items-start">
      <input type="hidden" name="id" value={rate.id} />
      <label className="block text-sm">
        <span className="text-xs text-ink-mute">Name</span>
        <input name="label" defaultValue={rate.label} className={`${input} mt-1`} />
      </label>
      <label className="block text-sm">
        <span className="text-xs text-ink-mute">Taka — {UNIT_LABEL[rate.unit]}</span>
        <input name="amountBdt" type="number" min={0} step={50} defaultValue={rate.amountBdt} className={`${input} mt-1 tabular-nums`} />
        <span className="mt-1 block text-xs text-ink-mute">
          {bdt(rate.amountBdt)} ≈ {usd(rate.amountBdt)}
        </span>
      </label>
      <label className="block text-sm">
        <span className="text-xs text-ink-mute">Note (optional)</span>
        <input name="note" defaultValue={rate.note ?? ""} className={`${input} mt-1`} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:pt-6">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" name="isActive" defaultChecked={rate.isActive} className="size-4" />
          In use
        </label>
        <label className="flex items-center gap-2 text-xs" title="Tick this once you have a real supplier price. Travellers only see estimates built from checked prices.">
          <input type="checkbox" name="verified" defaultChecked={rate.verifiedAt !== null} className="size-4" />
          Real price
        </label>
        <PriceCheckBadge verifiedAt={rate.verifiedAt} />
        <button type="submit" disabled={pending} className={btn}>Save</button>
      </div>
    </form>
  );
}

/** The two numbers that apply to every estimate. */
export function CostSettingsForm({ serviceFeePercent, estimateGroupSize }: { serviceFeePercent: number; estimateGroupSize: number }) {
  const { pending, run } = useSave();
  return (
    <form onSubmit={run(saveCostSettingsAction)} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block text-sm">
        Our service fee (%)
        <span className="block text-xs text-ink-mute">Added on top of what a trip costs us</span>
        <input name="serviceFeePercent" type="number" min={0} max={100} step={1} defaultValue={serviceFeePercent} className={`${input} mt-1 tabular-nums`} />
      </label>
      <label className="block text-sm">
        Group size used for estimates
        <span className="block text-xs text-ink-mute">A guide and a car are shared, so this changes the per-person figure</span>
        <input name="estimateGroupSize" type="number" min={1} max={20} step={1} defaultValue={estimateGroupSize} className={`${input} mt-1 tabular-nums`} />
      </label>
      <button type="submit" disabled={pending} className={btn}>Save</button>
    </form>
  );
}
