import { ChartsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function RetentieSeizoenLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <ChartsSkeleton />
      <div className="mt-8">
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}
