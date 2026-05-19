"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { SpelerRijData, SpelerWerkitemDetail } from "@/components/personen/types";
import { HeroHeader } from "@/components/speler/contexts/HeroHeader";
import { MemoIcon } from "@/components/memo/MemoIcon";
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

// ── Lokale helpers ────────────────────────────────────────────────────────────

const MAANDEN_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function formatGeboortedatum(datum: Date, leeftijd: number): string {
  const dag = datum.getDate();
  const maand = MAANDEN_NL[datum.getMonth()];
  const jaar = datum.getFullYear();
  const leeftijdJaren = Math.floor(leeftijd);
  return `${dag} ${maand} ${jaar} · ${leeftijdJaren} jaar`;
}

function relatiefDatum(datum: Date): string {
  const nu = new Date();
  const diffMs = nu.getTime() - datum.getTime();
  const diffDagen = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDagen < 7) return `${diffDagen} dag${diffDagen === 1 ? "" : "en"} geleden`;
  if (diffDagen < 14) return "vorige week";
  const diffWeken = Math.floor(diffDagen / 7);
  if (diffDagen < 365) return `${diffWeken} weken geleden`;
  return "langer dan een jaar";
}

function werkitemStatusLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "IN_BESPREKING":
      return "In bespreking";
    case "OPGELOST":
      return "Opgelost";
    case "RISICO":
      return "Risico";
    default:
      return status;
  }
}

function werkitemStatusStijl(status: string): {
  bg: string;
  border: string;
  color: string;
  cssClass: string;
} {
  switch (status) {
    case "OPEN":
      return {
        bg: "rgba(253,224,71,.12)",
        border: "rgba(253,224,71,.3)",
        color: "var(--memo-open, #fde047)",
        cssClass: "open",
      };
    case "IN_BESPREKING":
      return {
        bg: "rgba(250,204,21,.12)",
        border: "rgba(250,204,21,.3)",
        color: "var(--memo-bespreking, #facc15)",
        cssClass: "bespreking",
      };
    case "OPGELOST":
      return {
        bg: "rgba(100,100,100,.2)",
        border: "var(--border-default, rgba(255,255,255,.12))",
        color: "var(--text-tertiary)",
        cssClass: "opgelost",
      };
    case "RISICO":
      return {
        bg: "rgba(239,68,68,.12)",
        border: "rgba(239,68,68,.3)",
        color: "var(--val-err, #ef4444)",
        cssClass: "risico",
      };
    default:
      return {
        bg: "rgba(100,100,100,.2)",
        border: "var(--border-default, rgba(255,255,255,.12))",
        color: "var(--text-tertiary)",
        cssClass: "opgelost",
      };
  }
}

function werkitemIconKleur(status: string): string {
  switch (status) {
    case "OPEN":
      return "var(--memo-open, #fde047)";
    case "IN_BESPREKING":
      return "var(--memo-bespreking, #facc15)";
    case "RISICO":
      return "var(--val-err, #ef4444)";
    default:
      return "var(--text-tertiary)";
  }
}

// ── Hero subtitle helper ───────────────────────────────────────────────────────

function buildHeroSubtitle(
  id: string,
  lidSinds?: string | null,
  seizoenenActief?: number | null
): string {
  const parts: string[] = [];

  if (lidSinds) {
    // Jaar extracten uit ISO-string of jaar-string
    const jaar = lidSinds.includes("-") ? lidSinds.split("-")[0] : lidSinds;
    let deel = `lid sinds ${jaar}`;
    if (seizoenenActief != null) {
      deel += ` · ${seizoenenActief} seizoenen actief`;
    }
    parts.push(deel);
  }

  parts.push(`rel-code ${id}`);
  return parts.join(" · ");
}

// ── Component ────────────────────────────────────────────────────────────────

interface SpelerDialogProps {
  speler: SpelerRijData & {
    lidSinds?: string | null;
    seizoenenActief?: number | null;
    laatstGezien?: Date | null;
    werkitemsDetail?: SpelerWerkitemDetail[];
  };
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
  const werkitems = speler.werkitemsDetail ?? [];
  const heroSubtitle = buildHeroSubtitle(speler.id, speler.lidSinds, speler.seizoenenActief);

