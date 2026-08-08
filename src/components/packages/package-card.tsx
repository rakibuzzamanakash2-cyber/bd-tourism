import Image from "next/image";
import Link from "next/link";
import type { TourPackage } from "@prisma/client";

type Props = {
  package: TourPackage;
  priority?: boolean;
};

export function PackageCard({ package: pkg, priority = false }: Props) {
  return (
    <Link href={`/packages/${pkg.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-forest-100">
        <Image
          src={pkg.featuredImage}
          alt={pkg.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-ink-mute">
          <span>
            {pkg.durationDays} {pkg.durationDays === 1 ? "day" : "days"}
          </span>
          <span>·</span>
          <span>from ${Number(pkg.basePriceUSD).toFixed(0)}</span>
        </div>
        <h3 className="mt-2 font-display text-2xl leading-tight">{pkg.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {pkg.summary}
        </p>
      </div>
    </Link>
  );
}
