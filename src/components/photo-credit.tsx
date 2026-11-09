import type { ImageCredit } from "@prisma/client";
import { cn } from "@/lib/utils";

/** "Photo: Jane Doe · CC BY-SA 4.0" with links to the source and the licence. */
export function PhotoCredit({ credit, className }: { credit?: ImageCredit; className?: string }) {
  if (!credit) return null;
  return (
    <p className={cn("text-[11px] leading-snug", className)}>
      Photo:{" "}
      <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
        {credit.author}
      </a>
      {" · "}
      {credit.licenseUrl ? (
        <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2">
          {credit.license}
        </a>
      ) : (
        credit.license
      )}
    </p>
  );
}
