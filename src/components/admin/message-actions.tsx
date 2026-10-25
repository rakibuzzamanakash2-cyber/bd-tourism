"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ContactStatus } from "@prisma/client";
import { adminSetMessageStatus } from "@/lib/actions/admin/messages";

export function MessageActions({
  messageId,
  status,
  replyHref,
}: {
  messageId: string;
  status: ContactStatus;
  replyHref: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (to: ContactStatus) =>
    start(async () => {
      const r = await adminSetMessageStatus({ messageId, status: to });
      if (!r.ok) return void toast.error(r.error);
      toast.success(to === "ARCHIVED" ? "Archived" : to === "REPLIED" ? "Marked as replied" : "Updated");
      if (to === "ARCHIVED") router.push("/admin/messages");
      else router.refresh();
    });
  const btn = "rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100 disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={replyHref} className="rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800">
        Reply by email
      </a>
      {status !== "REPLIED" && (
        <button type="button" disabled={pending} className={btn} onClick={() => set("REPLIED")}>
          Mark replied
        </button>
      )}
      {status !== "NEW" && (
        <button type="button" disabled={pending} className={btn} onClick={() => set("NEW")}>
          Mark unread
        </button>
      )}
      {status !== "ARCHIVED" && (
        <button type="button" disabled={pending} className={btn} onClick={() => set("ARCHIVED")}>
          Archive
        </button>
      )}
    </div>
  );
}
