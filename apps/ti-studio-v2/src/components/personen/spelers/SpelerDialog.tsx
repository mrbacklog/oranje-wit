"use client";

import { useEffect, useRef, useState } from "react";
import type { SpelerRijData } from "@/components/personen/types";
import { HeroHeader } from "@/components/speler/contexts/HeroHeader";
import { createPortal } from "react-dom";

// ── Helpers ──────────────────────────────────────────────────────────────────

type TabId = "pad" | "kenmerken" | "evaluaties" | "werkitems";

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GEBLESSEERD: "Geblesseerd",
  GAAT_STOPPEN: "Stopt",
  NIEUW_POTENTIEEL: "Nieuw lid",
  NIEUW_DEFINITIEF: "Nieuw lid",
  ALGEMEEN_RESERVE: "Alg. reserve",
  RECREANT: "Recreant",
  NIET_SPELEND: "Niet spelend",
};

// ── Component ────────────────────────────────────────────────────────────────

interface SpelerDialogProps {
  speler: SpelerRijData;
  onClose: () => void;
}

export function SpelerDialog({ speler, onClose }: SpelerDialogProps) {
  const [actieveTab, setActieveTab] = useState<TabId>("pad");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const aantalMemos = speler.heeftOpenMemo ? 1 : 0;

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
        aria-label={`Speler: ${speler.roepnaam} ${speler.achternaam}`}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 760,
          maxWidth: "calc(96vw)",
          maxHeight: "88vh",
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
        {/* ═══ HERO HEADER ═══ */}
        <div style={{ position: "relative" }}>
          {/* Sluit-knop zweeft over de hero */}
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
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
              backdropFilter: "blur(4px)",
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

          <HeroHeader
            speler={{
              relCode: speler.id,
              roepnaam: speler.roepnaam,
              tussenvoegsel: speler.tussenvoegsel,
              achternaam: speler.achternaam,
              geslacht: speler.geslacht,
              leeftijd: speler.leeftijd,
              leeftijdscategorie: speler.leeftijdscategorie,
              status: speler.status as import("@oranje-wit/database").SpelerStatus,
              isNieuw: speler.isNieuw,
              hasFoto: speler.hasFoto,
              memoStatus: speler.memoStatus,
              huidigTeam: speler.huidigTeam,
              indelingTeam: speler.indelingTeamNaam,
            }}
          />
        </div>

        {/* ═══ TAB BAR ═══ */}
        <div
          style={{
            display: "flex",
            padding: "0 22px",
            borderBottom: "1px solid var(--border-light)",
            background: "var(--surface-sunken)",
            flexShrink: 0,
          }}
        >
          {(
            [
              { id: "pad", label: "Spelerspad" },
              { id: "kenmerken", label: "Kenmerken" },
              { id: "evaluaties", label: "Evaluaties" },
              { id: "werkitems", label: "Werkitems", count: aantalMemos },
            ] as { id: TabId; label: string; count?: number }[]
          ).map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActieveTab(id)}
              style={{
                position: "relative",
                padding: "0 18px",
                height: 46,
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
              {count !== undefined && count > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 20,
                    height: 18,
                    padding: "0 6px",
                    borderRadius: 9,
                    background: actieveTab === id ? "rgba(253,224,71,.15)" : "var(--surface-card)",
                    color:
                      actieveTab === id ? "var(--memo-open, #fde047)" : "var(--text-secondary)",
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

        {/* ═══ TAB BODY ═══ */}
        <div
          className="ow-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            background: "var(--surface-page)",
            minHeight: 280,
            maxHeight: 420,
          }}
        >
          {/* ── SPELERSPAD ── */}
          {actieveTab === "pad" && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  marginBottom: 14,
                }}
              >
                Spelerspad
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "var(--ow-accent)",
                    boxShadow: "0 0 6px var(--ow-accent)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    fontWeight: 500,
                    width: 72,
                    flexShrink: 0,
                  }}
                >
                  Huidig
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    flex: 1,
                  }}
                >
                  {speler.huidigTeam ?? "Niet ingedeeld"}
                </span>
              </div>
              <div
                style={{
                  padding: "16px 0 8px",
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  fontStyle: "italic",
                }}
              >
                Historische seizoensdata wordt opgehaald via Sportlink-koppeling. Volledig
                spelerspad beschikbaar na data-koppeling in een volgende iteratie.
              </div>
            </div>
          )}

          {/* ── KENMERKEN ── */}
          {actieveTab === "kenmerken" && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  marginBottom: 14,
                }}
              >
                Persoonsgegevens
              </div>
              {[
                { label: "Geslacht", waarde: speler.geslacht === "M" ? "Heer" : "Dame" },
                { label: "Korfballeeftijd", waarde: speler.korfbalLeeftijd },
                { label: "Geboortejaar", waarde: String(speler.geboortejaar) },
                {
                  label: "Status",
                  waarde: STATUS_LABELS[speler.status] ?? speler.status,
                },
                {
                  label: "Huidig team",
                  waarde: speler.huidigTeam ?? "—",
                },
                {
                  label: "Indeling",
                  waarde: speler.indelingTeamNaam ?? "Niet ingedeeld",
                },
                {
                  label: "Leeftijdscategorie",
                  waarde: speler.leeftijdscategorie,
                },
              ].map(({ label, waarde }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text-tertiary)",
                      width: 140,
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {waarde}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── EVALUATIES ── */}
          {actieveTab === "evaluaties" && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  marginBottom: 14,
                }}
              >
                Evaluaties
              </div>
              <div
                style={{
                  padding: "16px 0",
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  fontStyle: "italic",
                }}
              >
                Evaluaties worden via de evaluatie-module bijgehouden in apps/web. Koppeling naar TI
                Studio beschikbaar in een volgende iteratie.
              </div>
            </div>
          )}

          {/* ── WERKITEMS ── */}
          {actieveTab === "werkitems" && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  marginBottom: 14,
                }}
              >
                Werkitems · {aantalMemos > 0 ? `${aantalMemos} open` : "geen open"}
              </div>

              {speler.heeftOpenMemo ? (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 14px",
                    background: "var(--surface-sunken)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 20,
                      color: "var(--memo-open, #fde047)",
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M5 3h10l4 4v14H5z" />
                      <path
                        d="M15 3v4h4M8 12h8M8 15h8M8 18h5"
                        stroke="var(--surface-sunken, #090910)"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        Open werkitem
                      </div>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          background: "rgba(253,224,71,.12)",
                          color: "var(--memo-open, #fde047)",
                          border: "1px solid rgba(253,224,71,.3)",
                        }}
                      >
                        Open
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        lineHeight: 1.55,
                      }}
                    >
                      Dit lid heeft een of meer open werkitems. Bekijk details in de memo-module.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "16px 0",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                  }}
                >
                  Geen open werkitems voor deze speler.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border-light)",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "1px solid var(--border-default, rgba(255,255,255,.12))",
              borderRadius: 7,
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sluiten
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
