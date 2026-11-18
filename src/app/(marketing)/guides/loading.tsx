import { CardGridSkeleton, PageHeadSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeadSkeleton />
      <CardGridSkeleton />
    </>
  );
}
