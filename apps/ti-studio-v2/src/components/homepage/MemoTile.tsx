interface MemoBadgeStats {
  open: number;
  inBespreking: number;
  hogePrio: number;
}

interface MemoTileProps {
  stats: MemoBadgeStats;
}

export function MemoTile({ stats }: MemoTileProps) {
  const heeftStats = stats.open > 0 || stats.inBespreking > 0 || stats.hogePrio > 0;

  return (
    <a
      href="/memo"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: "18px 20px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-light)",
        borderRadius: 14,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "border-color 180ms, background 180ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-default)";
        (e.currentTarget as HTMLAnchorElement).style.background = "#1f1f23";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-light)";
        (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-card)";
      }}
    >
      {/* Icoon */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "rgba(234,179,8,.06)",
          border: "1px solid rgba(234,179,8,.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#eab308"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="13" y2="17" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}
        >
          Memo-items
        </div>
        {heeftStats ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            {stats.open > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 5,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "rgba(251,191,36,.08)",
                  color: "#fbbf24",
                  border: "1px solid rgba(251,191,36,.18)",
                }}
              >
                {stats.open} open
              </span>
            )}
            {stats.inBespreking > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 5,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "rgba(96,165,250,.08)",
                  color: "#60a5fa",
                  border: "1px solid rgba(96,165,250,.18)",
                }}
              >
                {stats.inBespreking} in bespreking
              </span>
            )}
            {stats.hogePrio > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 5,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "rgba(239,68,68,.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,.2)",
                }}
              >
                {stats.hogePrio} hoge prio
              </span>
            )}
          </div>
        ) : (
          <div
            style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.4, marginTop: 2 }}
          >
            Geen openstaande items
          </div>
        )}
      </div>

      {/* Pijl */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--text-tertiary)",
        }}
      >
        <svg
          width="13"
          height="13"
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
