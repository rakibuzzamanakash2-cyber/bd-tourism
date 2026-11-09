import Image from "next/image";
import { RatingBadge } from "@/components/reviews/stars";
import Link from "next/link";
import { Home, Users } from "lucide-react";
import { bdtToUsd } from "@/lib/booking-utils";
import { bdt } from "@/lib/guide-shared";
import { stayQuote } from "@/lib/homestay-shared";

export type HomestayCardData = {
  slug: string;
  name: string;
  district: string;
  photos: string[];
  maxGuests: number;
  rooms: number;
  facilities: string[];
  region: { name: string };
};

export function HomestayCard({ h, query = "", rating }: { h: HomestayCardData; query?: string; rating?: { average: number; count: number } }) {
  const price = stayQuote(h.facilities, 1);
  return (
    <Link href={`/homestays/${h.slug}${query}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-forest-100">
        {h.photos[0] ? (
          <Image src={h.photos[0]} alt={h.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex size-full items-center justify-center text-forest-700"><Home className="size-10" aria-hidden /></div>
        )}
      </div>
      <p className="eyebrow mt-4 text-ink-mute">{h.district} · {h.region.name}</p>
      <h3 className="mt-2 font-display text-2xl leading-tight group-hover:text-forest-800">{h.name}</h3>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
        <Users className="size-4" aria-hidden /> Up to {h.maxGuests} · {h.rooms} {h.rooms === 1 ? "room" : "rooms"}
      </p>
      <RatingBadge summary={rating} className="mt-2" />
      <p className="mt-2 text-sm">
        <span className="font-medium">{bdt(price.firstNightBDT)}</span>
        <span className="text-ink-mute"> first night (about ${Math.round(bdtToUsd(price.firstNightBDT))}) · +{bdt(price.extraNightBDT)} each extra night</span>
      </p>
    </Link>
  );
}
