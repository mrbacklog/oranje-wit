// ResultaatStap — gebouwd maar niet bereikbaar in Route B (functionele backlog)

export function ResultaatStap() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
        <span
          style={{
            fontWeight: 700,
            color: "var(--text-primary)",
            minWidth: 24,
            textAlign: "right",
          }}
        >
          —
        </span>
        <span>Leden gesynchroniseerd</span>
      </div>
    </div>
  );
}
