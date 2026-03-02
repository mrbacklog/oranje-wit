import { PyramidSkeleton } from "@/components/ui/skeleton";

export default function SamenstellingLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <PyramidSkeleton />
    </div>
  );
}
