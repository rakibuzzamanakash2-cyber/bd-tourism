"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { respondToTripAction, setGuideLanguageAction } from "@/lib/actions/guide";
import { guideText } from "@/lib/i18n/guide";
import { cn } from "@/lib/utils";

const btn = "rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50";

export function TripResponse({ assignmentId, lang }: { assignmentId: string; lang: "en" | "bn" }) {
  const t = guideText[lang];
  const router = useRouter();
  const [pending, start] = useTransition();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  const respond = (accept: boolean) =>
    start(async () => {
      const r = await respondToTripAction({ assignmentId, accept, reason });
      if (!r.ok) return void toast.error(t.errors[r.error] ?? t.errors.generic);
      toast.success(accept ? t.accepted : t.declined);
      router.refresh();
    });

  if (declining) {
    return (
      <div className="space-y-3">
        <label className="block text-sm">
          {t.declineReason}
          <textarea rows={2} maxLength={500} className={`${inputClass} mt-1.5`} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => respond(false)} className={cn(btn, "bg-clay-700 text-paper hover:bg-clay-600")}>
            {t.declineSend}
          </button>
          <button type="button" onClick={() => setDeclining(false)} className={cn(btn, "border border-forest-900/20")}>
            {t.cancel}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={pending} onClick={() => respond(true)} className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")}>
        {t.accept}
      </button>
      <button type="button" disabled={pending} onClick={() => setDeclining(true)} className={cn(btn, "border border-forest-900/20 hover:bg-forest-100")}>
        {t.decline}
      </button>
    </div>
  );
}

export function GuideLanguageToggle({ lang }: { lang: "en" | "bn" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setGuideLanguageAction(lang === "bn" ? "en" : "bn");
          router.refresh();
        })
      }
      className={cn("shrink-0 rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100", lang === "en" && "font-bengali")}
    >
      {guideText[lang].switchTo}
    </button>
  );
}
