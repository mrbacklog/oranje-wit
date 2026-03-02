import { KpiCardsSkeleton, ChartsSkeleton, AlertCardsSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <KpiCardsSkeleton />
      <ChartsSkeleton />
      <AlertCardsSkeleton />
    </div>
  );
}
