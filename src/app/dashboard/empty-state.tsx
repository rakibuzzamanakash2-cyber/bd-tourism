import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  body: string;
  cta?: { label: string; href: string };
  alt?: { label: string; href: string };
};

export function EmptyState({ title, body, cta, alt }: Props) {
  return (
    <div className="mt-12 rounded-lg border border-forest-900/10 bg-paper-warm px-8 py-20 text-center">
      <p className="font-display text-3xl">{title}</p>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        {body}
      </p>
      {cta && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={cta.href}
            className={cn(
              buttonVariants(),
              "rounded-full bg-forest-900 text-paper hover:bg-forest-800",
            )}
          >
            {cta.label}
          </Link>
          {alt && (
            <Link
              href={alt.href}
              className="text-sm text-ink-soft underline underline-offset-4 hover:text-forest-800"
            >
              {alt.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
