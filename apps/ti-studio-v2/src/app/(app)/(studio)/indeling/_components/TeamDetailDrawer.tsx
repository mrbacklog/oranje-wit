"use client";

import type { TeamKaartData } from "./werkbord-types";
import { SpelerAvatar } from "@/components/shared/SpelerAvatar";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

const CAT_KLEUREN: Record<string, string> = {
  SENIOR: "var(--cat-senior)",
  SENIOREN: "var(--cat-senior)",
  rood: "var(--cat-rood)",
  ROOD: "var(--cat-rood)",
  oranje: "var(--cat-oranje)",
  ORANJE: "var(--cat-oranje)",
  geel: "var(--cat-geel)",
  GEEL: "var(--cat-geel)",
  groen: "var(--cat-groen)",
  GROEN: "var(--cat-groen)",
  blauw: "var(--cat-blauw)",
  BLAUW: "var(--cat-blauw)",
  paars: "var(--cat-paars)",
  PAARS: "var(--cat-paars)",
};

const VAL_KLEUREN: Record<string, string> = {
  OK: "var(--val-ok)",
  WAARSCHUWING: "var(--val-warn)",
  FOUT: "var(--val-err)",
  ONBEKEND: "var(--border-default)",
};

function teamKleurVar(team: TeamKaartData): string {
  if (team.kleur) return CAT_KLEUREN[team.kleur.toUpperCase()] ?? "var(--cat-senior)";
  return CAT_KLEUREN[team.categorie?.toUpperCase()] ?? "var(--cat-senior)";
}

function leeftijdGradient(leeftijd: number): string {
  const jaar = Math.max(4, Math.min(19, Math.floor(leeftijd)));
  return `var(--leeftijd-${jaar})`;
}

function valVariant(melding: string): "ok" | "warn" | "err" {
  const lower = melding.toLowerCase();
  if (lower.includes("fout") || lower.includes("niet") || lower.includes("te weinig")) return "err";
  if (lower.includes("warn") || lower.includes("onder") || lower.includes("dicht")) return "warn";
  if (melding.startsWith("ok") || melding.startsWith("✓")) return "ok";
  return "warn";
}

interface TeamDetailDrawerProps {
  team: TeamKaartData | null;
  open: boolean;
  onTerug: () => void;
}

// Bepaal hex-kleur voor het hero-gradient (eenvoudige lookup)
const HERO_HEX: Record<string, string> = {
  "var(--cat-senior)": "94,163,184",
  "var(--cat-rood)": "239,68,68",
  "var(--cat-oranje)": "249,115,22",
  "var(--cat-geel)": "234,179,8",
  "var(--cat-groen)": "34,197,94",
  "var(--cat-blauw)": "59,130,246",
  "var(--cat-paars)": "126,34,206",
};

