import { PyramidSkeleton } from "@/components/ui/skeleton";

export default function SamenstellingLoading() {
  return (
    <div>
      <div className="bg-surface-raised mb-6 h-8 w-48 animate-pulse rounded-lg" />
      <PyramidSkeleton />
    </div>
  );
}
