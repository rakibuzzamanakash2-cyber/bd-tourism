import { Bar, PageHeadSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton wide />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Bar className="h-8 w-72" />
            <Bar className="mt-6 h-11 w-full rounded-full" />
            <div className="mt-8 space-y-6">
              {Array.from({ length: 4 }).map((_, g) => (
                <div key={g}>
                  <Bar className="h-3 w-24" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Bar key={i} className="h-8 w-24 rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Bar className="h-80 w-full rounded-lg" />
        </div>
      </section>
    </>
  );
}
