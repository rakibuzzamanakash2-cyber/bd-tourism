import Image from "next/image";
import { Landmark, Leaf, Lightbulb, MapPin, ShoppingBag, Sparkles, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { ImageCredit } from "@prisma/client";
import { PLACE_KINDS } from "@/lib/places-data/types";
import { PhotoCredit } from "@/components/photo-credit";

const ICONS: Record<string, LucideIcon> = {
  SIGHT: Landmark,
  NATURE: Leaf,
  RELIGIOUS: Sparkles,
  MARKET: ShoppingBag,
  FOOD: UtensilsCrossed,
  EXPERIENCE: MapPin,
};

export const placeKindLabel = (kind: string) => PLACE_KINDS.find((k) => k.value === kind)?.label ?? kind;

type Props = {
  place: { name: string; kind: string; description: string; tip: string | null; photo: string | null };
  credit?: ImageCredit;
};

export function PlaceCard({ place, credit }: Props) {
  const Icon = ICONS[place.kind] ?? MapPin;
  return (
    <article className="flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-forest-100">
        {place.photo ? (
          <Image src={place.photo} alt={place.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <div aria-hidden className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest-100 to-forest-200">
            <Icon className="size-10 text-forest-700/40" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-paper/95 px-2.5 py-1 text-[11px] font-medium text-forest-900">
          <Icon className="size-3.5" aria-hidden /> {placeKindLabel(place.kind)}
        </span>
      </div>
      {credit && <PhotoCredit credit={credit} className="mt-1 text-ink-mute" />}
      <h3 className="mt-3 font-display text-xl leading-snug">{place.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{place.description}</p>
      {place.tip && (
        <p className="mt-2 flex gap-1.5 text-xs leading-relaxed text-forest-800">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {place.tip}
        </p>
      )}
    </article>
  );
}
