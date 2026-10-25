import Image from "next/image";
import { cn } from "@/lib/utils";

/** Guide photo, or their initials when there isn't one yet. */
export function GuideAvatar({ name, photoUrl, className, sizes = "160px", priority }: { name: string; photoUrl: string | null; className?: string; sizes?: string; priority?: boolean }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className={cn("relative overflow-hidden bg-forest-100", className)}>
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div aria-hidden className="flex size-full items-center justify-center font-display text-4xl text-forest-700">
          {initials}
        </div>
      )}
    </div>
  );
}
