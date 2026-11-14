import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Camera, ShieldCheck, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { verificationRequired } from "@/lib/email-verification";
import { defaultCreditName } from "@/lib/traveler-photo-shared";
import { ShareForm } from "@/components/traveler-photos/share-form";

type Props = { searchParams: Promise<{ district?: string; place?: string }> };

export const metadata: Metadata = {
  title: "Share your photos of Bangladesh",
  description: "Been somewhere in Bangladesh? Share your photos and a few words about each place, and help the next traveler.",
  alternates: { canonical: "/share" },
};

export default async function SharePage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => ["district", "place"].includes(k) && typeof v === "string") as [string, string][]).toString();
    redirect(`/login?callbackUrl=${encodeURIComponent(`/share${qs ? `?${qs}` : ""}`)}`);
  }

  const [districts, places, me] = await Promise.all([
    db.district.findMany({ orderBy: { name: "asc" }, select: { id: true, slug: true, name: true, division: true } }),
    db.districtPlace.findMany({ where: { isPublished: true }, orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, slug: true, name: true, districtId: true } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { name: true, emailVerified: true } }),
  ]);

  // ?place=sylhet/ratargul-swamp-forest or ?district=sylhet picks them in advance
  const [placeDistrict, placeSlug] = (sp.place ?? "").split("/");
  const district = districts.find((d) => d.slug === (sp.place ? placeDistrict : sp.district));
  const place = district && placeSlug ? places.find((p) => p.districtId === district.id && p.slug === placeSlug) : undefined;
  const mustVerify = verificationRequired() && !me?.emailVerified;

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="eyebrow mb-4 text-forest-700">Share your trip</p>
          <h1 className="font-display text-5xl leading-[0.98] sm:text-6xl">
            Show the next traveler <em className="italic text-forest-700">what you saw.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Upload photos of the places you visited in Bangladesh and write a few words about each one. The best ones go on that place&rsquo;s page, with
            your name.
          </p>
          <ul className="mt-8 grid gap-4 text-sm text-ink-soft sm:grid-cols-3">
            <li className="flex gap-2"><Camera className="mt-0.5 size-4 shrink-0 text-forest-700" aria-hidden /> Your own photos, with a description for each</li>
            <li className="flex gap-2"><Sparkles className="mt-0.5 size-4 shrink-0 text-forest-700" aria-hidden /> We review every photo before it appears</li>
            <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest-700" aria-hidden /> Remove them whenever you like</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        {!features.uploads ? (
          <p className="rounded-lg border border-forest-900/10 bg-paper-warm p-8 text-ink-soft">
            Photo uploads aren&rsquo;t switched on yet. Please <Link href="/contact" className="underline underline-offset-4">send us a message</Link> and
            we&rsquo;ll tell you how to share your photos.
          </p>
        ) : mustVerify ? (
          <p className="rounded-lg border border-clay-600/30 bg-clay-500/10 p-8">
            Please confirm your email address before sharing photos. We sent you a link when you signed up; you can send a new one from{" "}
            <Link href="/dashboard" className="underline underline-offset-4">your dashboard</Link>.
          </p>
        ) : (
          <ShareForm
            districts={districts.map(({ id, name, division }) => ({ id, name, division }))}
            places={places.map(({ id, name, districtId }) => ({ id, name, districtId }))}
            initial={{ districtId: district?.id ?? "", placeId: place?.id ?? "", creditName: defaultCreditName(me?.name) }}
          />
        )}
      </section>
    </>
  );
}
