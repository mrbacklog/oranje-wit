import { ChartsSkeleton, HeatmapSkeleton, TableSkeleton } from "@/components/monitor/ui/skeleton";

export default function RetentieLoading() {
  return (
    <div>
      <div className="bg-surface-raised mb-6 h-8 w-32 animate-pulse rounded-lg" />
      <ChartsSkeleton />
      <div className="mb-8">
        <HeatmapSkeleton />
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}
