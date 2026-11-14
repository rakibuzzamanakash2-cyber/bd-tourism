"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getTravelerUploadSignature, submitTravelerPhotosAction } from "@/lib/actions/traveler-photos";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import { DIVISIONS } from "@/lib/districts-data";
import { CAPTION_MAX, CAPTION_MIN, MAX_PHOTOS_PER_SUBMISSION, MAX_PHOTO_BYTES } from "@/lib/traveler-photo-shared";

type Props = {
  districts: { id: string; name: string; division: string }[];
  places: { id: string; name: string; districtId: string }[];
  initial: { districtId: string; placeId: string; creditName: string };
};

type Photo = { key: string; name: string; preview: string; caption: string; uploading: boolean; url?: string; publicId?: string; error?: string };

const OTHER = "__other";
const inputClass =
  "w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-700/15";

/** Pick the place, add photos, describe each one, send them for review. */
export function ShareForm({ districts, places, initial }: Props) {
  const [districtId, setDistrictId] = useState(initial.districtId);
  const [placeId, setPlaceId] = useState(initial.placeId);
  const [placeName, setPlaceName] = useState("");
  const [creditName, setCreditName] = useState(initial.creditName);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const districtPlaces = places.filter((p) => p.districtId === districtId);
  const patch = (key: string, change: Partial<Photo>) => setPhotos((list) => list.map((p) => (p.key === key ? { ...p, ...change } : p)));

  async function addFiles(files: FileList) {
    setError(null);
    const room = MAX_PHOTOS_PER_SUBMISSION - photos.length;
    if (files.length > room) setError(`You can share up to ${MAX_PHOTOS_PER_SUBMISSION} photos at a time.`);
    for (const file of Array.from(files).slice(0, room)) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        setError("Please use JPG, PNG or WebP photos.");
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError("That photo is over 10 MB. Please use a smaller one.");
        continue;
      }
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPhotos((list) => [...list, { key, name: file.name, preview: URL.createObjectURL(file), caption: "", uploading: true }]);
      try {
        const signed = await getTravelerUploadSignature();
        if (!signed.ok) throw new Error(signed.error);
        const up = await uploadToCloudinary(file, signed.signature, false);
        patch(key, { uploading: false, url: up.secureUrl, publicId: up.publicId });
      } catch (e) {
        patch(key, { uploading: false, error: e instanceof Error ? e.message : "Upload failed" });
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function remove(key: string) {
    setPhotos((list) => {
      const gone = list.find((p) => p.key === key);
      if (gone) URL.revokeObjectURL(gone.preview);
      return list.filter((p) => p.key !== key);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ready = photos.filter((p) => p.url && p.publicId);
    const problem = !districtId
      ? "Choose the district."
      : !placeId
        ? "Choose the place the photos show."
        : placeId === OTHER && placeName.trim().length < 2
          ? "Type the name of the place."
          : creditName.trim().length < 2
            ? "Tell us the name to show under your photos."
            : photos.some((p) => p.uploading)
              ? "Please wait until the photos finish uploading."
              : photos.some((p) => p.error)
                ? "Remove the photo that didn't upload, then try again."
                : ready.length === 0
                  ? "Add at least one photo."
                  : ready.some((p) => p.caption.trim().length < CAPTION_MIN)
                    ? "Write a short description for every photo."
                    : !agreed
                      ? "Please confirm these are your own photos."
                      : null;
    if (problem) return setError(problem);
    setError(null);
    start(async () => {
      const r = await submitTravelerPhotosAction({
        districtId,
        placeId: placeId === OTHER ? undefined : placeId,
        placeName: placeId === OTHER ? placeName : undefined,
        creditName,
        photos: ready.map((p) => ({ url: p.url!, publicId: p.publicId!, caption: p.caption })),
        agreed: true,
      });
      if (!r.ok) {
        setError(r.error);
        return void toast.error(r.error);
      }
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
      setAgreed(false);
      setSent(r.count ?? ready.length);
    });
  }

  if (sent !== null) {
    return (
      <div className="rounded-lg bg-forest-100 p-8">
        <CheckCircle2 className="size-8 text-forest-800" aria-hidden />
        <p className="mt-4 font-display text-3xl">Thank you!</p>
        <p className="mt-2 max-w-xl text-ink-soft">
          We received {sent === 1 ? "your photo" : `your ${sent} photos`}. Our team looks at every photo before it goes on the site, usually within a few
          days. We&rsquo;ll email you when {sent === 1 ? "it is" : "they are"} live.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setSent(null)} className="rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper hover:bg-forest-800">
            Share more photos
          </button>
          <Link href="/dashboard/photos" className="rounded-full border border-forest-900/20 px-6 py-2.5 text-sm hover:bg-paper">
            See my photos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-10" noValidate>
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-display text-2xl">1. Where were you?</legend>
        <label className="text-sm">
          District
          <select
            name="district"
            value={districtId}
            onChange={(e) => {
              setDistrictId(e.target.value);
              setPlaceId("");
            }}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">Choose a district</option>
            {DIVISIONS.map((v) => (
              <optgroup key={v.slug} label={`${v.name} division`}>
                {districts
                  .filter((d) => d.division === v.slug)
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Place
          <select name="place" value={placeId} onChange={(e) => setPlaceId(e.target.value)} disabled={!districtId} className={`${inputClass} mt-1.5 disabled:opacity-50`}>
            <option value="">{districtId ? "Choose a place" : "Choose the district first"}</option>
            {districtPlaces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {districtId && <option value={OTHER}>Somewhere else (a place, shop or village not listed)</option>}
          </select>
        </label>
        {placeId === OTHER && (
          <label className="text-sm sm:col-span-2">
            Name of the place
            <input name="placeName" value={placeName} maxLength={100} onChange={(e) => setPlaceName(e.target.value)} placeholder="For example: a tea stall near Lawachara gate" className={`${inputClass} mt-1.5`} />
          </label>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-1 font-display text-2xl">2. Your photos</legend>
        <p className="mb-5 text-sm text-ink-mute">
          Up to {MAX_PHOTOS_PER_SUBMISSION} photos, JPG, PNG or WebP, 10 MB each. Write a few words for each one: what it shows, when you went, a tip.
        </p>
        <ul className="space-y-4">
          {photos.map((p, i) => (
            <li key={p.key} className="flex gap-4 rounded-lg border border-forest-900/10 p-3">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-forest-100 sm:size-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className="absolute inset-0 size-full object-cover" />
                {p.uploading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-paper/70">
                    <Loader2 className="size-6 animate-spin text-forest-800" aria-label="Uploading" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor={`caption-${i}`} className="text-sm font-medium">Photo {i + 1}: description</label>
                  <button type="button" onClick={() => remove(p.key)} aria-label={`Remove photo ${i + 1}`} className="rounded-full p-1 text-ink-mute hover:bg-forest-100 hover:text-ink">
                    <X className="size-4" />
                  </button>
                </div>
                <textarea
                  id={`caption-${i}`}
                  rows={3}
                  maxLength={CAPTION_MAX}
                  value={p.caption}
                  onChange={(e) => patch(p.key, { caption: e.target.value })}
                  placeholder="Sunrise from the watchtower in January. Go before 7 am, it's empty."
                  className={`${inputClass} mt-1.5`}
                />
                {p.error ? (
                  <p className="mt-1 text-xs text-clay-700" role="alert">{p.error}</p>
                ) : (
                  <p className="mt-1 text-right text-xs text-ink-mute">{p.caption.length}/{CAPTION_MAX}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {photos.length < MAX_PHOTOS_PER_SUBMISSION && (
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-forest-900/25 px-6 py-10 text-sm text-ink-soft hover:bg-forest-100/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-700">
            <ImagePlus className="size-6" aria-hidden />
            {photos.length === 0 ? "Choose photos" : "Add more photos"}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </label>
        )}
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-4 font-display text-2xl">3. Your name</legend>
        <label className="block max-w-sm text-sm">
          Name shown under your photos
          <input name="creditName" value={creditName} maxLength={60} onChange={(e) => setCreditName(e.target.value)} placeholder="Anna M." className={`${inputClass} mt-1.5`} />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-paper-warm p-4 text-sm leading-relaxed">
          <input type="checkbox" name="agreed" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-4 accent-forest-800" />
          <span>
            I took these photos myself, and anyone who can be recognised in them is happy to be shown. DeltaWay may show them on its website with my name. I can
            remove them at any time from my dashboard.
          </span>
        </label>
      </fieldset>

      {error && (
        <p className="text-sm text-clay-700" role="alert">{error}</p>
      )}
      <button type="submit" disabled={pending} className="rounded-full bg-forest-900 px-8 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-50">
        {pending ? "Sending…" : "Send for review"}
      </button>
    </form>
  );
}
