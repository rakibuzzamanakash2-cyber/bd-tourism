"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { adminAssignGuide, adminCancelAssignment, adminCreateGuideProfile, adminMarkGuidePaid } from "@/lib/actions/admin/guides";
import { bdt } from "@/lib/guide-shared";
import { cn } from "@/lib/utils";

const btn = "rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50";

export type GuideCandidate = {
  id: string;
  name: string;
  dayRateBDT: number;
  coversRegion: boolean;
  requested: boolean;
  /** Why they might not be free, or null */
  conflict: string | null;
  languages: string[];
};

export function AssignGuidePanel({ bookingId, days, candidates }: { bookingId: string; days: number; candidates: GuideCandidate[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const best = candidates.find((c) => !c.conflict) ?? candidates[0];
  const [guideId, setGuideId] = useState(best?.id ?? "");
  const chosen = candidates.find((c) => c.id === guideId);
  const [fee, setFee] = useState(String((best?.dayRateBDT ?? 0) * days));
  const [note, setNote] = useState("");
  const [override, setOverride] = useState(false);

  if (candidates.length === 0) {
    return <p className="text-sm text-ink-mute">No active guides yet. Approve a guide application first.</p>;
  }

  const pick = (id: string) => {
    setGuideId(id);
    const c = candidates.find((x) => x.id === id);
    if (c) setFee(String(c.dayRateBDT * days));
    setOverride(false);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await adminAssignGuide({ bookingId, guideId, feeBDT: fee, note, override });
          if (!r.ok) return void toast.error(r.error);
          toast.success(r.message ?? "Sent");
          router.refresh();
        });
      }}
    >
      <fieldset>
        <legend className="text-xs text-ink-mute">Choose a guide</legend>
        <ul className="mt-2 max-h-80 space-y-1.5 overflow-y-auto">
          {candidates.map((c) => (
            <li key={c.id}>
              <label className={cn("flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 text-sm", guideId === c.id ? "border-forest-900 bg-forest-100" : "border-forest-900/10 hover:bg-paper-warm")}>
                <input type="radio" name="guide" className="mt-1" checked={guideId === c.id} onChange={() => pick(c.id)} />
                <span className="min-w-0">
                  <span className="font-medium">{c.name}</span>
                  {c.requested && <span className="ml-1.5 rounded-full bg-forest-900 px-2 py-0.5 text-[10px] uppercase tracking-wider text-paper">Requested</span>}
                  <span className="block text-xs text-ink-mute">
                    {bdt(c.dayRateBDT)}/day · {c.languages.join(", ")}
                    {!c.coversRegion && " · doesn't usually guide this area"}
                  </span>
                  <span className={cn("block text-xs", c.conflict ? "text-clay-700" : "text-forest-700")}>{c.conflict ?? "Free on these dates"}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <label className="block text-xs text-ink-mute">
        Guide&rsquo;s fee for the trip (BDT, {days} {days === 1 ? "day" : "days"})
        <input type="number" min={0} className={`${inputClass} mt-1`} value={fee} onChange={(e) => setFee(e.target.value)} />
      </label>
      <label className="block text-xs text-ink-mute">
        Note to the guide (optional)
        <textarea rows={2} maxLength={2000} className={`${inputClass} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Meeting point, pickup time…" />
      </label>
      {chosen?.conflict && (
        <label className="flex items-start gap-2 text-xs text-clay-700">
          <input type="checkbox" className="mt-0.5" checked={override} onChange={(e) => setOverride(e.target.checked)} />
          Assign anyway (I&rsquo;ve checked with them)
        </label>
      )}
      <button type="submit" disabled={pending || !guideId || Boolean(chosen?.conflict && !override)} className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")}>
        {pending ? "Sending…" : "Ask this guide"}
      </button>
    </form>
  );
}

export function CancelAssignmentButton({ assignmentId, label = "Take off this trip" }: { assignmentId: string; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-xs text-clay-700 underline underline-offset-4"
      onClick={() => {
        const reason = window.prompt("Reason (the guide will be emailed):", "Plans changed");
        if (reason === null) return;
        start(async () => {
          const r = await adminCancelAssignment({ assignmentId, reason });
          if (!r.ok) return void toast.error(r.error);
          toast.success(r.message ?? "Done");
          router.refresh();
        });
      }}
    >
      {label}
    </button>
  );
}

export function MarkGuidePaidForm({ assignmentId, feeBDT }: { assignmentId: string; feeBDT: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  if (!open) {
    return (
      <button type="button" className={cn(btn, "border border-forest-900/20 hover:bg-forest-100")} onClick={() => setOpen(true)}>
        Mark {bdt(feeBDT)} paid…
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <input className={inputClass} placeholder="bKash / bank reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={200} aria-label="Payout reference" />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")}
          onClick={() =>
            start(async () => {
              const r = await adminMarkGuidePaid({ assignmentId, reference });
              if (!r.ok) return void toast.error(r.error);
              toast.success(r.message ?? "Paid");
              setOpen(false);
              router.refresh();
            })
          }
        >
          Confirm payment sent
        </button>
        <button type="button" className={cn(btn, "border border-forest-900/20")} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function CreateGuideProfileButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={cn(btn, "border border-forest-900/20 hover:bg-forest-100")}
      onClick={() =>
        start(async () => {
          const r = await adminCreateGuideProfile(userId);
          if (!r.ok) return void toast.error(r.error);
          toast.success(r.message ?? "Created");
          router.refresh();
        })
      }
    >
      Create profile
    </button>
  );
}
