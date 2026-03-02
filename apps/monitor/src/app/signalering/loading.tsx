import { KpiCardsSkeleton, AlertCardsSkeleton } from "@/components/ui/skeleton";

export default function SignaleringLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
      <KpiCardsSkeleton />
      <AlertCardsSkeleton count={5} />
    </div>
  );
}
