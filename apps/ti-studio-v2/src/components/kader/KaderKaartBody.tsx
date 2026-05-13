// apps/ti-studio-v2/src/components/kader/KaderKaartBody.tsx

import type { TcKader } from "./types";

interface KaderKaartBodyProps {
  teamtypeId: string;
  kader: TcKader;
  isBCategorie: boolean;
  isUTeam: boolean;
  knkvInfo: string;
}

export function KaderKaartBody({ kader, isBCategorie, isUTeam, knkvInfo }: KaderKaartBodyProps) {
  const inputStyle: React.CSSProperties = {
    width: 46,
    padding: "3px 4px",
    borderRadius: 4,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "inherit",
    outline: "none",
    background: "var(--surface-page)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
  };

  const rijStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 0",
    borderBottom: "1px solid var(--border-light)",
  };

  const labelStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 11,
    color: "var(--text-tertiary)",
  };

  const colHeaderStyle: React.CSSProperties = {
    width: 46,
    textAlign: "center",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-muted)",
  };

  return (
    <div style={{ padding: "0 14px 12px" }}>
      {/* Kolom-headers rij */}
      <div style={{ ...rijStyle, borderBottom: "1px solid var(--border-light)" }}>
        <span style={labelStyle}></span>
        <div style={{ display: "flex", gap: 4 }}>
          <span style={colHeaderStyle}>Min</span>
          <span style={colHeaderStyle}>Ideaal</span>
          <span style={colHeaderStyle}>Max</span>
        </div>
      </div>

      {/* Teamgrootte */}
      <div style={rijStyle}>
        <span style={labelStyle}>Teamgrootte</span>
        <div style={{ display: "flex", gap: 4 }}>
          <input readOnly style={inputStyle} value={kader.teamMin} />
          <input readOnly style={inputStyle} value={kader.teamIdeaal} />
          <input readOnly style={inputStyle} value={kader.teamMax} />
        </div>
      </div>

      {/* Dames */}
      <div style={rijStyle}>
        <span style={labelStyle}>Dames</span>
        <div style={{ display: "flex", gap: 4 }}>
          <input readOnly style={inputStyle} value={kader.damesMin} />
          <input readOnly style={inputStyle} value={kader.damesIdeaal} />
          <input readOnly style={inputStyle} value={kader.damesMax} />
        </div>
      </div>

      {/* Heren */}
      <div
        style={{
          ...rijStyle,
          borderBottom: isBCategorie || isUTeam ? "1px solid var(--border-light)" : "none",
        }}
      >
        <span style={labelStyle}>Heren</span>
        <div style={{ display: "flex", gap: 4 }}>
          <input readOnly style={inputStyle} value={kader.herenMin} />
          <input readOnly style={inputStyle} value={kader.herenIdeaal} />
          <input readOnly style={inputStyle} value={kader.herenMax} />
        </div>
      </div>

      {/* B-categorie: gem. leeftijd + bandbreedte */}
      {isBCategorie && (
        <>
          {(kader.gemLeeftijdMin !== undefined || kader.gemLeeftijdMax !== undefined) && (
            <div
              style={{
                ...rijStyle,
                borderBottom:
                  kader.bandbreedteMax !== undefined ? "1px solid var(--border-light)" : "none",
              }}
            >
              <span style={labelStyle}>Gem. leeftijd</span>
              <div style={{ display: "flex", gap: 4 }}>
                {kader.gemLeeftijdMin !== undefined && (
                  <input readOnly style={inputStyle} value={kader.gemLeeftijdMin} />
                )}
                {kader.gemLeeftijdMax !== undefined && (
                  <input readOnly style={inputStyle} value={kader.gemLeeftijdMax} />
                )}
              </div>
            </div>
          )}
          {kader.bandbreedteMax !== undefined && (
            <div style={{ ...rijStyle, borderBottom: "none" }}>
              <span style={labelStyle}>Max bandbreedte</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input readOnly style={inputStyle} value={kader.bandbreedteMax} />
              </div>
            </div>
          )}
        </>
      )}

      {/* U-teams: max leeftijd per speler */}
      {isUTeam && kader.maxLeeftijdPerSpeler !== undefined && (
        <div style={{ ...rijStyle, borderBottom: "none" }}>
          <span style={labelStyle}>Max leeftijd per speler</span>
          <div style={{ display: "flex", gap: 4 }}>
            <input readOnly style={inputStyle} value={kader.maxLeeftijdPerSpeler.toFixed(2)} />
          </div>
        </div>
      )}

      {/* KNKV info */}
      <div
        style={{
          marginTop: 8,
          padding: "8px 10px",
          borderRadius: 6,
          background: "rgba(255,255,255,.02)",
          border: "1px solid var(--border-light)",
          fontSize: 10,
          color: "var(--text-tertiary)",
          lineHeight: 1.6,
        }}
      >
        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>KNKV:</span> {knkvInfo}
      </div>
    </div>
  );
}
