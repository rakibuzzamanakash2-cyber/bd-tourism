"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PermitStatus } from "@prisma/client";
import { inputClass } from "@/components/admin/form";
import { adminUpdatePermit } from "@/lib/actions/admin/permits";
import { PERMIT_STATUS } from "@/lib/permit-labels";

type Permit = {
  id: string;
  regionName: string;
  feeBDT: number | null;
  status: PermitStatus;
  referenceNumber: string;
  noteToTraveler: string;
  submittedAt: string | null;
  decidedAt: string | null;
};

export function PermitEditor({ permit, travelerCount }: { permit: Permit; travelerCount: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<PermitStatus>(permit.status);
  const [ref, setRef] = useState(permit.referenceNumber);
  const [note, setNote] = useState(permit.noteToTraveler);
  const [notify, setNotify] = useState(true);
  const dirty = status !== permit.status || ref !== permit.referenceNumber || note !== permit.noteToTraveler;

  return (
    <div className="space-y-3 rounded-md border border-forest-900/10 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{permit.regionName}</p>
        {permit.feeBDT !== null && (
          <p className="text-xs text-ink-mute">
            Gov. fee ~BDT {(permit.feeBDT * travelerCount).toLocaleString()} ({travelerCount} × {permit.feeBDT.toLocaleString()})
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-ink-mute">
          Status
          <select className={`${inputClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as PermitStatus)}>
            {(Object.keys(PERMIT_STATUS) as PermitStatus[]).map((s) => (
              <option key={s} value={s}>
                {PERMIT_STATUS[s].label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-mute">
          Reference number
          <input className={`${inputClass} mt-1`} value={ref} onChange={(e) => setRef(e.target.value)} maxLength={120} placeholder="From the DC office / Forest Dept" />
        </label>
      </div>
      <label className="block text-xs text-ink-mute">
        Note to traveler {status === "DOCUMENTS_NEEDED" && <span className="text-clay-700">(required: say what you need)</span>}
        <textarea className={`${inputClass} mt-1`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
      </label>
      {status === "REJECTED" && (
        <p className="text-xs text-clay-700">
          Policy: refund the permit processing fee and offer to rework the trip. Record the refund from the booking&rsquo;s Cancel or contact the traveler.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Email the traveler about a status change
        </label>
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const r = await adminUpdatePermit({ permitId: permit.id, status, referenceNumber: ref, noteToTraveler: note, notifyTraveler: notify });
              if (!r.ok) return void toast.error(r.error);
              toast.success(r.message ?? "Saved");
              router.refresh();
            })
          }
          className="rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save permit"}
        </button>
      </div>
      {(permit.submittedAt || permit.decidedAt) && (
        <p className="text-xs text-ink-mute">
          {permit.submittedAt && `Submitted ${permit.submittedAt}`}
          {permit.submittedAt && permit.decidedAt && " · "}
          {permit.decidedAt && `Decided ${permit.decidedAt}`}
        </p>
      )}
    </div>
  );
}
