"use client";

interface VoortgangsRingProps {
  pct: number;
  ingedeeld: number;
  totaal: number;
}

const RADIUS = 12;
const OMTREK = 2 * Math.PI * RADIUS;

export function VoortgangsRing({ pct, ingedeeld, totaal }: VoortgangsRingProps) {
  const dashOffset = OMTREK * (1 - pct / 100);

  return (
    <a
      href="/indeling"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "20px 24px",
        background: "linear-gradient(135deg, rgba(59,130,246,.06) 0%, rgba(59,130,246,.02) 100%)",
        border: "1px solid rgba(59,130,246,.2)",
        borderRadius: 14,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "border-color 180ms, background 180ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(59,130,246,.4)";
        (e.currentTarget as HTMLAnchorElement).style.background =
          "linear-gradient(135deg, rgba(59,130,246,.1) 0%, rgba(59,130,246,.04) 100%)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(59,130,246,.2)";
        (e.currentTarget as HTMLAnchorElement).style.background =
          "linear-gradient(135deg, rgba(59,130,246,.06) 0%, rgba(59,130,246,.02) 100%)";
      }}
    >
      {/* Voortgangsring */}
      <div
        style={{
          position: "relative",
          width: 52,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
        >
          <circle
            cx="26"
            cy="26"
            r="22"
            fill="rgba(59,130,246,.06)"
            stroke="rgba(59,130,246,.15)"
            strokeWidth="1"
          />
          <circle
            cx="26"
            cy="26"
            r={RADIUS}
            fill="none"
            stroke="rgba(59,130,246,.15)"
            strokeWidth="3"
          />
          <circle
            cx="26"
            cy="26"
            r={RADIUS}
            fill="none"
            stroke="var(--color-info)"
            strokeWidth="3"
            strokeDasharray={OMTREK}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "var(--color-info)",
            zIndex: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {pct}%
        </span>
      </div>

      {/* Tekst */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            marginBottom: 2,
          }}
        >
          Werkbord
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Visuele editor voor teamopstelling
        </div>
      </div>

      {/* Stats */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-info)", lineHeight: 1 }}>
          {ingedeeld}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>
          / {totaal} spelers
        </div>
      </div>

      {/* Pijl */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "rgba(59,130,246,.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--color-info)",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </div>
    </a>
  );
}
