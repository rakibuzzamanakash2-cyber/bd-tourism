"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { testCloudinaryAction } from "@/lib/actions/admin/integrations";

export function TestCloudinaryButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await testCloudinaryAction();
            setResult(r.ok ? { ok: true, text: r.detail } : { ok: false, text: r.error });
          })
        }
        className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Testing…" : "Test connection"}
      </button>
      {result && (
        <p role="status" className={`flex items-start gap-2 text-sm ${result.ok ? "text-forest-800" : "text-clay-700"}`}>
          {result.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
          {result.text}
        </p>
      )}
    </div>
  );
}
