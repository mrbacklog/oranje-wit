import { KpiCardsSkeleton, ChartsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function SamenstellingDetailLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
      <KpiCardsSkeleton count={4} />
      <ChartsSkeleton />
      <div className="mt-8">
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
