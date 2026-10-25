"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleSavedAction } from "@/lib/actions/saved";
import { cn } from "@/lib/utils";

type Props = {
  kind: "destination" | "package";
  id: string;
  name: string;
  initialSaved: boolean;
  signedIn: boolean;
  /** "overlay" sits on a photo; "inline" is a text button */
  variant?: "overlay" | "inline";
  className?: string;
};

export function SaveButton({
  kind,
  id,
  name,
  initialSaved,
  signedIn,
  variant = "overlay",
  className,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      const result = await toggleSavedAction({ kind, id });
      if (!result.ok) {
        setSaved(!next);
        if (result.needsLogin) router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        else toast.error(result.error);
        return;
      }
      setSaved(result.saved);
      toast.success(result.saved ? "Saved" : "Removed from saved", {
        description: result.saved ? `${name} is in your saved list.` : undefined,
      });
    });
  }

  const label = saved ? `Remove ${name} from saved` : `Save ${name}`;

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-2 text-sm text-ink-soft underline-offset-4 hover:text-forest-800 hover:underline disabled:opacity-60",
          className,
        )}
      >
        <Heart className={cn("size-4", saved && "fill-clay-600 text-clay-600")} />
        {saved ? "Saved" : "Save for later"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Saved" : "Save"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full bg-paper/95 text-forest-900 shadow-sm backdrop-blur transition-transform hover:scale-105 disabled:opacity-70",
        className,
      )}
    >
      <Heart className={cn("size-5", saved && "fill-clay-600 text-clay-600")} />
    </button>
  );
}
