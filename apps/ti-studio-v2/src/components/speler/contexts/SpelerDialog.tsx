"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { SpelerRijData } from "@/components/personen/types";
import { HeroHeader } from "@/components/speler/contexts/HeroHeader";
import { createPortal } from "react-dom";
import { updateSpelerStatus, updateSpelerIndeling } from "@/actions/speler-actions";
import { logger } from "@oranje-wit/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

export type TabId = "pad" | "kenmerken" | "evaluaties" | "werkitems";

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

// ── Status config (gedeeld met StatusCel) ─────────────────────────────────

const STATUS_CONFIG_HERO: Record<string, { label: string }> = {
  BESCHIKBAAR: { label: "Beschikbaar" },
  TWIJFELT: { label: "Twijfelt" },
  GEBLESSEERD: { label: "Geblesseerd" },
  GAAT_STOPPEN: { label: "Stopt" },
  GESTOPT: { label: "Gestopt" },
  NIEUW_POTENTIEEL: { label: "Nieuw potentieel" },
  NIEUW_DEFINITIEF: { label: "Nieuw definitief" },
  ALGEMEEN_RESERVE: { label: "Alg. reserve" },
  RECREANT: { label: "Recreant" },
  NIET_SPELEND: { label: "Niet spelend" },
};

// ── Component ────────────────────────────────────────────────────────────────

interface SpelerDialogProps {
  speler: SpelerRijData;
  initialTab?: TabId;
  actieveVersieId?: string;
  teams?: Array<{ id: string; naam: string; kleur: string | null }>;
  onClose: () => void;
}

export function SpelerDialog({
  speler,
  initialTab = "pad",
  actieveVersieId,
  teams = [],
  onClose,
}: SpelerDialogProps) {
  const [actieveTab, setActieveTab] = useState<TabId>(initialTab);
  const [statusEdit, setStatusEdit] = useState(false);
  const [huidigStatus, setHuidigStatus] = useState(speler.status);
  const [indelingEdit, setIndelingEdit] = useState(false);
  const [huidigIndelingTeamId, setHuidigIndelingTeamId] = useState(speler.indelingTeamId);
  const [huidigIndelingTeamNaam, setHuidigIndelingTeamNaam] = useState(speler.indelingTeamNaam);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (statusEdit) {
          setStatusEdit(false);
          return;
        }
        if (indelingEdit) {
          setIndelingEdit(false);
          return;
        }
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, statusEdit, indelingEdit]);

  const handleStatusChange = (newStatus: string) => {
    const vorige = huidigStatus;
    setHuidigStatus(newStatus);
    setStatusEdit(false);
    startTransition(async () => {
      const result = await updateSpelerStatus({
        spelerId: speler.id,
        status: newStatus as never,
      });
      if (!result.ok) {
        logger.warn("SpelerDialog: status update mislukt:", result.error);
        setHuidigStatus(vorige);
      }
    });
  };

  const handleIndelingChange = (newTeamId: string) => {
    if (!actieveVersieId) return;
    const vorigeId = huidigIndelingTeamId;
    const vorigeNaam = huidigIndelingTeamNaam;
    const nyNaam = teams.find((t) => t.id === newTeamId)?.naam ?? null;
    setHuidigIndelingTeamId(newTeamId || null);
    setHuidigIndelingTeamNaam(nyNaam);
    setIndelingEdit(false);
    startTransition(async () => {
      const result = await updateSpelerIndeling({
        spelerId: speler.id,
        versieId: actieveVersieId,
        teamId: newTeamId || null,
      });
      if (!result.ok) {
        logger.warn("SpelerDialog: indeling update mislukt:", result.error);
        setHuidigIndelingTeamId(vorigeId);
        setHuidigIndelingTeamNaam(vorigeNaam);
      }
    });
  };

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
              status: huidigStatus as import("@oranje-wit/database").SpelerStatus,
              isNieuw: speler.isNieuw,
              hasFoto: speler.hasFoto,
              memoStatus: speler.memoStatus,
              huidigTeam: speler.huidigTeam,
              indelingTeam: huidigIndelingTeamNaam,
            }}
            onStatusClick={() => {
              setIndelingEdit(false);
              setStatusEdit((v) => !v);
            }}
            onIndelingClick={
              actieveVersieId && teams.length > 0
                ? () => {
                    setStatusEdit(false);
                    setIndelingEdit((v) => !v);
                  }
                : undefined
            }
            onMemoClick={() => setActieveTab("werkitems")}
          />

          {/* Status-dropdown — inline onder de hero chip */}
          {statusEdit && (
            <div
              style={{
                position: "absolute",
                top: 76,
                left: 152,
                zIndex: 50,
                background: "var(--surface-card, #1a1a2e)",
                border: "1px solid var(--ow-accent)",
                borderRadius: 8,
                padding: "6px 0",
                minWidth: 180,
                boxShadow: "0 8px 24px rgba(0,0,0,.6)",
              }}
            >
              {Object.entries(STATUS_CONFIG_HERO).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  disabled={isPending}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 16px",
                    background: huidigStatus === key ? "rgba(255,107,0,.12)" : "none",
                    border: "none",
                    color: huidigStatus === key ? "var(--ow-accent)" : "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: huidigStatus === key ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          )}

          {/* Indeling-dropdown — inline onder de indeling badge */}
          {indelingEdit && actieveVersieId && (
            <div
              style={{
                position: "absolute",
                top: 120,
                left: 152,
                zIndex: 50,
                background: "var(--surface-card, #1a1a2e)",
                border: "1px solid var(--ow-accent)",
                borderRadius: 8,
                padding: "6px 0",
                minWidth: 180,
                boxShadow: "0 8px 24px rgba(0,0,0,.6)",
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              <button
                onClick={() => handleIndelingChange("")}
                disabled={isPending}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 16px",
                  background: !huidigIndelingTeamId ? "rgba(255,107,0,.12)" : "none",
                  border: "none",
                  borderBottom: "1px solid var(--border-light)",
                  color: !huidigIndelingTeamId ? "var(--ow-accent)" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                — geen team —
              </button>
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleIndelingChange(t.id)}
                  disabled={isPending}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 16px",
                    background: huidigIndelingTeamId === t.id ? "rgba(255,107,0,.12)" : "none",
                    border: "none",
                    color:
                      huidigIndelingTeamId === t.id ? "var(--ow-accent)" : "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: huidigIndelingTeamId === t.id ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t.naam}
                </button>
              ))}
            </div>
          )}
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
