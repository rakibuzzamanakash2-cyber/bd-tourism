import { Bar, PageHeadSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton wide />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <ul className="space-y-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="border-b border-forest-900/10 pb-10 last:border-0">
              <Bar className="h-8 w-2/3" />
              <Bar className="mt-4 h-4 w-full" />
              <Bar className="mt-2 h-4 w-1/2" />
              <Bar className="mt-4 h-3 w-32" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
