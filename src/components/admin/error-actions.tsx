"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resolveErrorAction } from "@/lib/actions/admin/errors";

export function ErrorActions({ id, resolved }: { id: string; resolved: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = () =>
    start(async () => {
      const r = await resolveErrorAction(id, !resolved);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message ?? "Done");
      router.refresh();
    });

  return (
    <button
      type="button"
      disabled={pending}
      onClick={run}
      className="rounded-full border border-forest-900/20 px-3 py-1 text-xs hover:bg-forest-100 disabled:opacity-50"
    >
      {resolved ? "Reopen" : "Mark sorted"}
    </button>
  );
}
