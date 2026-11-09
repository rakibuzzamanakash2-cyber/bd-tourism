"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Download, Trash2 } from "lucide-react";
import { deleteMyAccountAction } from "@/lib/actions/account";

export function YourData({ email, canDelete }: { email: string; canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="mt-16 max-w-2xl border-t border-forest-900/10 pt-10" aria-labelledby="your-data">
      <h2 id="your-data" className="font-display text-3xl">Your data</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Passport numbers are stored encrypted, only the DeltaWay team can see them (for permits), and they&rsquo;re deleted 90 days after
        each trip. You can download everything we hold about you, or delete your account.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/dashboard/profile/export" className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 px-5 py-2.5 text-sm hover:bg-forest-100">
          <Download className="size-4" aria-hidden /> Download my data
        </a>
        {canDelete && !open && (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-clay-600/40 px-5 py-2.5 text-sm text-clay-700 hover:bg-clay-500/10">
            <Trash2 className="size-4" aria-hidden /> Delete my account…
          </button>
        )}
      </div>
      {!canDelete && <p className="mt-3 text-xs text-ink-mute">Guide, host and team accounts are closed by the DeltaWay team. Message us if you&rsquo;d like yours closed.</p>}
      {open && (
        <form
          className="mt-6 space-y-3 rounded-lg border border-clay-600/30 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await deleteMyAccountAction({ confirmEmail: confirm });
              if (!r.ok) return setError(r.error);
              await signOut({ redirectTo: "/?account=deleted" });
            });
          }}
        >
          <p className="text-sm">
            This permanently removes your name, email, phone, passport details, saved trips and messages. Past bookings stay in our records
            without your details, as the law requires for payments. Reviews stay, shown as &ldquo;A traveler&rdquo;. It can&rsquo;t be undone.
          </p>
          <label className="block text-xs text-ink-mute">
            Type your email ({email}) to confirm
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="email" autoComplete="off" className="mt-1 w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm text-ink" />
          </label>
          {error && <p role="alert" className="text-sm text-clay-700">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending || !confirm} className="rounded-full bg-clay-700 px-5 py-2.5 text-sm text-paper hover:bg-clay-600 disabled:opacity-50">
              {pending ? "Deleting…" : "Delete my account"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-forest-900/20 px-5 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
