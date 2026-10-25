import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { GuideAvatar } from "@/components/guides/guide-avatar";
import { bdt } from "@/lib/guide-shared";
import { bdtToUsd } from "@/lib/booking-utils";

export type GuideCardData = {
  slug: string;
  displayName: string;
  photoUrl: string | null;
  bio: string;
  languages: string[];
  yearsExperience: number;
  dayRateBDT: number;
  licenceNumber: string | null;
  regions: { name: string }[];
};

export function GuideCard({ guide }: { guide: GuideCardData }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="group block">
      <GuideAvatar name={guide.displayName} photoUrl={guide.photoUrl} className="aspect-[4/5] w-full" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
      <div className="mt-4">
        <p className="eyebrow text-ink-mute">{guide.regions.map((r) => r.name).join(" · ")}</p>
        <h3 className="mt-2 flex items-center gap-2 font-display text-2xl group-hover:text-forest-800">
          {guide.displayName}
          {guide.licenceNumber && <BadgeCheck className="size-5 text-forest-700" aria-label="Licensed guide" />}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          {guide.languages.join(", ")} · {guide.yearsExperience} {guide.yearsExperience === 1 ? "year" : "years"} guiding
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{guide.bio}</p>
        <p className="mt-3 text-sm">
          <span className="font-medium">{bdt(guide.dayRateBDT)}</span>
          <span className="text-ink-mute"> / day · about ${Math.round(bdtToUsd(guide.dayRateBDT))}</span>
        </p>
      </div>
    </Link>
  );
}
