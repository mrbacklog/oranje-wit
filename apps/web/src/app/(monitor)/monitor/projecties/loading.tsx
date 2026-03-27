import { TableSkeleton, ChartSkeleton } from "@/components/monitor/ui/skeleton";

export default function ProjectiesLoading() {
  return (
    <div>
      <div className="bg-surface-raised mb-6 h-8 w-48 animate-pulse rounded-lg" />
      <div className="bg-surface-card mb-8 rounded-xl p-5 shadow-sm">
        <div className="bg-surface-raised mb-2 h-4 w-32 animate-pulse rounded" />
        <div className="bg-surface-raised h-6 w-full animate-pulse rounded-full" />
      </div>
      <TableSkeleton rows={12} />
      <div className="mt-8">
        <ChartSkeleton />
      </div>
      <div className="mt-8">
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}
