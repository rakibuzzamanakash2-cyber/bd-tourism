"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import {
  adminCreateInvite,
  adminRevokeInvite,
  adminSaveApplicationNotes,
  adminSetApplicationStatus,
  adminSetChecklistItem,
} from "@/lib/actions/admin/applications";
import { CHECKLIST_LABEL } from "@/lib/applications";
import { cn } from "@/lib/utils";

const btn = "rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50";

const ACTION: Record<string, { label: string; style: string; needsMessage?: boolean }> = {
  UNDER_REVIEW: { label: "Start review", style: "bg-forest-900 text-paper hover:bg-forest-800" },
  INTERVIEW: { label: "Move to interview", style: "bg-forest-900 text-paper hover:bg-forest-800" },
  HOME_VISIT: { label: "Move to home visit", style: "bg-forest-900 text-paper hover:bg-forest-800" },
  APPROVED: { label: "Approve", style: "bg-forest-700 text-paper hover:bg-forest-800" },
  CHANGES_REQUESTED: { label: "Ask for changes…", style: "border border-forest-900/20 hover:bg-forest-100", needsMessage: true },
  REJECTED: { label: "Don't approve…", style: "border border-clay-600/40 text-clay-700 hover:bg-clay-500/10", needsMessage: true },
};

export function ApplicationStatusActions({
  id,
  allowed,
  checklistComplete,
}: {
  id: string;
  allowed: string[];
  checklistComplete: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [messageFor, setMessageFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [notify, setNotify] = useState(true);

  const run = (to: string) =>
    start(async () => {
      const r = await adminSetApplicationStatus({ id, to: to as never, message, notify });
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message ?? "Updated");
      setMessageFor(null);
      setMessage("");
      router.refresh();
    });

  if (allowed.length === 0) return <p className="text-sm text-ink-mute">No further steps.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {allowed.map((to) => {
          const a = ACTION[to];
          const blocked = to === "APPROVED" && !checklistComplete;
          return (
            <button
              key={to}
              type="button"
              disabled={pending || blocked}
              title={blocked ? "Finish the checklist first" : undefined}
              className={cn(btn, a.style)}
              onClick={() => {
                if (a.needsMessage) return setMessageFor(to);
                if (to === "APPROVED" && !window.confirm("Approve this application? The account becomes a guide/host.")) return;
                run(to);
              }}
            >
              {a.label}
            </button>
          );
        })}
      </div>
      {allowed.includes("APPROVED") && !checklistComplete && (
        <p className="text-xs text-ink-mute">Approve unlocks once every checklist item is ticked.</p>
      )}
      {messageFor && (
        <div className="space-y-3 rounded-md border border-forest-900/10 p-4">
          <label className="block text-sm font-medium">
            {messageFor === "REJECTED" ? "Why can't we approve? (sent to the applicant)" : "What should they change? (sent to the applicant)"}
            <textarea className={`${inputClass} mt-1.5`} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={3000} />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={pending} className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")} onClick={() => run(messageFor)}>
              Send
            </button>
            <button type="button" className={cn(btn, "border border-forest-900/20")} onClick={() => setMessageFor(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <label className="flex items-center gap-2 text-xs text-ink-soft">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        Email the applicant about the change
      </label>
    </div>
  );
}

export function ApplicationChecklist({ id, items, values }: { id: string; items: readonly string[]; values: Record<string, boolean> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <ul className="space-y-2">
      {items.map((key) => (
        <li key={key}>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4"
              disabled={pending}
              defaultChecked={Boolean(values[key])}
              onChange={(e) =>
                start(async () => {
                  const r = await adminSetChecklistItem({ id, key, value: e.target.checked });
                  if (!r.ok) toast.error(r.error);
                  router.refresh();
                })
              }
            />
            {CHECKLIST_LABEL[key]}
          </label>
        </li>
      ))}
    </ul>
  );
}

export function ApplicationNotes({ id, initial }: { id: string; initial: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(initial);
  return (
    <div className="space-y-2">
      <textarea className={inputClass} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} aria-label="Team notes" placeholder="Interview notes, reference calls… only the team sees these." />
      <button
        type="button"
        disabled={pending || notes === initial}
        className={cn(btn, "border border-forest-900/20 hover:bg-forest-100")}
        onClick={() =>
          start(async () => {
            const r = await adminSaveApplicationNotes({ id, notes });
            if (!r.ok) return void toast.error(r.error);
            toast.success("Notes saved");
            router.refresh();
          })
        }
      >
        Save notes
      </button>
    </div>
  );
}

// ============================================================
// Invites
// ============================================================
export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(btn, "inline-flex items-center gap-1.5 border border-forest-900/20 hover:bg-forest-100")}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function WhatsAppLinkButton({ href, label = "Send on WhatsApp" }: { href: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(btn, "inline-flex items-center gap-1.5 bg-forest-900 text-paper hover:bg-forest-800")}>
      <MessageCircle className="size-4" /> {label}
    </a>
  );
}

export function InviteForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [created, setCreated] = useState<{ link: string; whatsapp: string | null } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      const r = await adminCreateInvite({
        kind: fd.get("kind") as "GUIDE" | "HOST",
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        email: String(fd.get("email") ?? ""),
        note: String(fd.get("note") ?? ""),
      });
      if (!r.ok) return void toast.error(r.error);
      setCreated({ link: r.link, whatsapp: r.whatsapp });
      form.reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border border-forest-900/10 p-5 sm:grid-cols-2">
        <label className="text-xs text-ink-mute">
          Invite as
          <select name="kind" className={`${inputClass} mt-1`} defaultValue="GUIDE">
            <option value="GUIDE">Guide</option>
            <option value="HOST">Homestay host</option>
          </select>
        </label>
        <label className="text-xs text-ink-mute">
          Name
          <input name="name" className={`${inputClass} mt-1`} placeholder="Pre-fills their form" />
        </label>
        <label className="text-xs text-ink-mute">
          WhatsApp / mobile
          <input name="phone" className={`${inputClass} mt-1`} placeholder="01XXX-XXXXXX" inputMode="tel" />
        </label>
        <label className="text-xs text-ink-mute">
          Email (optional)
          <input name="email" type="email" className={`${inputClass} mt-1`} />
        </label>
        <label className="text-xs text-ink-mute sm:col-span-2">
          Note for the team (optional)
          <input name="note" className={`${inputClass} mt-1`} placeholder="e.g. met at Bandarban, recommended by Karim" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")}>
            {pending ? "Creating…" : "Create invite link"}
          </button>
        </div>
      </form>
      {created && (
        <div role="status" className="space-y-3 rounded-lg border border-forest-700/20 bg-forest-100 p-5">
          <p className="text-sm font-medium text-forest-900">Invite ready (valid for 14 days)</p>
          <p className="break-all font-mono text-xs">{created.link}</p>
          <div className="flex flex-wrap gap-2">
            {created.whatsapp && <WhatsAppLinkButton href={created.whatsapp} />}
            <CopyButton text={created.link} />
          </div>
        </div>
      )}
    </div>
  );
}

export function RevokeInviteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-xs text-clay-700 underline underline-offset-4"
      onClick={() =>
        window.confirm("Cancel this invite? The link will stop working.") &&
        start(async () => {
          const r = await adminRevokeInvite(id);
          if (!r.ok) return void toast.error(r.error);
          router.refresh();
        })
      }
    >
      Cancel
    </button>
  );
}
