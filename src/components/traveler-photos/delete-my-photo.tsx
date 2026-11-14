"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteMyTravelerPhotoAction } from "@/lib/actions/traveler-photos";

/** "Remove", then "Yes, remove" to confirm. */
export function DeleteMyPhoto({ id }: { id: string }) {
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="text-xs text-ink-mute underline underline-offset-4 hover:text-clay-700">
        Remove
      </button>
    );
  }
  return (
    <span className="flex items-center gap-3 text-xs">
      <button
        type="button"
        disabled={pending}
        className="font-medium text-clay-700 underline underline-offset-4"
        onClick={() =>
          start(async () => {
            const r = await deleteMyTravelerPhotoAction(id);
            if (!r.ok) return void toast.error(r.error);
            toast.success("Photo removed");
            router.refresh();
          })
        }
      >
        {pending ? "Removing…" : "Yes, remove it"}
      </button>
      <button type="button" onClick={() => setAsking(false)} className="text-ink-mute underline underline-offset-4">Keep</button>
    </span>
  );
}
