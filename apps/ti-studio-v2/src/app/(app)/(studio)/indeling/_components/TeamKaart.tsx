"use client";

import type { TeamKaartData, TeamKaartSpeler } from "./werkbord-types";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

const CAT_KLEUREN: Record<string, string> = {
  SENIOR: "var(--cat-senior)",
  rood: "var(--cat-rood)",
  oranje: "var(--cat-oranje)",
  geel: "var(--cat-geel)",
  groen: "var(--cat-groen)",
  blauw: "var(--cat-blauw)",
};

const VAL_KLEUREN: Record<string, string> = {
  OK: "var(--val-ok)",
  WAARSCHUWING: "var(--val-warn)",
  FOUT: "var(--val-err)",
  ONBEKEND: "var(--border-default)",
};

function catKleur(team: TeamKaartData): string {
  if (team.kleur) return CAT_KLEUREN[team.kleur] ?? "var(--cat-senior)";
  return CAT_KLEUREN[team.categorie] ?? "var(--cat-senior)";
}

function leeftijdKleur(leeftijd: number): string {
  if (leeftijd <= 7) return "var(--cat-blauw)";
  if (leeftijd <= 9) return "var(--cat-groen)";
  if (leeftijd <= 12) return "var(--cat-geel)";
  if (leeftijd <= 15) return "var(--cat-oranje)";
  if (leeftijd <= 18) return "var(--cat-rood)";
  return "var(--cat-senior)";
}

interface CompactChipProps {
  speler: TeamKaartSpeler;
  onClick: (spelerId: string) => void;
}

function CompactChip({ speler, onClick }: CompactChipProps) {
  const isVrouw = speler.geslacht === "V";
  return (
    <div
      className={cx("compact-chip", isVrouw && "vrouw")}
      style={{ cursor: "pointer" }}
      onClick={() => onClick(speler.spelerId)}
      title={`${speler.roepnaam} ${speler.achternaam} (${speler.korfbalLeeftijd.toFixed(1)} jr)`}
    >
      <div className="inner">
        <span className="g-dot" />
        <span className="nm">{speler.roepnaam}</span>
      </div>
      <div className="leeft-bar" style={{ background: leeftijdKleur(speler.korfbalLeeftijd) }} />
    </div>
  );
}

interface TeamKaartProps {
  team: TeamKaartData;
  zoom: "compact" | "detail";
  peildatum: Date;
  onHeaderClick: (teamId: string) => void;
  onSpelerClick: (spelerId: string) => void;
  onStafClick: (stafId: string) => void;
}

export function TeamKaart({
  team,
  zoom,
  onHeaderClick,
  onSpelerClick,
  onStafClick,
}: TeamKaartProps) {
  const kleur = catKleur(team);
  const valKleur = VAL_KLEUREN[team.validatieStatus] ?? "var(--border-default)";
  const aantalDames = team.spelersDames.length;
  const aantalHeren = team.spelersHeren.length;
  const totaal = aantalDames + aantalHeren;

  return (
    <div
      className="team-kaart"
      data-team-id={team.id}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-card)",
        borderRadius: "var(--team-card-radius)",
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
        border: "1px solid var(--border-light)",
        boxShadow: "0 2px 12px rgba(0,0,0,.3)",
      }}
    >
      {/* Gekleurde linker-accent-band */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "var(--team-band-width)",
          background: kleur,
          borderRadius: "var(--team-card-radius) 0 0 var(--team-card-radius)",
        }}
      />

      {/* Header */}
      <div
        className="tk-header"
        style={{
          height: "var(--team-card-header-h)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px 0 16px",
          borderBottom: "1px solid var(--border-light)",
          gap: 6,
          cursor: "pointer",
          flexShrink: 0,
        }}
        onClick={() => onHeaderClick(team.id)}
      >
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {team.alias ?? team.naam}
        </span>
        <div className="tk-header-right">
          {team.openMemoCount > 0 && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#eab308",
                background: "rgba(234,179,8,.12)",
                border: "1px solid rgba(234,179,8,.3)",
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >
              ▲ {team.openMemoCount}
            </span>
          )}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: valKleur,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {totaal}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="tk-body" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {zoom === "compact" ? (
          <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>
            {/* Dames-kolom */}
            <div
              className="tk-col"
              style={{
                flex: 1,
                borderRight: "1px solid var(--border-light)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div className="compact-sexe-teller v" style={{ flexShrink: 0 }}>
                <span className="st-val">{aantalDames}</span>
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,.4)",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  ♀
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "0 4px 6px",
                }}
              >
                {team.spelersDames.map((s) => (
                  <CompactChip key={s.spelerId} speler={s} onClick={onSpelerClick} />
                ))}
              </div>
            </div>

            {/* Heren-kolom */}
            <div
              className="tk-col"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div className="compact-sexe-teller h" style={{ flexShrink: 0 }}>
                <span className="st-val">{aantalHeren}</span>
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,.4)",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  ♂
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "0 4px 6px",
                }}
              >
                {team.spelersHeren.map((s) => (
                  <CompactChip key={s.spelerId} speler={s} onClick={onSpelerClick} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "6px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
            className="ow-scroll"
          >
            {[...team.spelersDames, ...team.spelersHeren].map((s) => (
              <div
                key={s.spelerId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 6px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--text-primary)",
                }}
                onClick={() => onSpelerClick(s.spelerId)}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: s.geslacht === "V" ? "var(--sexe-v)" : "var(--sexe-h)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>
                  {s.roepnaam} {s.achternaam}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.korfbalLeeftijd.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: staf */}
      <div
        className="tk-footer"
        style={{
          height: "var(--team-card-footer-h)",
          borderTop: "1px solid var(--border-light)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 10px",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {team.staf.length === 0 ? (
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Geen staf</span>
        ) : (
          team.staf.slice(0, 3).map((stafLid) => (
            <button
              key={stafLid.stafId}
              onClick={() => onStafClick(stafLid.stafId)}
              style={{
                padding: "2px 7px",
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 600,
                border: "1px solid var(--staf-accent-border)",
                background: "var(--staf-accent-dim)",
                color: "var(--staf-accent)",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 80,
              }}
              title={stafLid.naam}
            >
              {stafLid.naam.split(" ")[0]}
            </button>
          ))
        )}
        {team.staf.length > 3 && (
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>+{team.staf.length - 3}</span>
        )}
      </div>
    </div>
  );
}
