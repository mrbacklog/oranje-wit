// VoortgangStap — gebouwd maar niet bereikbaar in Route B (functionele backlog)

export function VoortgangStap() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        Leden ophalen van Sportlink API...
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--surface-card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 3,
            background: "var(--ow-accent)",
            width: "0%",
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
        Wachten op synchronisatie...
      </div>
    </div>
  );
}
