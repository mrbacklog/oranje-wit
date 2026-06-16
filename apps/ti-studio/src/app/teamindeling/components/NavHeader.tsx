"use client";

const glassStyle: React.CSSProperties = {
  background: "rgba(8,8,8,0.94)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,255,255,0.65)",
  cursor: "pointer",
  padding: "7px 14px",
  whiteSpace: "nowrap" as const,
  letterSpacing: "0.02em",
};

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
        ...glassStyle,
        position: "sticky",
        top: 3,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px",
        gap: 8,
      }}
    >
      {/* Logo + seizoen */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#FF6600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 7,
            fontWeight: 900,
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.15,
            flexShrink: 0,
          }}
        >
          OW
          <br />
          100
        </div>
        {seizoenLabel && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            {seizoenLabel}
          </span>
        )}
      </div>

      {/* Knoppen — identieke stijl */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button style={btnStyle} onClick={onZoek}>
          🔍 Zoek naam
        </button>
        <button style={btnStyle} onClick={onToelichting}>
          ← Toelichting
        </button>
      </div>
    </div>
  );
}
