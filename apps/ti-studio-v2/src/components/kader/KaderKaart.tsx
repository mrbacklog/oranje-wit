// apps/ti-studio-v2/src/components/kader/KaderKaart.tsx
"use client";

import type { TcKader } from "./types";
import { KaderKaartBody } from "./KaderKaartBody";

interface KaderKaartProps {
  teamtypeId: string;
  label: string;
  kleurCss: string;
  doelgroepLabel: string;
  leeftijdRange: string;
  kader: TcKader;
  isOpen: boolean;
  isGewijzigd: boolean;
  isBCategorie: boolean;
  isUTeam: boolean;
  knkvInfo: string;
  onToggle: () => void;
  onClick?: () => void;
}

export function KaderKaart({
  teamtypeId,
  label,
  kleurCss,
  doelgroepLabel,
  leeftijdRange,
  kader,
  isOpen,
  isGewijzigd,
  isBCategorie,
  isUTeam,
  knkvInfo,
  onToggle,
}: KaderKaartProps) {
  const kaartStyle: React.CSSProperties = {
    background: "var(--surface-card)",
    border: isGewijzigd ? "1px solid rgba(255,107,0,.3)" : "1px solid var(--border-light)",
    borderRadius: 10,
    overflow: "hidden",
    borderLeft: `4px solid ${kleurCss}`,
    transition: "border-color 180ms",
    cursor: "pointer",
  };

  // summary values voor ingeklapte weergave
  const summaryTeam = `${kader.teamMin}–${kader.teamIdeaal}–${kader.teamMax}`;
  const summaryDames = `${kader.damesMin}–${kader.damesIdeaal}–${kader.damesMax}`;
  const summaryHeren = `${kader.herenMin}–${kader.herenIdeaal}–${kader.herenMax}`;

  return (
    <div
      style={kaartStyle}
      onClick={(e) => {
        // Input-klikken niet door laten sluiten/openen
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        onToggle();
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            flexShrink: 0,
            background: kleurCss,
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {label}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
            fontSize: 10,
            color: "var(--text-tertiary)",
          }}
        >
          {isBCategorie && (
            <span
              style={{
                padding: "2px 7px",
                borderRadius: 4,
                background: "rgba(255,255,255,.04)",
                border: "1px solid var(--border-light)",
                fontWeight: 500,
              }}
            >
              {leeftijdRange}
            </span>
          )}
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 4,
              background: `color-mix(in srgb, ${kleurCss} 10%, transparent)`,
              border: `1px solid color-mix(in srgb, ${kleurCss} 25%, transparent)`,
              color: kleurCss,
              fontWeight: 600,
            }}
          >
            {doelgroepLabel}
          </span>
          {isGewijzigd && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--ow-accent)",
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>

      {/* Summary (ingeklapt) */}
      {!isOpen && (
        <div
          style={{
            padding: "0 14px 10px",
            display: "flex",
            gap: 12,
            fontSize: 11,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "var(--text-tertiary)",
            }}
          >
            Team:{" "}
            <span
              style={{
                fontWeight: 700,
                color: "var(--text-secondary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {summaryTeam}
            </span>
          </span>
          {isUTeam && kader.maxLeeftijdPerSpeler !== undefined ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--text-tertiary)",
              }}
            >
              Max:{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {kader.maxLeeftijdPerSpeler.toFixed(2)}
              </span>
            </span>
          ) : isBCategorie && kader.bandbreedteMax !== undefined ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--text-tertiary)",
              }}
            >
              Band:{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                &le;{kader.bandbreedteMax} jr
              </span>
            </span>
          ) : (
            <>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--text-tertiary)",
                }}
              >
                &female;:{" "}
                <span
                  style={{
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {summaryDames}
                </span>
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--text-tertiary)",
                }}
              >
                &male;:{" "}
                <span
                  style={{
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {summaryHeren}
                </span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Body (uitgeklapt) */}
      {isOpen && (
        <KaderKaartBody
          teamtypeId={teamtypeId}
          kader={kader}
          isBCategorie={isBCategorie}
          isUTeam={isUTeam}
          knkvInfo={knkvInfo}
        />
      )}
    </div>
  );
}
