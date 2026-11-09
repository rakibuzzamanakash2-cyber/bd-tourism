"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { adminReplyToReviewAction, adminSetReviewHiddenAction, hostReplyToReviewAction } from "@/lib/actions/review";
import { hostText } from "@/lib/i18n/host";
import { cn } from "@/lib/utils";

const btn = "rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50";

/** Hide / show a review and post the team's reply. */
export function AdminReviewActions({ id, hidden, reply, replyBy }: { id: string; hidden: boolean; reply: string | null; replyBy: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState(replyBy === "TEAM" ? (reply ?? "") : "");
  const [open, setOpen] = useState(false);
  const run = (fn: () => ReturnType<typeof adminReplyToReviewAction>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      if (r.message) toast.success(r.message);
      setOpen(false);
      router.refresh();
    });
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {hidden ? (
          <button type="button" disabled={pending} className={cn(btn, "border border-forest-900/20 hover:bg-forest-100")} onClick={() => run(() => adminSetReviewHiddenAction({ reviewId: id, hidden: false }))}>Show again</button>
        ) : (
          <button type="button" disabled={pending} className={cn(btn, "border border-clay-600/40 text-clay-700 hover:bg-clay-500/10")}
            onClick={() => {
              const reason = window.prompt("Why hide it? (only the team sees this)", "Contains personal details");
              if (reason) run(() => adminSetReviewHiddenAction({ reviewId: id, hidden: true, reason }));
            }}>Hide</button>
        )}
        {replyBy !== "HOST" && (
          <button type="button" className={cn(btn, "border border-forest-900/20 hover:bg-forest-100")} onClick={() => setOpen((o) => !o)}>{reply ? "Edit reply" : "Reply"}</button>
        )}
      </div>
      {open && (
        <div className="space-y-2">
          <textarea rows={3} maxLength={1500} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply from DeltaWay" placeholder="Shown publicly under the review" />
          <button type="button" disabled={pending} className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")} onClick={() => run(() => adminReplyToReviewAction({ reviewId: id, reply: text }))}>{text ? "Post reply" : "Remove reply"}</button>
        </div>
      )}
    </div>
  );
}

/** A host answering a review of their homestay. */
export function HostReplyForm({ id, reply, lang }: { id: string; reply: string | null; lang: "en" | "bn" }) {
  const t = hostText[lang];
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(reply ?? "");
  if (!open) {
    return (
      <button type="button" className="text-sm underline underline-offset-4" onClick={() => setOpen(true)}>
        {reply ? t.editReply : t.reply}
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <textarea rows={3} maxLength={1500} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} aria-label={t.reply} placeholder={t.replyHint} />
      <div className="flex gap-2">
        <button type="button" disabled={pending} className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")}
          onClick={() => start(async () => {
            const r = await hostReplyToReviewAction({ reviewId: id, reply: text });
            if (!r.ok) return void toast.error(t.errors.generic);
            toast.success(t.saved);
            setOpen(false);
            router.refresh();
          })}>{t.postReply}</button>
        <button type="button" className={cn(btn, "border border-forest-900/20")} onClick={() => setOpen(false)}>✕</button>
      </div>
    </div>
  );
}
