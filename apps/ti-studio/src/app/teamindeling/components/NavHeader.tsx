"use client";

export function NavHeader({
  seizoenLabel,
  onZoek,
  onToelichting,
}: {
  seizoenLabel: string | null;
  onZoek: () => void;
  onToelichting: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "#FF6600",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 18px",
        gap: 8,
      }}
    >
      {/* Seizoen label */}
      {seizoenLabel && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {seizoenLabel}
        </span>
      )}

      {/* Knoppen */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 4,
            padding: "7px 10px",
            fontSize: 14,
            color: "#fff",
            cursor: "pointer",
          }}
          onClick={onZoek}
        >
          🔍
        </button>
        <button
          style={{
            background: "rgba(0,0,0,0.18)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 4,
            padding: "7px 12px",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          onClick={onToelichting}
        >
          ← Toelichting
        </button>
      </div>
    </div>
  );
}
