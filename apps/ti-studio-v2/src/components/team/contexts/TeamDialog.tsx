"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type {
  TeamKaartData,
  TeamReservering,
} from "@/app/(app)/(studio)/indeling/_components/werkbord-types";
import type { SpelerWerkitemDetail } from "@/components/personen/types";
import { SpelerAvatar } from "@/components/shared/SpelerAvatar";
import { MemoIcon } from "@/components/memo/MemoIcon";
import { logger } from "@oranje-wit/types";
import { maakReserveringInTeam, verwijderReservering } from "@/actions/reservering-actions";

// ── Helpers ──────────────────────────────────────────────────────────────────

const HERO_RGB: Record<string, string> = {
  rood: "220,38,38",
  oranje: "249,115,22",
  geel: "234,179,8",
  groen: "4,120,87",
  blauw: "29,78,216",
  senior: "148,163,184",
  senioren: "148,163,184",
};

const BAND_KLEUR: Record<string, string> = {
  rood: "var(--cat-rood)",
  oranje: "var(--cat-oranje)",
  geel: "var(--cat-geel)",
  groen: "var(--cat-groen)",
  blauw: "var(--cat-blauw)",
  senior: "var(--cat-senior)",
  senioren: "var(--cat-senior)",
};

function teamKleurRgb(team: TeamKaartData): string {
  const k = (team.kleur ?? team.categorie ?? "senior").toLowerCase();
  return HERO_RGB[k] ?? "148,163,184";
}

function teamBandKleur(team: TeamKaartData): string {
  const k = (team.kleur ?? team.categorie ?? "senior").toLowerCase();
  return BAND_KLEUR[k] ?? "var(--cat-senior)";
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

function werkitemStatusStijl(status: string): { bg: string; border: string; color: string } {
  switch (status) {
    case "OPEN":
      return {
        bg: "rgba(234,179,8,.12)",
        border: "rgba(234,179,8,.3)",
        color: "var(--memo-bespreking, #fde047)",
      };
    case "IN_BESPREKING":
      return {
        bg: "rgba(249,115,22,.12)",
        border: "rgba(249,115,22,.3)",
        color: "#f97316",
      };
    case "OPGELOST":
      return {
        bg: "rgba(16,185,129,.12)",
        border: "rgba(16,185,129,.3)",
        color: "var(--val-ok, #10b981)",
      };
    case "RISICO":
      return {
        bg: "rgba(239,68,68,.12)",
        border: "rgba(239,68,68,.3)",
        color: "var(--val-err, #ef4444)",
      };
    default:
      return {
        bg: "rgba(100,100,100,.2)",
        border: "var(--border-default, rgba(255,255,255,.12))",
        color: "var(--text-tertiary)",
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

type TabId = "overzicht" | "validatie" | "notities";

// ── Reservering sub-componenten ───────────────────────────────────────────────

function ReserveringRij({
  reservering,
  onVerwijder,
  isPending,
}: {
  reservering: import("@/app/(app)/(studio)/indeling/_components/werkbord-types").TeamReservering;
  onVerwijder: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 6px",
        borderRadius: 5,
        border: "1px dashed rgba(255,255,255,.12)",
        background: "rgba(255,255,255,.02)",
        opacity: isPending ? 0.5 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {/* Placeholder-avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          background: "rgba(255,255,255,.06)",
          border: "1px dashed rgba(255,255,255,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 10,
          color: "var(--text-muted)",
        }}
      >
        ?
      </div>

      {/* Naam italic */}
      <span
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: 500,
          fontStyle: "italic",
          color: "var(--text-tertiary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {reservering.titel}
      </span>

      {/* RES-badge */}
      <span
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          padding: "1px 4px",
          borderRadius: 3,
          border: "1px dashed rgba(255,255,255,.15)",
          flexShrink: 0,
        }}
      >
        RES
      </span>

      {/* × verwijder-knop */}
      <button
        onClick={() => onVerwijder(reservering.id)}
        disabled={isPending}
        aria-label="Reservering verwijderen"
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: isPending ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          flexShrink: 0,
          transition: "color 0.1s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--val-err, #ef4444)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
        }}
      >
        <svg
          width="12"
          height="12"
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
    </div>
  );
}

