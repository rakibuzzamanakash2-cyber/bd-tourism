"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { getUploadSignature } from "@/lib/actions/admin/uploads";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import type { UploadSignature } from "@/lib/cloudinary";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { cn } from "@/lib/utils";

const MAX = 12;
const MAX_BYTES = 10 * 1024 * 1024;

export type PhotosText = { label: string; hint: string; add: string; paste: string; addLink: string; cover: string; makeCover: string; remove: string; tooBig: string; badType: string; full: string; badLink: string };

type Sign = () => Promise<{ ok: true; signature: UploadSignature } | { ok: false; error: string }>;

/** Several photos: upload (or paste links), reorder, pick the cover. */
export function PhotosField({ value, onChange, uploadsEnabled, sign, t, error }: { value: string[]; onChange: (v: string[]) => void; uploadsEnabled: boolean; sign?: Sign; t: PhotosText; error?: string }) {
  const [busy, setBusy] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // Keep the latest list for uploads that finish one after another
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  async function upload(files: FileList) {
    setMsg(null);
    const room = MAX - latest.current.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setMsg(t.full);
    for (const file of list) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setMsg(t.badType); continue; }
      if (file.size > MAX_BYTES) { setMsg(t.tooBig); continue; }
      setBusy((n) => n + 1);
      try {
        const signed = sign ? await sign() : await getUploadSignature("homestays");
        if (!signed.ok) throw new Error(signed.error);
        const up = await uploadToCloudinary(file, signed.signature, !sign);
        latest.current = [...latest.current, up.secureUrl];
        onChange(latest.current);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const move = (i: number, to: number) => {
    const next = [...value];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <div>
      <p className="text-sm font-medium">{t.label}</p>
      <p className="mt-0.5 text-xs text-ink-mute">{t.hint}</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((src, i) => (
          <li key={src} className={cn("group relative aspect-[4/3] overflow-hidden rounded-md border bg-forest-100", i === 0 ? "border-forest-900 ring-2 ring-forest-900" : "border-forest-900/10")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-forest-900 px-2 py-0.5 text-[10px] uppercase tracking-wider text-paper">{t.cover}</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 p-1.5">
              <div className="flex gap-1">
                {i > 0 && <IconBtn label={t.makeCover} onClick={() => move(i, 0)}><Star className="size-3.5" /></IconBtn>}
                {i > 0 && <IconBtn label="←" onClick={() => move(i, i - 1)}><ArrowLeft className="size-3.5" /></IconBtn>}
                {i < value.length - 1 && <IconBtn label="→" onClick={() => move(i, i + 1)}><ArrowRight className="size-3.5" /></IconBtn>}
              </div>
              <IconBtn label={t.remove} onClick={() => onChange(value.filter((_, j) => j !== i))}><X className="size-3.5" /></IconBtn>
            </div>
          </li>
        ))}
        {value.length < MAX && uploadsEnabled && (
          <li>
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-forest-900/25 text-sm text-ink-soft hover:bg-forest-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-700">
              {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              {t.add}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => e.target.files && upload(e.target.files)} />
            </label>
          </li>
        )}
      </ul>
      {value.length < MAX && (
        <div className="mt-3 flex gap-2">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder={t.paste} className="w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm" aria-label={t.paste} />
          <button type="button" className="shrink-0 rounded-full border border-forest-900/20 px-4 text-sm hover:bg-forest-100"
            onClick={() => {
              const u = link.trim();
              if (!isAllowedImageUrl(u)) return setMsg(t.badLink);
              if (!value.includes(u)) onChange([...value, u]);
              setLink("");
              setMsg(null);
            }}>
            {t.addLink}
          </button>
        </div>
      )}
      {(msg || error) && <p className="mt-2 text-xs text-clay-700">{msg ?? error}</p>}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="rounded-full bg-paper/90 p-1 text-ink hover:bg-paper">
      {children}
    </button>
  );
}
