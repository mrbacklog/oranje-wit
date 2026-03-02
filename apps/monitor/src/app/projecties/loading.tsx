import { TableSkeleton, ChartSkeleton } from "@/components/ui/skeleton";

export default function ProjectiesLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="mb-8 rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-full animate-pulse rounded-full bg-gray-200" />
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