function ReserveringToevoegenKnop({
  geslacht,
  onToevoegen,
  isPending,
}: {
  geslacht: "M" | "V";
  onToevoegen: (geslacht: "M" | "V") => void;
  isPending: boolean;
}) {
  return (
    <button
      onClick={() => onToevoegen(geslacht)}
      disabled={isPending}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 6,
        padding: "4px 8px",
        background: "none",
        border: "1px dashed rgba(255,255,255,.15)",
        borderRadius: 5,
        color: "var(--text-tertiary)",
        fontSize: 11,
        fontWeight: 600,
        cursor: isPending ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        width: "100%",
        justifyContent: "center",
        opacity: isPending ? 0.5 : 1,
        transition: "border-color 0.1s, color 0.1s, opacity 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isPending) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.3)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.15)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1, fontWeight: 700 }}>+</span>
      Reservering
    </button>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface TeamDialogProps {
  team: TeamKaartData | null;
  open: boolean;
  onClose: () => void;
}

export function TeamDialog({ team, open, onClose }: TeamDialogProps) {
  const [actieveTab, setActieveTab] = useState<TabId>("overzicht");
  const dialogRef = useRef<HTMLDivElement>(null);
  const [reserveringen, setReserveringen] = useState<TeamReservering[]>(team?.reserveringen ?? []);
  const [isPending, startTransition] = useTransition();

  // Reset tab en reserveringen bij nieuw team
  useEffect(() => {
    if (open) {
      setActieveTab("overzicht");
      setReserveringen(team?.reserveringen ?? []);
    }
  }, [open, team?.id, team?.reserveringen]);

  // Escape sluit
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  // Focus bij open
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  function handleVoegReserveringToe(geslacht: "M" | "V") {
    if (!team) return;
    // Optimistische placeholder
    const placeholder: TeamReservering = {
      id: `_opt_${Date.now()}`,
      titel: geslacht === "V" ? "Reservering dames" : "Reservering heren",
      geslacht,
    };
    setReserveringen((prev) => [...prev, placeholder]);

    startTransition(async () => {
      const result = await maakReserveringInTeam({ teamId: team.id, geslacht });
      if (result.ok) {
        setReserveringen((prev) => prev.map((r) => (r.id === placeholder.id ? result.data : r)));
      } else {
        logger.warn("maakReserveringInTeam mislukt:", result.error);
        setReserveringen((prev) => prev.filter((r) => r.id !== placeholder.id));
      }
    });
  }

  function handleVerwijderReservering(id: string) {
    // Optimistisch verwijderen
    setReserveringen((prev) => prev.filter((r) => r.id !== id));

    startTransition(async () => {
      const result = await verwijderReservering(id);
      if (!result.ok) {
        logger.warn("verwijderReservering mislukt:", result.error);
        // Kan niet terugzetten zonder de originele data — log volstaat
      }
    });
  }

  if (!open || !team) return null;

  const rgb = teamKleurRgb(team);
  const bandKleur = teamBandKleur(team);
  const valVariantHero =
    team.validatieStatus === "OK" ? "ok" : team.validatieStatus === "FOUT" ? "err" : "warn";
  const aantalSpelers = team.spelersDames.length + team.spelersHeren.length;
  const aantalValidatie = team.validatieMeldingen?.length ?? 0;
  const werkitems: SpelerWerkitemDetail[] = team.werkitemsDetail ?? [];
  const aantalNotities = werkitems.length > 0 ? werkitems.length : team.openMemoCount;

  // Berekende stats
  const gemLeeftijd =
    team.gemKorfbalLeeftijd ??
    (aantalSpelers > 0
      ? [...team.spelersDames, ...team.spelersHeren].reduce(
          (acc, s) => acc + s.korfbalLeeftijd,
          0
        ) / aantalSpelers
      : null);

  const panelLabelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-tertiary)",
    marginBottom: 12,
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

        {/* ─── Hero met kleur-gradient ─── */}
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
          {/* 6px kleurband links */}
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
            {/* Naam */}
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

            {/* Sub-line: achttal · kleur · niveau */}
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
              {["Achttal", team.kleur, team.niveau].filter(Boolean).join(" · ")}
            </div>

            {/* Stats-rij */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 8,
                fontSize: 11,
              }}
            >
              {/* Dames */}
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

              {/* Heren */}
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

              {/* Validatie-badge */}
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

              {/* Memo-flag */}
              {team.openMemoCount > 0 && (
                <MemoIcon
                  count={team.openMemoCount}
                  kleur="var(--ow-accent)"
                  size={13}
                  style={{ fontSize: 11, fontWeight: 900 }}
                />
              )}
            </div>
          </div>

          {/* Val-dot */}
          <span
            className={`tk-val-dot ${valVariantHero}`}
            style={{ width: 20, height: 20, flexShrink: 0 }}
            title={`Validatie: ${team.validatieStatus}`}
          />
        </div>

        {/* ─── Tab-balk ─── */}
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
              { id: "overzicht", label: "Overzicht", count: 0 },
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

        {/* ─── Tab body ─── */}
        <div className="ow-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* ═══ TAB: OVERZICHT ═══ */}
          {actieveTab === "overzicht" && (
            <>
              {/* Panel-label */}
              <div style={panelLabelStyle}>
                {aantalSpelers} spelers
                {gemLeeftijd != null && ` · gem. leeftijd ${gemLeeftijd.toFixed(1)}`}
                {team.ussScore != null && ` · USS ${team.ussScore.toFixed(1)}`}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Dames-kolom */}
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
                          style={{ width: 28, height: 28, borderRadius: 4, flexShrink: 0 }}
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
                        {s.memoStatus && <MemoIcon kleur="var(--ow-accent)" size={11} />}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#fff",
                            padding: "2px 5px",
                            borderRadius: 3,
                            background: leeftijdGradient(s.korfbalLeeftijd),
                            fontVariantNumeric: "tabular-nums",
                            flexShrink: 0,
                          }}
                        >
                          {Math.floor(s.korfbalLeeftijd)}
                        </span>
                      </div>
                    ))}

                    {/* Reservering-rijen dames */}
                    {reserveringen
                      .filter((r) => r.geslacht === "V")
                      .map((r) => (
                        <ReserveringRij
                          key={r.id}
                          reservering={r}
                          onVerwijder={handleVerwijderReservering}
                          isPending={isPending && r.id.startsWith("_opt_")}
                        />
                      ))}
                  </div>

                  {/* + Reservering knop dames */}
                  <ReserveringToevoegenKnop
                    geslacht="V"
                    onToevoegen={handleVoegReserveringToe}
                    isPending={isPending}
                  />
                </div>

                {/* Heren-kolom */}
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
                          style={{ width: 28, height: 28, borderRadius: 4, flexShrink: 0 }}
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
                        {s.memoStatus && <MemoIcon kleur="var(--ow-accent)" size={11} />}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#fff",
                            padding: "2px 5px",
                            borderRadius: 3,
                            background: leeftijdGradient(s.korfbalLeeftijd),
                            fontVariantNumeric: "tabular-nums",
                            flexShrink: 0,
                          }}
                        >
                          {Math.floor(s.korfbalLeeftijd)}
                        </span>
                      </div>
                    ))}

                    {/* Reservering-rijen heren */}
                    {reserveringen
                      .filter((r) => r.geslacht === "M")
                      .map((r) => (
                        <ReserveringRij
                          key={r.id}
                          reservering={r}
                          onVerwijder={handleVerwijderReservering}
                          isPending={isPending && r.id.startsWith("_opt_")}
                        />
                      ))}
                  </div>

                  {/* + Reservering knop heren */}
                  <ReserveringToevoegenKnop
                    geslacht="M"
                    onToevoegen={handleVoegReserveringToe}
                    isPending={isPending}
                  />
                </div>

                {/* Staf-blok */}
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
                  {team.ussScore != null && (
                    <span>
                      USS{" "}
                      <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                        {team.ussScore.toFixed(1)}
                      </span>
                    </span>
                  )}
                  {gemLeeftijd != null && (
                    <span>
                      Gem.{" "}
                      <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                        {gemLeeftijd.toFixed(1)}j
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══ TAB: VALIDATIE ═══ */}
          {actieveTab === "validatie" && (
            <>
              <div style={panelLabelStyle}>Validatie-meldingen</div>

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
                  ✓ Geen validatie-meldingen
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {team.validatieMeldingen?.map((m, i) => {
                    const v = valVariant(m);
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "10px 12px",
                          background: "var(--surface-sunken)",
                          border: "1px solid var(--border-light)",
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            lineHeight: 1.4,
                            flexShrink: 0,
                            color:
                              v === "ok"
                                ? "var(--val-ok)"
                                : v === "err"
                                  ? "var(--val-err)"
                                  : "var(--val-warn)",
                          }}
                        >
                          {v === "ok" ? "✓" : v === "err" ? "✕" : "⚠"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--text-primary)",
                            }}
                          >
                            {m}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ═══ TAB: NOTITIES / WERKITEMS ═══ */}
          {actieveTab === "notities" && (
            <>
              <div style={panelLabelStyle}>Notities / werkitems</div>

              {/* + Nieuw werkitem knop */}
              <button
                onClick={() => logger.info("team-werkitem-create: backlog-punt 3")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: "rgba(255,107,0,.12)",
                  color: "var(--ow-accent)",
                  border: "1px solid rgba(255,107,0,.3)",
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
                  Geen werkitems voor dit team.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {werkitems.map((item) => {
                    const statusStijl = werkitemStatusStijl(item.status);
                    const iconKleur = werkitemIconKleur(item.status);

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "10px 12px",
                          background: "var(--surface-sunken)",
                          border: "1px solid var(--border-light)",
                          borderRadius: 8,
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
                              gap: 8,
                              marginBottom: 3,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
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
                                padding: "2px 7px",
                                borderRadius: 4,
                                fontSize: 8,
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
                                fontSize: 11,
                                color: "var(--text-secondary)",
                                lineHeight: 1.5,
                              }}
                            >
                              {item.beschrijving}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
