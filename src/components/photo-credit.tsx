import Link from "next/link";
import type { ImageCredit } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * "Photo: Jane Doe · CC BY-SA 4.0". The link stays on our site: it opens the
 * photo's entry on /credits, where the licence and original source are listed.
 */
export function PhotoCredit({ credit, className }: { credit?: ImageCredit; className?: string }) {
  if (!credit) return null;
  return (
    <p className={cn("text-[11px] leading-snug", className)}>
      <Link href={`/credits#photo-${credit.id}`} className="hover:underline" title="See photo credits">
        Photo: {credit.author} · {credit.license}
      </Link>
    </p>
  );
}
