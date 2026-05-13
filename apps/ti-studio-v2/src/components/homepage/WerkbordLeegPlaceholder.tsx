/**
 * Getoond wanneer er geen actieve werkindeling is (lege staat werkbord-widget).
 * OP-2: lege werkbord-widget = placeholder "Nog geen werkindeling"
 */
export function WerkbordLeegPlaceholder() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "20px 24px",
        background: "rgba(59,130,246,.02)",
        border: "1px dashed rgba(59,130,246,.15)",
        borderRadius: 14,
        color: "inherit",
      }}
    >
      {/* Ring placeholder */}
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
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle
            cx="26"
            cy="26"
            r="22"
            fill="rgba(59,130,246,.03)"
            stroke="rgba(59,130,246,.08)"
            strokeWidth="1"
          />
          <circle
            cx="26"
            cy="26"
            r="12"
            fill="none"
            stroke="rgba(59,130,246,.08)"
            strokeWidth="3"
          />
        </svg>
        <span
          style={{
            position: "absolute",
            fontSize: 11,
            fontWeight: 800,
            color: "rgba(59,130,246,.3)",
            letterSpacing: "-0.03em",
          }}
        >
          –%
        </span>
      </div>

      {/* Tekst */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-tertiary)",
            letterSpacing: "-0.01em",
            marginBottom: 2,
          }}
        >
          Werkbord
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Nog geen werkindeling</div>
      </div>

      {/* Pijl (dimmed) */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "rgba(59,130,246,.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "rgba(59,130,246,.25)",
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
    </div>
  );
}