  // Panel-stijl helpers
  const panelTitleStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-tertiary)",
    margin: "0 0 14px",
  };

  const kenmerkRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid var(--border-light)",
  };

  const kenmerkLblStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-tertiary)",
    width: 140,
    flexShrink: 0,
  };

  const kenmerkValStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  };

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

          {/* Hero subtitle: lid sinds · seizoenen · rel-code */}
          <div
            style={{
              fontSize: 13,
              color: "var(--text-tertiary)",
              marginTop: -2,
              padding: "0 28px 12px",
            }}
          >
            {heroSubtitle}
          </div>

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
              <div style={panelTitleStyle}>Spelerspad</div>
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
              <div style={panelTitleStyle}>Persoonsgegevens</div>

              {/* Geboortedatum */}
              <div style={kenmerkRowStyle}>
                <div style={kenmerkLblStyle}>Geboortedatum</div>
                <div style={kenmerkValStyle}>
                  {speler.geboortedatum
                    ? formatGeboortedatum(speler.geboortedatum, speler.leeftijd)
                    : `${Math.floor(speler.leeftijd)} jaar`}
                </div>
              </div>

              {/* Korfballeeftijd */}
              <div style={kenmerkRowStyle}>
                <div style={kenmerkLblStyle}>Korfballeeftijd</div>
                <div style={kenmerkValStyle}>{speler.korfbalLeeftijd}</div>
              </div>

              {/* Sportlink rel-code */}
              <div style={kenmerkRowStyle}>
                <div style={kenmerkLblStyle}>Sportlink rel-code</div>
                <div style={kenmerkValStyle}>{speler.id.startsWith("OW-") ? "—" : speler.id}</div>
              </div>

              {/* Lid sinds — alleen tonen als lidSinds beschikbaar */}
              {speler.lidSinds && (
                <div style={kenmerkRowStyle}>
                  <div style={kenmerkLblStyle}>Lid sinds</div>
                  <div style={kenmerkValStyle}>
                    {speler.lidSinds.includes("-")
                      ? speler.lidSinds.split("-")[0]
                      : speler.lidSinds}
                    {speler.seizoenenActief != null
                      ? ` · ${speler.seizoenenActief} seizoenen actief`
                      : ""}
                  </div>
                </div>
              )}

              {/* Laatst gezien — alleen tonen als data beschikbaar, geen border-bottom op laatste rij */}
              {speler.laatstGezien && (
                <div style={{ ...kenmerkRowStyle, borderBottom: "none" }}>
                  <div style={kenmerkLblStyle}>Laatst gezien</div>
                  <div style={kenmerkValStyle}>{relatiefDatum(speler.laatstGezien)}</div>
                </div>
              )}
            </div>
          )}

          {/* ── EVALUATIES ── */}
          {actieveTab === "evaluaties" && (
            <div>
              <div style={panelTitleStyle}>Evaluaties</div>
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
              <div style={panelTitleStyle}>
                Werkitems
                {werkitems.length > 0
                  ? ` · ${werkitems.filter((w) => w.status === "OPEN" || w.status === "IN_BESPREKING").length} open`
                  : ""}
              </div>

              {/* + Nieuw werkitem knop */}
              <button
                onClick={() => logger.info("werkitem-create: backlog-punt 3")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: "rgba(255,107,0,.12)",
                  color: "var(--ow-accent)",
                  border: "1px solid var(--indeling-border, rgba(255,107,0,.3))",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 14,
                  fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>+</span>
                Nieuw werkitem
              </button>

              {werkitems.length === 0 ? (
                <div
                  style={{
                    padding: "16px 0",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                  }}
                >
                  Geen werkitems voor deze speler.
                </div>
              ) : (
                werkitems.map((item) => {
                  const statusStijl = werkitemStatusStijl(item.status);
                  const iconKleur = werkitemIconKleur(item.status);
                  const prioPrio = item.prioriteit === "HOOG" ? "prio-hoog" : "prio-middel";

                  return (
                    <div
                      key={item.id}
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
                      {/* Memo-icon */}
                      <div style={{ flexShrink: 0, paddingTop: 2 }}>
                        <MemoIcon kleur={iconKleur} size={18} />
                      </div>

                      {/* Body */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Titel + status-pill */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
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
                            {item.titel}
                          </div>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              flexShrink: 0,
                              background: statusStijl.bg,
                              color: statusStijl.color,
                              border: `1px solid ${statusStijl.border}`,
                            }}
                          >
                            {werkitemStatusLabel(item.status)}
                          </span>
                        </div>

                        {/* Beschrijving */}
                        {item.beschrijving && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              lineHeight: 1.55,
                              marginBottom: 8,
                            }}
                          >
                            {item.beschrijving}
                          </div>
                        )}

                        {/* Meta: type-tag, prio-tag, auteur, datum */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            fontSize: 10,
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {/* Type-tag */}
                          <span
                            style={{
                              padding: "1px 6px",
                              borderRadius: 3,
                              background: "var(--surface-card)",
                              border: "1px solid var(--border-default, rgba(255,255,255,.12))",
                              fontWeight: 600,
                              fontSize: 9,
                              textTransform: "uppercase",
                            }}
                          >
                            {item.type}
                          </span>

                          {/* Prioriteit-tag */}
                          <span
                            style={{
                              padding: "1px 6px",
                              borderRadius: 3,
                              background: "var(--surface-card)",
                              border:
                                item.prioriteit === "HOOG"
                                  ? "1px solid var(--status-twijfelt, #f59e0b)"
                                  : "1px solid var(--border-default, rgba(255,255,255,.12))",
                              color:
                                item.prioriteit === "HOOG"
                                  ? "var(--status-twijfelt, #f59e0b)"
                                  : "var(--text-secondary)",
                              fontWeight: 600,
                              fontSize: 9,
                              textTransform: "uppercase",
                            }}
                            data-prio={prioPrio}
                          >
                            {item.prioriteit === "HOOG"
                              ? "Hoog"
                              : item.prioriteit === "MIDDEL"
                                ? "Middel"
                                : "Laag"}
                          </span>

                          {/* Auteur + datum */}
                          <span>
                            {relatiefDatum(item.createdAt)} · {item.auteurNaam}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
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
