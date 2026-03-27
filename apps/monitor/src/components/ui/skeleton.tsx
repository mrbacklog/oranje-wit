export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-surface-raised animate-pulse rounded-lg ${className}`} style={style} />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-5 shadow-sm">
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="h-9 w-16" />
    </div>
  );
}

export function KpiCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-5 shadow-sm">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="mb-8 grid gap-6 lg:grid-cols-2">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-surface-card rounded-xl p-5 shadow-sm">
      <Skeleton className="mb-4 h-4 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

export function AlertCardSkeleton() {
  return (
    <div className="border-l-border-default bg-surface-card rounded-xl border-l-4 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

export function AlertCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <AlertCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TeamCardsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-card rounded-xl p-5 shadow-sm">
            <Skeleton className="mb-3 h-5 w-32" />
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchTableSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-5 shadow-sm">
      <Skeleton className="mb-4 h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-5 shadow-sm">
      <Skeleton className="mb-4 h-4 w-48" />
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 64 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

export function PyramidSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-5 shadow-sm">
      <Skeleton className="mb-4 h-4 w-40" />
      <div className="flex flex-col items-center gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-6"
            style={{ width: `${40 + (12 - Math.abs(i - 6)) * 5}%` }}
          />
        ))}
      </div>
    </div>
  );
}
