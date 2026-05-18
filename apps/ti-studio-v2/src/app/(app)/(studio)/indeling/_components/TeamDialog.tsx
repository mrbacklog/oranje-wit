"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TeamKaartData } from "./werkbord-types";
import { SpelerAvatar } from "@/components/shared/SpelerAvatar";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const HERO_RGB: Record<string, string> = {
  rood: "220,38,38",
  ROOD: "220,38,38",
  oranje: "249,115,22",
  ORANJE: "249,115,22",
  geel: "234,179,8",
  GEEL: "234,179,8",
  groen: "4,120,87",
  GROEN: "4,120,87",
  blauw: "29,78,216",
  BLAUW: "29,78,216",
  senior: "148,163,184",
  SENIOR: "148,163,184",
  SENIOREN: "148,163,184",
};

const BAND_KLEUR: Record<string, string> = {
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
  senior: "var(--cat-senior)",
  SENIOR: "var(--cat-senior)",
  SENIOREN: "var(--cat-senior)",
};

const VAL_KLEUREN: Record<string, string> = {
  OK: "var(--val-ok)",
  WAARSCHUWING: "var(--val-warn)",
  FOUT: "var(--val-err)",
  ONBEKEND: "var(--border-default)",
};

function teamKleurRgb(team: TeamKaartData): string {
  const k = team.kleur?.toUpperCase() ?? team.categorie?.toUpperCase() ?? "SENIOR";
  return HERO_RGB[k] ?? HERO_RGB[team.kleur ?? ""] ?? "148,163,184";
}

function teamBandKleur(team: TeamKaartData): string {
  const k = team.kleur ?? team.categorie ?? "senior";
  return BAND_KLEUR[k] ?? BAND_KLEUR[k.toUpperCase()] ?? "var(--cat-senior)";
}

function leeftijdGradient(leeftijd: number): string {
  const jaar = Math.max(4, Math.min(19, Math.floor(leeftijd)));
  return `var(--leeftijd-${jaar})`;
}

function valVariant(melding: string): "ok" | "warn" | "err" {
  const lower = melding.toLowerCase();
  if (lower.includes("fout") || lower.includes("niet") || lower.includes("te weinig")) return "err";
  if (lower.startsWith("ok") || lower.startsWith("✓") || lower.startsWith("goed")) return "ok";
  return "warn";
}

type TabId = "overzicht" | "validatie" | "notities";

// ── Component ────────────────────────────────────────────────────────────────

interface TeamDialogProps {
  team: TeamKaartData | null;
  open: boolean;
  onClose: () => void;
}

