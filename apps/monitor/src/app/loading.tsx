import { KpiCardsSkeleton, ChartsSkeleton, AlertCardsSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="bg-surface-raised mb-6 h-8 w-48 animate-pulse rounded-lg" />
      <KpiCardsSkeleton />
      <ChartsSkeleton />
      <AlertCardsSkeleton />
    </div>
  );
}
