"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageField } from "@/components/admin/image-field";
import { inputClass } from "@/components/admin/form";
import {
  addGalleryImageAction,
  moveGalleryImageAction,
  removeGalleryImageAction,
} from "@/lib/actions/admin/destinations";

type Img = { id: string; url: string; caption: string | null };

export function GalleryManager({
  destinationId,
  images,
  uploadsEnabled,
}: {
  destinationId: string;
  images: Img[];
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [formKey, setFormKey] = useState(0);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error ?? "Something went wrong");
      done?.();
      router.refresh();
    });

  return (
    <div className="space-y-6">
      {images.length === 0 ? (
        <p className="text-sm text-ink-mute">No gallery photos yet. The gallery section only appears on the site once there is at least one.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-md border border-forest-900/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? ""} className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="line-clamp-1 text-xs text-ink-soft">{img.caption || "No caption"}</p>
                <div className="flex shrink-0 gap-1">
                  <IconButton label="Move up" disabled={pending || i === 0} onClick={() => run(() => moveGalleryImageAction(img.id, "up"))}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Move down" disabled={pending || i === images.length - 1} onClick={() => run(() => moveGalleryImageAction(img.id, "down"))}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Remove photo"
                    disabled={pending}
                    onClick={() => window.confirm("Remove this photo from the gallery?") && run(() => removeGalleryImageAction(img.id))}
                  >
                    <Trash2 className="size-4 text-clay-700" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div key={formKey} className="space-y-3 rounded-md bg-paper-warm p-4">
        <ImageField name="galleryUrl" label="Add a photo" folder="gallery" uploadsEnabled={uploadsEnabled} onChange={setUrl} />
        <input
          className={inputClass}
          placeholder="Caption (optional), e.g. Sunset over Inani beach"
          aria-label="Caption"
          value={caption}
          maxLength={200}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button
          type="button"
          disabled={pending || !url}
          className="rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800 disabled:opacity-50"
          onClick={() =>
            run(
              () => addGalleryImageAction({ destinationId, url, caption }),
              () => {
                setUrl("");
                setCaption("");
                setFormKey((k) => k + 1);
                toast.success("Photo added");
              },
            )
          }
        >
          Add to gallery
        </button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="rounded p-1 hover:bg-forest-100 disabled:opacity-30">
      {children}
    </button>
  );
}