export function TeamDetailDrawer({ team, open, onTerug }: TeamDetailDrawerProps) {
  const valKleur = VAL_KLEUREN[team?.validatieStatus ?? "ONBEKEND"] ?? "var(--border-default)";
  const kleur = team ? teamKleurVar(team) : "var(--cat-senior)";
  const heroRgb = HERO_HEX[kleur] ?? "94,163,184";

  return (
    <div
      className={cx("wb-drawer", "rechts", open && team && "open")}
      style={
        {
          "--drawer-width": "420px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        } as React.CSSProperties
      }
    >
      {team && (
        <>
          {/* Hero-sectie */}
          <div
            style={{
              position: "relative",
              padding: "18px 22px 16px 28px",
              borderBottom: "1px solid var(--border-light)",
              background: `linear-gradient(180deg, rgba(${heroRgb}, 0.12) 0%, transparent 100%)`,
              flexShrink: 0,
            }}
          >
            {/* Linker kleurband */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 5,
                background: kleur,
              }}
            />

            {/* Sluit-knop */}
            <button
              onClick={onTerug}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "rgba(0,0,0,.4)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
              aria-label="Terug naar teams"
            >
              ✕
            </button>

            {/* Teamnaam */}
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              {team.alias ?? team.naam}
            </div>

            {/* Sub: categorie · niveau */}
            {(team.categorie || team.niveau) && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  marginTop: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                {[team.categorie, team.niveau].filter(Boolean).join(" · ")}
              </div>
            )}

            {/* Meta: ♀/♂ + val-dot */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 12,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--sexe-v)",
                  background: "rgba(217,70,239,.1)",
                  border: "1px solid rgba(217,70,239,.3)",
                  borderRadius: 5,
                  padding: "3px 8px",
                }}
              >
                ♀ {team.spelersDames.length}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--sexe-h)",
                  background: "rgba(37,99,235,.1)",
                  border: "1px solid rgba(37,99,235,.3)",
                  borderRadius: 5,
                  padding: "3px 8px",
                }}
              >
                ♂ {team.spelersHeren.length}
              </span>
              <span style={{ flex: 1 }} />
              {team.openMemoCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--memo-open)",
                    fontWeight: 800,
                  }}
                >
                  ▲ {team.openMemoCount}
                </span>
              )}
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: valKleur,
                  flexShrink: 0,
                }}
                title={`Validatie: ${team.validatieStatus}`}
              />
            </div>
          </div>

          {/* Body */}
          <div
            className="ow-scroll"
            style={{ flex: 1, padding: "18px 20px", overflowY: "auto" }}
          >
            {/* Dames */}
            {team.spelersDames.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-tertiary)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  Dames <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>{team.spelersDames.length}</span>
                </div>
                {team.spelersDames.map((s) => (
                  <div
                    key={s.spelerId}
                    className="normaal-rij"
                    style={
                      {
                        "--status-color": "var(--sexe-v)",
                      } as React.CSSProperties
                    }
                  >
                    <SpelerAvatar
                      relCode={s.spelerId}
                      roepnaam={s.roepnaam}
                      achternaam={s.achternaam}
                      geslacht={s.geslacht}
                      size="md"
                      style={{
                        width: 40,
                        height: 52,
                        borderRadius: "4px 0 0 4px",
                        flexShrink: 0,
                      }}
                    />
                    <span className="nm">
                      {s.roepnaam} {s.tussenvoegsel ? `${s.tussenvoegsel} ` : ""}
                      {s.achternaam}
                    </span>
                    <div
                      className="leeft-col"
                      style={{ background: leeftijdGradient(s.korfbalLeeftijd) }}
                    >
                      <span className="lb">{Math.floor(s.korfbalLeeftijd)}</span>
                      <span className="ld">
                        .{String(Math.round((s.korfbalLeeftijd % 1) * 10))}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Heren */}
            {team.spelersHeren.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-tertiary)",
                    marginBottom: 10,
                    marginTop: team.spelersDames.length > 0 ? 14 : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  Heren <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>{team.spelersHeren.length}</span>
                </div>
                {team.spelersHeren.map((s) => (
                  <div
                    key={s.spelerId}
                    className="normaal-rij"
                    style={
                      {
                        "--status-color": "var(--sexe-h)",
                      } as React.CSSProperties
                    }
                  >
                    <SpelerAvatar
                      relCode={s.spelerId}
                      roepnaam={s.roepnaam}
                      achternaam={s.achternaam}
                      geslacht={s.geslacht}
                      size="md"
                      style={{
                        width: 40,
                        height: 52,
                        borderRadius: "4px 0 0 4px",
                        flexShrink: 0,
                      }}
                    />
                    <span className="nm">
                      {s.roepnaam} {s.tussenvoegsel ? `${s.tussenvoegsel} ` : ""}
                      {s.achternaam}
                    </span>
                    <div
                      className="leeft-col"
                      style={{ background: leeftijdGradient(s.korfbalLeeftijd) }}
                    >
                      <span className="lb">{Math.floor(s.korfbalLeeftijd)}</span>
                      <span className="ld">
                        .{String(Math.round((s.korfbalLeeftijd % 1) * 10))}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Staf */}
            {team.staf.length > 0 && (
              <>
                <div
                  style={{
                    height: 1,
                    background: "var(--border-light)",
                    margin: "14px 0",
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-tertiary)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  Staf <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>{team.staf.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {team.staf.map((s) => (
                    <div
                      key={s.stafId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 11,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 2,
                          background: "#a78bfa",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.naam}</span>
                      <span style={{ color: "var(--text-tertiary)" }}>— {s.rollen[0] ?? "—"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Validatie */}
            {team.validatieMeldingen && team.validatieMeldingen.length > 0 && (
              <>
                <div
                  style={{
                    height: 1,
                    background: "var(--border-light)",
                    margin: "14px 0",
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-tertiary)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  Validatie{" "}
                  <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>
                    {team.validatieMeldingen.length}
                  </span>
                </div>
                {team.validatieMeldingen.map((m, i) => {
                  const variant = valVariant(m);
                  return (
                    <div key={i} className={cx("val-item", variant)}>
                      <div className="icn">
                        {variant === "ok" ? "✓" : variant === "err" ? "✕" : "⚠"}
                      </div>
                      <div className="body">
                        <div className="regel">{m}</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Acties footer */}
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <button
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 7,
                background: "var(--surface-card)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "not-allowed",
                fontFamily: "inherit",
                opacity: 0.5,
              }}
              disabled
              title="Beschikbaar in iteratie C"
            >
              Bewerken
            </button>
            <button
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 7,
                background: "rgba(255,107,0,.15)",
                border: "1px solid rgba(255,107,0,.45)",
                color: "var(--ow-accent)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "not-allowed",
                fontFamily: "inherit",
                opacity: 0.5,
              }}
              disabled
              title="Beschikbaar in iteratie C"
            >
              Team openen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
