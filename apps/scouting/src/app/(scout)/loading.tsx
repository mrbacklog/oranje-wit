export default function ScoutLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-2"
          style={{
            borderColor: "var(--border-default)",
            borderTopColor: "var(--ow-oranje-500)",
          }}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Laden...</p>
      </div>
    </div>
  );
}
