import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  district: {
    slug: string;
    name: string;
    nameBn: string;
    knownFor: string;
    highlights: string[];
    photo: string | null;
    permitRequired: boolean;
  };
  places?: number;
  priority?: boolean;
};

export function DistrictCard({ district: d, places = 0, priority = false }: Props) {
  return (
    <Link href={`/districts/${d.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-forest-900">
        {d.photo ? (
          <Image
            src={d.photo}
            alt={`${d.name}, Bangladesh`}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <DistrictPlaceholder nameBn={d.nameBn} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-forest-950/85 via-forest-950/30 to-transparent" />
        {d.permitRequired && (
          <span className="absolute left-3 top-3 rounded-full bg-paper/95 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-forest-900">
            Permit needed
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 text-paper">
          <p className="font-bengali text-sm text-paper/75">{d.nameBn}</p>
          <h3 className="font-display text-2xl leading-tight">{d.name}</h3>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">{d.knownFor}</p>
      <p className="mt-1.5 line-clamp-1 text-xs text-ink-mute">
        {d.highlights.slice(0, 3).join(" · ")}
        {places > 0 && <span className="text-forest-700"> · {places} {places === 1 ? "place" : "places"} to book</span>}
      </p>
    </Link>
  );
}

/** Shown until a photo is added: the Bangla name over a soft pattern. */
export function DistrictPlaceholder({ nameBn, className }: { nameBn: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950", className)}
      style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgb(255 255 255 / 0.07) 0, transparent 45%), radial-gradient(circle at 85% 70%, rgb(255 255 255 / 0.05) 0, transparent 40%)" }}
    >
      <span className="font-bengali text-5xl text-paper/15 sm:text-6xl">{nameBn}</span>
    </div>
  );
}
