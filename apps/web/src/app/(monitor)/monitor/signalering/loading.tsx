import { KpiCardsSkeleton, AlertCardsSkeleton } from "@/components/monitor/ui/skeleton";

export default function SignaleringLoading() {
  return (
    <div>
      <div className="bg-surface-raised mb-6 h-8 w-40 animate-pulse rounded-lg" />
      <KpiCardsSkeleton />
      <AlertCardsSkeleton count={5} />
    </div>
  );
}
