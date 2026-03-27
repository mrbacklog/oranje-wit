import { KpiCardsSkeleton, ChartsSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SpelerDetailLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <KpiCardsSkeleton count={4} />
      <ChartsSkeleton />
    </div>
  );
}
