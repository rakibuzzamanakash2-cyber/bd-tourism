import { cn } from "@/lib/utils";

/**
 * Placeholder shapes shown while a page's data loads.
 *
 * They exist so a slow query shows the shape of the page instead of a blank
 * screen. Each one is aria-hidden: a screen reader should hear the real
 * content when it arrives, not a description of grey boxes.
 *
 * The pulse is disabled under prefers-reduced-motion (see globals.css).
 */
export function Bar({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-forest-900/10", className)} />;
}

export function Block({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse bg-forest-100", className)} />;
}

/** The eyebrow-and-title band most pages open with. */
export function PageHeadSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <section className="border-b border-forest-900/10 bg-paper-warm">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Bar className="h-4 w-28" />
        <Bar className={cn("mt-6 h-14", wide ? "max-w-3xl" : "max-w-2xl")} />
        <Bar className="mt-5 h-5 max-w-xl" />
      </div>
    </section>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <Block className="aspect-[4/5]" />
            <div className="mt-5 space-y-3">
              <Bar className="h-3 w-24" />
              <Bar className="h-7 w-3/4" />
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** A single thing with a big photo and prose: a district, a place, a tour. */
export function DetailSkeleton() {
  return (
    <>
      <Block className="h-[45vh] min-h-[320px] w-full" />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <Bar className="h-4 w-24" />
        <Bar className="mt-5 h-12 max-w-xl" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bar key={i} className={cn("h-4", i % 3 === 2 ? "w-2/3" : "w-full")} />
          ))}
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Bar className="h-3 w-20" />
              <Bar className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** A page of prose. */
export function ProseSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Bar className="h-4 w-24" />
      <Bar className="mt-5 h-12 w-full" />
      <Bar className="mt-3 h-12 w-2/3" />
      <Bar className="mt-6 h-5 w-full" />
      <div className="mt-12 space-y-10">
        {Array.from({ length: 3 }).map((_, s) => (
          <div key={s}>
            <Bar className="h-7 w-1/2" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bar key={i} className={cn("h-4", i === 3 ? "w-3/4" : "w-full")} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rows of records: admin tables, dashboard lists. */
export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Bar className="h-8 w-48" />
      <Bar className="mb-6 h-4 w-80" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 rounded-lg border border-forest-900/10 p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Bar className="h-4 w-1/3" />
            <Bar className="h-3 w-1/2" />
          </div>
          <Bar className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