export function TeamDialog({ team, open, onClose }: TeamDialogProps) {
  const [actieveTab, setActieveTab] = useState<TabId>("overzicht");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset tab bij nieuw team
  useEffect(() => {
    if (open) setActieveTab("overzicht");
  }, [open, team?.id]);

  // Escape sluit
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open || !team) return null;

  const rgb = teamKleurRgb(team);
  const bandKleur = teamBandKleur(team);
  const valKleur = VAL_KLEUREN[team.validatieStatus ?? "ONBEKEND"] ?? "var(--border-default)";
  const valVariantHero =
    team.validatieStatus === "OK" ? "ok" : team.validatieStatus === "FOUT" ? "err" : "warn";
  const aantalSpelers = team.spelersDames.length + team.spelersHeren.length;
  const aantalValidatie = team.validatieMeldingen?.length ?? 0;
  const aantalNotities = team.openMemoCount;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.6)",
          zIndex: 10000,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Team: ${team.alias ?? team.naam}`}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 560,
          height: 640,
          maxWidth: "calc(96vw)",
          maxHeight: "calc(96vh)",
          background: "var(--surface-page)",
          border: "1px solid var(--border-light)",
          borderRadius: 14,
          boxShadow: "0 32px 80px rgba(0,0,0,.75), 0 8px 20px rgba(0,0,0,.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
          zIndex: 10001,
          outline: "none",
        }}
      >
        {/* Sluit-knop */}
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 7,
            background: "rgba(0,0,0,.4)",
            border: "1px solid rgba(255,255,255,.08)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Hero */}
        <div
          style={{
            position: "relative",
            padding: "22px 28px 18px 30px",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            gap: 18,
            background: `linear-gradient(135deg, rgba(${rgb},.15), rgba(${rgb},.08) 60%, transparent)`,
            flexShrink: 0,
          }}
        >
          {/* Kleurband links */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 6,
              background: bandKleur,
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
              }}
            >
              {team.alias ?? team.naam}
            </div>
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 8,
                fontSize: 11,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontWeight: 600,
                  color: "var(--sexe-v)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="8" r="6" />
                  <path d="M12 14v6M9 17h6" />
                </svg>
                {team.spelersDames.length} dames
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontWeight: 600,
                  color: "var(--sexe-h)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="10" cy="14" r="6" />
                  <path d="M20 4l-6 6M14 4h6v6" />
                </svg>
                {team.spelersHeren.length} heren
              </span>
              {aantalValidatie > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    background:
                      valVariantHero === "err" ? "rgba(239,68,68,.1)" : "rgba(234,179,8,.1)",
                    color: valVariantHero === "err" ? "var(--val-err)" : "var(--val-warn)",
                  }}
                >
                  ⚠ {aantalValidatie}
                </span>
              )}
              {team.openMemoCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--ow-accent)",
                    fontWeight: 900,
                  }}
                >
                  ▲ {team.openMemoCount}
                </span>
              )}
            </div>
          </div>

          {/* Val-dot */}
          <span
            className={cx("tk-val-dot", valVariantHero)}
            style={{ width: 20, height: 20 }}
            title={`Validatie: ${team.validatieStatus}`}
          />
        </div>

        {/* Tab-balk */}
        <div
          style={{
            display: "flex",
            padding: "0 26px",
            borderBottom: "1px solid var(--border-light)",
            background: "var(--surface-sunken)",
            flexShrink: 0,
          }}
        >
          {(
            [
              { id: "overzicht", label: "Overzicht", count: aantalSpelers },
              { id: "validatie", label: "Validatie", count: aantalValidatie },
              { id: "notities", label: "Notities", count: aantalNotities },
            ] as { id: TabId; label: string; count: number }[]
          ).map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActieveTab(id)}
              style={{
                position: "relative",
                padding: "0 18px",
                height: 42,
                background: "none",
                border: "none",
                color: actieveTab === id ? "var(--text-primary)" : "var(--text-tertiary)",
                fontSize: 13,
                fontWeight: actieveTab === id ? 700 : 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {label}
              {count > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 20,
                    height: 18,
                    padding: "0 6px",
                    borderRadius: 9,
                    background: actieveTab === id ? "rgba(255,107,0,.15)" : "var(--surface-card)",
                    color: actieveTab === id ? "var(--ow-accent)" : "var(--text-secondary)",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              )}
              {actieveTab === id && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -1,
                    left: 6,
                    right: 6,
                    height: 2,
                    background: "var(--ow-accent)",
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="ow-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* ═══ OVERZICHT ═══ */}
          {actieveTab === "overzicht" && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  marginBottom: 12,
                }}
              >
                {aantalSpelers} spelers
                {aantalSpelers > 0 && (
                  <>
                    {" "}
                    · gem.{" "}
                    {(
                      [...team.spelersDames, ...team.spelersHeren].reduce(
                        (acc, s) => acc + s.korfbalLeeftijd,
                        0
                      ) / aantalSpelers
                    ).toFixed(1)}
                  </>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {/* Dames */}
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 6,
                      borderBottom: "1px solid var(--border-light)",
                      marginBottom: 6,
                    }}
                  >
                    ♀ Dames{" "}
                    <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>
                      {team.spelersDames.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {team.spelersDames.map((s) => (
                      <div
                        key={s.spelerId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "5px 6px",
                          borderRadius: 5,
                        }}
                      >
                        <SpelerAvatar
                          relCode={s.spelerId}
                          roepnaam={s.roepnaam}
                          achternaam={s.achternaam}
                          geslacht={s.geslacht}
                          size="sm"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.roepnaam} {s.achternaam}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#fff",
                            padding: "2px 5px",
                            borderRadius: 3,
                            background: leeftijdGradient(s.korfbalLeeftijd),
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {Math.floor(s.korfbalLeeftijd)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heren */}
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 6,
                      borderBottom: "1px solid var(--border-light)",
                      marginBottom: 6,
                    }}
                  >
                    ♂ Heren{" "}
                    <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>
                      {team.spelersHeren.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {team.spelersHeren.map((s) => (
                      <div
                        key={s.spelerId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "5px 6px",
                          borderRadius: 5,
                        }}
                      >
                        <SpelerAvatar
                          relCode={s.spelerId}
                          roepnaam={s.roepnaam}
                          achternaam={s.achternaam}
                          geslacht={s.geslacht}
                          size="sm"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.roepnaam} {s.achternaam}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#fff",
                            padding: "2px 5px",
                            borderRadius: 3,
                            background: leeftijdGradient(s.korfbalLeeftijd),
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {Math.floor(s.korfbalLeeftijd)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staf */}
                {team.staf.length > 0 && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      paddingTop: 12,
                      borderTop: "1px dashed var(--border-light)",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      fontSize: 10,
                      color: "#c4b5fd",
                    }}
                  >
                    {team.staf.map((s) => (
                      <span
                        key={s.stafId}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2,
                            background: "#a78bfa",
                            display: "inline-block",
                          }}
                        />
                        {s.naam} — {s.rollen[0] ?? "—"}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer stats */}
                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    gap: 14,
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    paddingTop: 8,
                  }}
                >
                  <span>
                    Totaal{" "}
                    <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                      {aantalSpelers}
                    </span>
                  </span>
                  <span>
                    Dames{" "}
                    <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                      {team.spelersDames.length}
                    </span>
                  </span>
                  <span>
                    Heren{" "}
                    <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                      {team.spelersHeren.length}
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ═══ VALIDATIE ═══ */}
          {actieveTab === "validatie" && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  marginBottom: 12,
                }}
              >
                Validatie-meldingen
              </div>
              {aantalValidatie === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--val-ok)",
                    fontWeight: 600,
                  }}
                >
                  ✓ Geen validatie-problemen
                </div>
              ) : (
                team.validatieMeldingen?.map((m, i) => {
                  const v = valVariant(m);
                  return (
                    <div key={i} className={cx("val-item", v)}>
                      <div className="icn">{v === "ok" ? "✓" : v === "err" ? "✕" : "⚠"}</div>
                      <div className="body">
                        <div className="regel">{m}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ═══ NOTITIES / WERKITEMS ═══ */}
          {actieveTab === "notities" && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  marginBottom: 12,
                }}
              >
                Notities / werkitems
              </div>
              {team.openMemoCount === 0 ? (
                <div
                  style={{
                    padding: "20px 0",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    fontWeight: 500,
                  }}
                >
                  Geen werkitems voor dit team.
                </div>
              ) : (
                <div
                  style={{
                    padding: "10px 0",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {team.openMemoCount} open werkitem(s) — koppeling via memo-module beschikbaar in
                  een volgende iteratie.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
