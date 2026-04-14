import Link from "next/link";
import { getActiefSeizoen } from "@oranje-wit/teamindeling-shared/seizoen";

export default async function DashboardPage() {
  const seizoen = await getActiefSeizoen();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 100px)",
        padding: "0 8px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 680 }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-1)",
                margin: 0,
              }}
            >
              TI Studio
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 8px",
                background: "var(--surface-raised, #20203a)",
                border: "1px solid rgba(255,255,255,.10)",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                color: "var(--text-2, #a3a3a3)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--ok, #22c55e)",
                  flexShrink: 0,
                }}
              />
              {seizoen.replace("-", "–")}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-3, #555570)", margin: 0 }}>
            Teamindelingsomgeving · c.k.v. Oranje Wit
          </p>
        </div>

        {/* Tiles grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {/* Werkbord — primaire actie, volle breedte */}
          <Link
            href="/indeling"
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "22px 24px",
              background: "linear-gradient(135deg, #1a1a2e 0%, #1c1c35 100%)",
              border: "1px solid rgba(59,130,246,.35)",
              borderRadius: 16,
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              transition: "border-color 160ms, box-shadow 160ms",
              position: "relative",
              overflow: "hidden",
            }}
            className="ti-dashboard-primary"
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "rgba(59,130,246,.12)",
                border: "1px solid rgba(59,130,246,.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="9" height="9" rx="2" />
                <rect x="13" y="3" width="9" height="9" rx="2" />
                <rect x="2" y="14" width="9" height="7" rx="2" />
                <rect x="13" y="14" width="9" height="7" rx="2" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--text-1, #f5f5f5)",
                  letterSpacing: "-0.01em",
                  marginBottom: 3,
                }}
              >
                Werkbord
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2, #a3a3a3)" }}>
                Visuele editor voor teamopstelling en spelersverdeling
              </div>
            </div>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(59,130,246,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#3b82f6",
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
          </Link>

          {/* Kaders */}
          <TileSecundair
            href="/kader"
            label="Kaders"
            beschrijving="Seizoenskader per team beheren"
            icoon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-2, #a3a3a3)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1.5" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            }
          />

          {/* Personen */}
          <TileSecundair
            href="/personen"
            label="Personen"
            beschrijving="Spelers, staf en reserveringen"
            icoon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-2, #a3a3a3)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="7" r="3" />
                <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" />
                <circle cx="17" cy="8" r="2.5" />
                <path d="M16 20c0-2.5 1.5-4 4-4" />
              </svg>
            }
          />

          {/* Memo-items */}
          <TileSecundair
            href="/memo"
            label="Memo-items"
            beschrijving="Openstaande acties en notities"
            icoon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-2, #a3a3a3)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="13" y2="17" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

function TileSecundair({
  href,
  label,
  beschrijving,
  icoon,
}: {
  href: string;
  label: string;
  beschrijving: string;
  icoon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 20px",
        background: "var(--surface-card, #1a1a2e)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "background 160ms, border-color 160ms, box-shadow 160ms, transform 160ms",
      }}
      className="ti-dashboard-secondary"
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "var(--surface-raised, #20203a)",
          border: "1px solid rgba(255,255,255,.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icoon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-1, #f5f5f5)",
            letterSpacing: "-0.01em",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2, #a3a3a3)" }}>{beschrijving}</div>
      </div>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--text-3, #555570)",
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
    </Link>
  );
}
