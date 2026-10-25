"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { getUploadSignature } from "@/lib/actions/admin/uploads";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import { CONTENT_IMAGE_HOSTS, isAllowedImageUrl } from "@/lib/image-hosts";

const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  /** Form field name the URL is submitted under */
  name: string;
  label: string;
  defaultValue?: string;
  folder: "destinations" | "tours" | "gallery" | "guides";
  /** Who asks for the upload signature. Defaults to the admin action. */
  sign?: () => ReturnType<typeof getUploadSignature>;
  uploadsEnabled: boolean;
  required?: boolean;
  /** Called with the new URL (for forms that manage state themselves) */
  onChange?: (url: string) => void;
};

/** Photo picker: upload to Cloudinary (when configured) or paste a link. */
export function ImageField({ name, label, defaultValue = "", folder, uploadsEnabled, required, onChange, sign }: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (next: string) => {
    setUrl(next);
    onChange?.(next);
    setError(next && !isAllowedImageUrl(next) ? `Use an https link from: ${CONTENT_IMAGE_HOSTS.join(", ")}` : null);
  };

  async function upload(file: File) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Please choose a JPG, PNG or WebP photo.");
    if (file.size > MAX_BYTES) return setError("That photo is over 10 MB. Please use a smaller one.");
    setUploading(true);
    setError(null);
    try {
      const signed = sign ? await sign() : await getUploadSignature(folder);
      if (!signed.ok) throw new Error(signed.error);
      const uploaded = await uploadToCloudinary(file, signed.signature, !sign);
      update(uploaded.secureUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again or paste a link.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="text-sm font-medium">
        {label}
        {required && <span className="text-clay-600"> *</span>}
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md border border-forest-900/10 bg-forest-100 sm:w-44">
          {url && isAllowedImageUrl(url) ? (
            // Plain <img>: the preview must show any allowed host immediately
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-ink-mute">No photo</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {uploadsEnabled && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                {uploading ? "Uploading…" : "Upload photo"}
              </button>
              <p className="text-xs text-ink-mute">or paste a link:</p>
            </>
          )}
          <input
            type="url"
            name={name}
            value={url}
            required={required}
            onChange={(e) => update(e.target.value.trim())}
            placeholder="https://upload.wikimedia.org/…"
            aria-label={`${label} link`}
            className="w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm"
          />
          {!uploadsEnabled && (
            <p className="text-xs text-ink-mute">
              Paste a link from Unsplash, Pexels or Wikimedia Commons. Add Cloudinary keys to upload photos directly.
            </p>
          )}
          {error && <p className="text-xs text-clay-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
