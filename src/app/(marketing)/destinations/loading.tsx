export default function Loading() {
  return (
    <>
      {/* Header skeleton */}
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="h-4 w-32 animate-pulse rounded bg-forest-900/10" />
          <div className="mt-6 h-16 max-w-2xl animate-pulse rounded bg-forest-900/10" />
        </div>
      </section>

      {/* Filter bar skeleton */}
      <section className="border-b border-forest-900/10 bg-paper/85">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-3">
            <div className="h-3 w-14 animate-pulse rounded bg-forest-900/10" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-24 animate-pulse rounded-full bg-forest-900/10"
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 py-3">
            <div className="h-3 w-12 animate-pulse rounded bg-forest-900/10" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-20 animate-pulse rounded-full bg-forest-900/10"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Card grid skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 h-4 w-20 animate-pulse rounded bg-forest-900/10" />
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] animate-pulse bg-forest-100" />
              <div className="mt-5 space-y-3">
                <div className="h-3 w-24 animate-pulse rounded bg-forest-900/10" />
                <div className="h-7 w-3/4 animate-pulse rounded bg-forest-900/10" />
                <div className="h-4 w-full animate-pulse rounded bg-forest-900/10" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-forest-900/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
