import { TeamCardsSkeleton } from "@/components/ui/skeleton";

export default function TeamsLoading() {
  return (
    <div>
      <div className="bg-surface-raised mb-6 h-8 w-32 animate-pulse rounded-lg" />
      <TeamCardsSkeleton />
    </div>
  );
}
