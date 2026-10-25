import Image from "next/image";
import Link from "next/link";
import type { Destination, Region } from "@prisma/client";
import { SaveButton } from "@/components/saved/save-button";

type Props = {
  destination: Destination & { region: Region };
  priority?: boolean;
  /** Whether the visitor has saved it; omit to hide the heart */
  saved?: boolean;
  signedIn?: boolean;
};

export function DestinationCard({
  destination,
  priority = false,
  saved,
  signedIn = false,
}: Props) {
  return (
    <div className="group relative">
      <Link href={`/destinations/${destination.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-forest-100">
          <Image
            src={destination.featuredImage}
            alt={destination.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {destination.region.isRestricted && (
            <div className="absolute left-4 top-4 rounded-full bg-paper/95 px-3 py-1 text-xs uppercase tracking-wider text-forest-900">
              Permit required
            </div>
          )}
        </div>
        <div className="mt-5">
          <p className="eyebrow text-ink-mute">{destination.region.name}</p>
          <h3 className="mt-2 font-display text-2xl">{destination.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {destination.shortDesc}
          </p>
        </div>
      </Link>
      {saved !== undefined && (
        <SaveButton
          kind="destination"
          id={destination.id}
          name={destination.name}
          initialSaved={saved}
          signedIn={signedIn}
          className="absolute right-4 top-4"
        />
      )}
    </div>
  );
}
