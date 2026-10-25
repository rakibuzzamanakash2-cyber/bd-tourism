import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideHeader } from "../guide-header";
import { GuideProfileForm } from "@/components/guides/guide-profile-form";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { guideLang, guideText } from "@/lib/i18n/guide";
import { requireGuide } from "@/lib/session";

export const metadata = { title: "Guide profile" };

export default async function GuideProfilePage() {
  const { profile } = await requireGuide("/dashboard/guide/profile");
  if (!profile) notFound();
  const lang = guideLang(profile.language);
  const t = guideText[lang];
  const [regions, mine] = await Promise.all([
    db.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.guideProfile.findUnique({ where: { id: profile.id }, select: { regions: { select: { id: true } } } }),
  ]);
  return (
    <div className="max-w-2xl">
      <GuideHeader lang={lang} title={t.nav.profile} />
      <p className="-mt-6 mb-8">
        <Link href={`/guides/${profile.slug}`} className="text-sm underline underline-offset-4">{t.viewPublic} →</Link>
      </p>
      <GuideProfileForm
        mode="self"
        lang={lang}
        regions={regions}
        uploadsEnabled={features.uploads}
        initial={{
          displayName: profile.displayName,
          photoUrl: profile.photoUrl ?? "",
          bio: profile.bio,
          languages: profile.languages,
          regionIds: mine?.regions.map((r) => r.id) ?? [],
          yearsExperience: String(profile.yearsExperience),
          dayRateBDT: String(profile.dayRateBDT),
          licenceNumber: profile.licenceNumber ?? "",
          isListed: profile.isListed,
        }}
      />
    </div>
  );
}
