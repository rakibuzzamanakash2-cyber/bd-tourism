"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminDeleteTravelerPhotoAction, reviewTravelerPhotoAction, assignTravelerPhotoAction } from "@/lib/actions/admin/traveler-photos";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  caption: string;
  /** The listed place this photo shows, if any */
  placeName: string | null;
  districtName: string;
  usedAs: { place: boolean; gallery: boolean; district: boolean };
};

const btn = "rounded-full px-4 py-1.5 text-sm transition-colors disabled:opacity-50";
const primary = cn(btn, "bg-forest-900 text-paper hover:bg-forest-800");
const secondary = cn(btn, "border border-forest-900/20 hover:bg-forest-100");
const input = "w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm";

/** Approve, turn down, use as a main photo, or delete one traveler photo. */
export function TravelerPhotoActions({ id, status, caption, placeName, districtName, usedAs }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [text, setText] = useState(caption);
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (fn: () => Promise<AdminActionResult>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message ?? "Done");
      router.refresh();
    });

  return (
    <div className="mt-4 space-y-3 border-t border-forest-900/10 pt-4">
      {status !== "REJECTED" && (
        <label className="block text-xs text-ink-mute">
          Description shown on the site (you can fix typos)
          <textarea name="caption" rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} className={cn(input, "mt-1")} />
        </label>
      )}
      {status === "PENDING" && (
        <label className="block text-xs text-ink-mute">
          If you turn it down, a short reason for the traveler (optional)
          <input name="note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={cn(input, "mt-1")} />
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {status !== "APPROVED" && (
          <button type="button" disabled={pending} className={primary} onClick={() => run(() => reviewTravelerPhotoAction({ id, decision: "APPROVED", caption: text.trim() || undefined }))}>
            Approve
          </button>
        )}
        {status === "APPROVED" && text.trim() !== caption && (
          <button type="button" disabled={pending} className={primary} onClick={() => run(() => reviewTravelerPhotoAction({ id, decision: "APPROVED", caption: text.trim() || undefined }))}>
            Save description
          </button>
        )}
        {status !== "REJECTED" && (
          <button type="button" disabled={pending} className={secondary} onClick={() => run(() => reviewTravelerPhotoAction({ id, decision: "REJECTED", note: note || undefined }))}>
            {status === "APPROVED" ? "Take off the site" : "Don't use"}
          </button>
        )}
      </div>

      {status === "APPROVED" && (
        <div className="rounded-md bg-forest-100/60 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-forest-800">Use this photo</p>
          <div className="flex flex-wrap gap-2">
            {placeName && (
              <>
                <button type="button" disabled={pending || usedAs.place} className={secondary} onClick={() => run(() => assignTravelerPhotoAction({ id, as: "place" }))}>
                  {usedAs.place ? `Main photo of ${placeName} ✓` : `Main photo of ${placeName}`}
                </button>
                <button type="button" disabled={pending || usedAs.gallery} className={secondary} onClick={() => run(() => assignTravelerPhotoAction({ id, as: "gallery" }))}>
                  {usedAs.gallery ? "In the gallery ✓" : "Add to its gallery"}
                </button>
              </>
            )}
            <button type="button" disabled={pending || usedAs.district} className={secondary} onClick={() => run(() => assignTravelerPhotoAction({ id, as: "district" }))}>
              {usedAs.district ? `Main photo of ${districtName} ✓` : `Main photo of ${districtName} district`}
            </button>
          </div>
        </div>
      )}

      {confirmDelete ? (
        <p className="flex flex-wrap items-center gap-3 text-sm">
          Delete the photo and its file for good?
          <button type="button" disabled={pending} className="font-medium text-clay-700 underline underline-offset-4" onClick={() => run(() => adminDeleteTravelerPhotoAction(id))}>
            Yes, delete
          </button>
          <button type="button" className="underline underline-offset-4" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </p>
      ) : (
        <button type="button" className="text-xs text-ink-mute underline underline-offset-4 hover:text-clay-700" onClick={() => setConfirmDelete(true)}>
          Delete permanently
        </button>
      )}
    </div>
  );
}
