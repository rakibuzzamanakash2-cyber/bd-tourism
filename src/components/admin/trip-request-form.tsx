"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { updateTripRequestAction } from "@/lib/actions/admin/trip-requests";

export function TripRequestForm({ id, status, adminNote }: { id: string; status: string; adminNote: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="mt-4 flex flex-col gap-3 border-t border-forest-900/10 pt-4 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await updateTripRequestAction(fd);
          if (!r.ok) return void toast.error(r.error);
          toast.success(r.message ?? "Saved");
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <label className="text-sm">
        Status
        <select name="status" defaultValue={status} className={`${inputClass} mt-1 sm:w-40`}>
          <option value="NEW">New</option>
          <option value="REPLIED">Replied</option>
          <option value="BOOKED">Booked</option>
          <option value="CLOSED">Closed</option>
        </select>
      </label>
      <label className="flex-1 text-sm">
        Team note <span className="text-ink-mute">(only admins see this)</span>
        <input name="adminNote" defaultValue={adminNote} className={`${inputClass} mt-1`} />
      </label>
      <button type="submit" disabled={pending} className="rounded-full bg-forest-900 px-5 py-2 text-sm text-paper hover:bg-forest-800 disabled:opacity-50">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
