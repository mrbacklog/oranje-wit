export function HubLeeg() {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Vinkje icoon */}
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Alles bijgewerkt
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
        Geen openstaande taken. Lekker bezig!
      </p>
    </div>
  );
}
