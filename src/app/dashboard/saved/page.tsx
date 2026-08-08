import { EmptyState } from "@/components/dashboard/empty-state";

export const metadata = {
  title: "Saved",
};

export default function SavedPage() {
  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Saved</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Your wishlist.
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
        Bookmark destinations you&rsquo;d like to visit later. We&rsquo;ll
        keep them here so you can find them again.
      </p>

      <EmptyState
        title="Nothing saved yet."
        body="Saving destinations is coming in the next update. In the meantime, browse everything we currently offer."
        cta={{ label: "Browse destinations", href: "/destinations" }}
        alt={{ label: "Or see tours", href: "/packages" }}
      />
    </div>
  );
}
