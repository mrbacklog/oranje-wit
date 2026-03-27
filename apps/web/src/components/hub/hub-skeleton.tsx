/**
 * Skeleton loading state voor hub-secties.
 * Gebruikt als Suspense fallback.
 */
export function HubSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--surface-raised)" }} />
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div
          className="mb-3 h-4 w-32 rounded"
          style={{ backgroundColor: "var(--surface-raised)" }}
        />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
              <div
                className="h-10 w-10 flex-shrink-0 rounded-lg"
                style={{ backgroundColor: "var(--surface-raised)" }}
              />
              <div className="flex-1 space-y-1.5">
                <div
                  className="h-3.5 w-3/4 rounded"
                  style={{ backgroundColor: "var(--surface-raised)" }}
                />
                <div
                  className="h-2.5 w-1/2 rounded"
                  style={{ backgroundColor: "var(--surface-raised)", opacity: 0.6 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
