import { KpiCardsSkeleton, SearchTableSkeleton } from "@/components/ui/skeleton";

export default function SpelersLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-32 animate-pulse rounded-lg bg-gray-200" />
      <KpiCardsSkeleton />
      <SearchTableSkeleton />
    </div>
  );
}
