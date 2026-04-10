"use client";

import { useEffect, useRef, useState } from "react";
import {
  getSpelerProfiel,
  updateSpelerMemo,
  updateSpelerStatus,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions";
import { logger } from "@oranje-wit/types";
import type { EvaluatieScore, TeamGemiddelde } from "@oranje-wit/types";
import type { MemoData } from "@/components/ti-studio/werkbord/types";
import { MemoPanel } from "@/components/ti-studio/MemoPanel";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

type SpelerProfiel = Awaited<ReturnType<typeof getSpelerProfiel>>;

type SpelerspadItem = {
  seizoen?: string;
  team?: string;
  kleur?: string;
  niveau?: string;
  spelvorm?: string;
  categorie?: string;
};

type HuidigTeam = {
  team?: string;
  categorie?: string;
  kleur?: string;
};

type VolgendSeizoen = {
  team?: string;
};

type EvaluatieItem = {
  seizoen: string;
  ronde: number;
  type: string;
  scores: EvaluatieScore;
  opmerking: string | null;
  coach: string | null;
  teamNaam: string | null;
};

type EvaluatiesData = {
  evaluaties: EvaluatieItem[];
  teamVergelijking: TeamGemiddelde | null;
};

type EvaluatiesResponse = {
  ok: boolean;
  data?: EvaluatiesData;
};

export interface SpelerProfielDialogProps {
  spelerId: string | null;
  open: boolean;
  onClose: () => void;
  teamId?: string;
}

// ──────────────────────────────────────────────────────────
// Design tokens (inline — tokens.css bestaat niet in worktree)
// ──────────────────────────────────────────────────────────

const T = {
  bg0: "#0a0a0a",
  bg1: "#141414",
  bg2: "#1e1e1e",
  bg3: "#262626",
  accent: "#ff6b00",
  accentDim: "rgba(255,107,0,.12)",
  accentBorder: "rgba(255,107,0,.4)",
  accentHover: "#ff8533",
  text1: "#fafafa",
  text2: "#a3a3a3",
  text3: "#666666",
  border0: "#262626",
  border1: "#3a3a3a",
  ok: "#22c55e",
  okDim: "rgba(34,197,94,.12)",
  okBorder: "rgba(34,197,94,.3)",
  warn: "#eab308",
  warnDim: "rgba(234,179,8,.12)",
  warnBorder: "rgba(234,179,8,.3)",
  err: "#ef4444",
  errDim: "rgba(239,68,68,.12)",
  errBorder: "rgba(239,68,68,.3)",
  pink: "#ec4899",
  pinkDim: "rgba(236,72,153,.15)",
  pinkBorder: "rgba(236,72,153,.35)",
  blue: "#60a5fa",
  blueDim: "rgba(96,165,250,.15)",
  blueBorder: "rgba(96,165,250,.35)",
  indigo: "#818cf8",
  indigoDim: "rgba(129,140,248,.15)",
  indigoBorder: "rgba(129,140,248,.35)",
};

// ──────────────────────────────────────────────────────────
// Status configuratie
// ──────────────────────────────────────────────────────────

type StatusKey =
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GAAT_STOPPEN"
  | "NIEUW_POTENTIEEL"
  | "NIEUW_DEFINITIEF"
  | "ALGEMEEN_RESERVE";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; kleur: string; bg: string; border: string }
> = {
  BESCHIKBAAR: { label: "Beschikbaar", kleur: T.ok, bg: T.okDim, border: T.okBorder },
  TWIJFELT: { label: "Twijfelt", kleur: T.warn, bg: T.warnDim, border: T.warnBorder },
  GAAT_STOPPEN: { label: "Stopt", kleur: T.err, bg: T.errDim, border: T.errBorder },
  NIEUW_POTENTIEEL: {
    label: "Nieuw (potentieel)",
    kleur: T.blue,
    bg: T.blueDim,
    border: T.blueBorder,
  },
  NIEUW_DEFINITIEF: {
    label: "Nieuw (definitief)",
    kleur: T.blue,
    bg: T.blueDim,
    border: T.blueBorder,
  },
  ALGEMEEN_RESERVE: { label: "Reserve", kleur: T.text2, bg: T.bg3, border: T.border1 },
};

const STATUSSEN = Object.keys(STATUS_CONFIG) as StatusKey[];

// ──────────────────────────────────────────────────────────
// Kleur-dot mapping
// ──────────────────────────────────────────────────────────

const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  paars: "#a855f7",
  grijs: "#6b7280",
};

// ──────────────────────────────────────────────────────────
// Hulpfuncties
// ──────────────────────────────────────────────────────────

function initialen(
  roepnaam: string | null | undefined,
  achternaam: string | null | undefined
): string {
  const v = (roepnaam ?? "").trim().charAt(0).toUpperCase();
  const a = (achternaam ?? "").trim().charAt(0).toUpperCase();
  return `${v}${a}`.trim() || "??";
}

function korfbalLeeftijd(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number | null | undefined
): string {
  const peildatum = new Date("2026-01-01");
  if (geboortedatum) {
    const geb = new Date(geboortedatum);
    const ms = peildatum.getTime() - geb.getTime();
    const jaren = ms / (365.25 * 24 * 3600 * 1000);
    return jaren.toFixed(2);
  }
  if (geboortejaar) {
    return String(2026 - geboortejaar);
  }
  return "—";
}

function leeftijdLabel(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number | null | undefined
): string {
  if (geboortedatum) {
    const geb = new Date(geboortedatum);
    const d = geb.getDate().toString().padStart(2, "0");
    const m = (geb.getMonth() + 1).toString().padStart(2, "0");
    const y = geb.getFullYear();
    return `${d}-${m}-${y}`;
  }
  if (geboortejaar) return String(geboortejaar);
  return "—";
}

// Groepeer evaluaties per seizoen
function groepeerEvaluaties(
  evaluaties: EvaluatieItem[]
): Array<{ seizoen: string; items: EvaluatieItem[] }> {
  const map = new Map<string, EvaluatieItem[]>();
  for (const ev of evaluaties) {
    const groep = map.get(ev.seizoen) ?? [];
    groep.push(ev);
    map.set(ev.seizoen, groep);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([seizoen, items]) => ({ seizoen, items }));
}

// Score-schaallabels
const INZET_LABELS: Record<number, string> = { 1: "Minder", 2: "Normaal", 3: "Meer" };
const GROEI_LABELS: Record<number, string> = { 1: "Geen", 2: "Weinig", 3: "Normaal", 4: "Veel" };

function inzetKleur(val: number): string {
  if (val >= 3) return T.ok;
  if (val === 2) return T.text2;
  return T.warn;
}
function groeiKleur(val: number): string {
  if (val >= 3) return T.ok;
  if (val === 2) return T.text2;
  return T.warn;
}
function niveauKleur(val: number): string {
  if (val >= 4) return T.accent;
  if (val >= 3) return T.warn;
  return T.err;
}

// ──────────────────────────────────────────────────────────
// Sub-componenten
// ──────────────────────────────────────────────────────────

function ScoreTrack({
  waarde,
  max,
  gemiddelde,
}: {
  waarde: number | null | undefined;
  max: number;
  gemiddelde?: number | null;
}) {
  const selfPct = waarde != null ? `${(waarde / max) * 100}%` : null;
  const avgPct = gemiddelde != null ? `${(gemiddelde / max) * 100}%` : null;

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        height: 16,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Achtergrond balk */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 4,
          background: T.bg3,
          borderRadius: 2,
        }}
      />
      {/* Teamgemiddelde lijn */}
      {avgPct && (
        <div
          style={{
            position: "absolute",
            left: avgPct,
            width: 2,
            height: 12,
            background: T.text3,
            borderRadius: 1,
            transform: "translateX(-50%)",
            top: "50%",
            marginTop: -6,
          }}
        />
      )}
      {/* Eigen score marker */}
      {selfPct && (
        <div
          style={{
            position: "absolute",
            left: selfPct,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: T.accent,
            border: `2px solid ${T.bg1}`,
            transform: "translateX(-50%)",
            top: "50%",
            marginTop: -5,
            zIndex: 2,
            boxShadow: "0 0 6px rgba(255,107,0,.5)",
          }}
        />
      )}
    </div>
  );
}

function ScoreLegenda() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 2,
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: T.text3 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: T.accent,
            flexShrink: 0,
          }}
        />
        Jij
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: T.text3 }}>
        <div
          style={{
            width: 2,
            height: 10,
            background: T.text3,
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
        Gem. team
      </div>
    </div>
  );
}

function EvalBlok({
  item,
  teamVergelijking,
}: {
  item: EvaluatieItem;
  teamVergelijking: TeamGemiddelde | null;
}) {
  const sc = item.scores;
  const niveauVal = sc.niveau ?? null;
  const inzetVal = sc.inzet ?? null;
  const groeiVal = sc.groei ?? null;

  return (
    <div
      style={{
        background: T.bg2,
        border: `1px solid ${T.border0}`,
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>Ronde {item.ronde}</div>
          <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>
            {[item.coach, item.teamNaam].filter(Boolean).join(" · ")}
          </div>
        </div>
        {niveauVal != null && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 20,
              background: niveauVal >= 4 ? T.okDim : T.warnDim,
              color: niveauVal >= 4 ? T.ok : T.warn,
              border: `1px solid ${niveauVal >= 4 ? T.okBorder : T.warnBorder}`,
            }}
          >
            Niveau {niveauVal}/5
          </div>
        )}
      </div>

      {/* Scores */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
        {/* Niveau */}
        {niveauVal != null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: T.text2,
                  width: 72,
                  flexShrink: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Niveau
              </div>
              <ScoreTrack waarde={niveauVal} max={5} gemiddelde={teamVergelijking?.niveau} />
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  width: 20,
                  textAlign: "right",
                  flexShrink: 0,
                  color: niveauKleur(niveauVal),
                }}
              >
                {niveauVal}
              </div>
              {teamVergelijking?.niveau != null && (
                <div style={{ fontSize: 10, color: T.text3, marginLeft: 4, flexShrink: 0 }}>
                  / gem {teamVergelijking.niveau.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inzet */}
        {inzetVal != null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: T.text2,
                  width: 72,
                  flexShrink: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Inzet
              </div>
              <ScoreTrack waarde={inzetVal} max={3} gemiddelde={teamVergelijking?.inzet} />
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  width: 44,
                  textAlign: "right",
                  flexShrink: 0,
                  color: inzetKleur(inzetVal),
                }}
              >
                {INZET_LABELS[inzetVal] ?? inzetVal}
              </div>
            </div>
          </div>
        )}

        {/* Groei */}
        {groeiVal != null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: T.text2,
                  width: 72,
                  flexShrink: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Groei
              </div>
              <ScoreTrack waarde={groeiVal} max={4} gemiddelde={teamVergelijking?.groei} />
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  width: 44,
                  textAlign: "right",
                  flexShrink: 0,
                  color: groeiKleur(groeiVal),
                }}
              >
                {GROEI_LABELS[groeiVal] ?? groeiVal}
              </div>
            </div>
          </div>
        )}
      </div>

      <ScoreLegenda />

      {/* Opmerking trainer */}
      {item.opmerking && (
        <>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: T.text3,
              marginBottom: 4,
            }}
          >
            Opmerking trainer
          </div>
          <div
            style={{
              fontSize: 11,
              color: T.text2,
              lineHeight: 1.5,
              padding: "8px 10px",
              background: T.bg3,
              borderRadius: 7,
              borderLeft: `2px solid ${T.border1}`,
              fontStyle: "italic",
              marginTop: 4,
            }}
          >
            {item.opmerking}
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Hoofd-component
// ──────────────────────────────────────────────────────────

export default function SpelerProfielDialog({
  spelerId,
  open,
  onClose,
  teamId,
}: SpelerProfielDialogProps) {
  const [profiel, setProfiel] = useState<SpelerProfiel>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pad" | "evaluaties" | "memo">("pad");

  // Status
  const [huidigStatus, setHuidigStatus] = useState<StatusKey>("BESCHIKBAAR");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusBezig, setStatusBezig] = useState(false);

  // Evaluaties
  const [evaluaties, setEvaluaties] = useState<EvaluatieItem[]>([]);
  const [teamVergelijking, setTeamVergelijking] = useState<TeamGemiddelde | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [openGroepen, setOpenGroepen] = useState<Set<string>>(new Set());

  // Memo
  const [memoData, setMemoData] = useState<MemoData>({
    tekst: "",
    memoStatus: "gesloten",
    besluit: null,
  });
  const [opslaanBezig, setOpslaanBezig] = useState(false);

  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Laad profiel
  useEffect(() => {
    if (!open || !spelerId) {
      setProfiel(null);
      setEvaluaties([]);
      setTeamVergelijking(null);
      return;
    }
    setLoading(true);
    setActiveTab("pad");
    getSpelerProfiel(spelerId)
      .then((data) => {
        setProfiel(data);
        setHuidigStatus((data?.status as StatusKey) ?? "BESCHIKBAAR");
        setMemoData({
          tekst: data?.notitie ?? "",
          memoStatus: (data?.memoStatus as MemoData["memoStatus"]) ?? "gesloten",
          besluit: (data as { besluit?: string | null })?.besluit ?? null,
        });
      })
      .catch((err: unknown) => {
        logger.error("SpelerProfielDialog: fout bij ophalen profiel", err);
      })
      .finally(() => setLoading(false));
  }, [open, spelerId]);

  // Laad evaluaties als tab actief wordt
  useEffect(() => {
    if (activeTab !== "evaluaties" || !spelerId) return;
    setEvalLoading(true);
    const url = `/api/teamindeling/spelers/${spelerId}/evaluaties${teamId ? `?teamId=${teamId}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((resp: EvaluatiesResponse) => {
        const evs = resp.data?.evaluaties ?? [];
        const tv = resp.data?.teamVergelijking ?? null;
        setEvaluaties(evs);
        setTeamVergelijking(tv);
        // Open meest recente seizoen standaard
        const groepen = groepeerEvaluaties(evs);
        if (groepen.length > 0) {
          setOpenGroepen(new Set([groepen[0].seizoen]));
        }
      })
      .catch((err: unknown) => {
        logger.error("SpelerProfielDialog: fout bij ophalen evaluaties", err);
      })
      .finally(() => setEvalLoading(false));
  }, [activeTab, spelerId, teamId]);

  // Escape sluit dialog
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (statusMenuOpen) {
          setStatusMenuOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, statusMenuOpen]);

  // Sluit status dropdown bij klik buiten
  useEffect(() => {
    if (!statusMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusMenuOpen]);

  async function selecteerStatus(nieuweStatus: StatusKey) {
    if (!spelerId || nieuweStatus === huidigStatus) {
      setStatusMenuOpen(false);
      return;
    }
    setStatusBezig(true);
    setStatusMenuOpen(false);
    try {
      await updateSpelerStatus(spelerId, nieuweStatus);
      setHuidigStatus(nieuweStatus);
    } catch (err) {
      logger.error("SpelerProfielDialog: fout bij status-update", err);
    } finally {
      setStatusBezig(false);
    }
  }

  async function slaMemoOp(data: MemoData) {
    if (!spelerId) return;
    setOpslaanBezig(true);
    try {
      const result = await updateSpelerMemo(spelerId, data);
      if (result.ok) {
        setMemoData(data);
      } else {
        logger.warn("SpelerProfielDialog: memo opslaan mislukt", result.error);
      }
    } catch (err) {
      logger.error("SpelerProfielDialog: fout bij opslaan memo", err);
    } finally {
      setOpslaanBezig(false);
    }
  }

  function toggleEvalGroep(seizoen: string) {
    setOpenGroepen((prev) => {
      const next = new Set(prev);
      if (next.has(seizoen)) {
        next.delete(seizoen);
      } else {
        next.add(seizoen);
      }
      return next;
    });
  }

  if (!open) return null;

  // Spelerspad
  const spelerspad: SpelerspadItem[] = Array.isArray(profiel?.spelerspad)
    ? (profiel.spelerspad as SpelerspadItem[])
    : [];

  // Team-info
  const huidigTeamObj = profiel?.huidig as HuidigTeam | null | undefined;
  const volgendSeizoenObj = profiel?.volgendSeizoen as VolgendSeizoen | null | undefined;

  // Geslacht-gradient
  const isVrouw = profiel?.geslacht === "V";
  const headerGradient = isVrouw
    ? "linear-gradient(160deg, #3a1a2e 0%, #2a0d1e 55%, #100a0e 100%)"
    : "linear-gradient(160deg, #1a2a4a 0%, #0d1f3c 55%, #0a0a14 100%)";
  const avatarRingKleur = isVrouw ? T.pink : T.blue;
  const avatarBg = isVrouw ? T.pinkDim : T.blueDim;
  const avatarTextKleur = isVrouw ? "#f9a8d4" : "#93c5fd";
  const glowKleur = isVrouw
    ? "radial-gradient(circle, rgba(236,72,153,.14) 0%, transparent 65%)"
    : "radial-gradient(circle, rgba(96,165,250,.14) 0%, transparent 65%)";

  // Status
  const statusCfg = STATUS_CONFIG[huidigStatus] ?? STATUS_CONFIG.BESCHIKBAAR;

  // Init
  const init = initialen(profiel?.roepnaam, profiel?.achternaam);

  // Lidmaatschapslabel
  let lidLabel: string | null = null;
  if (profiel?.lidSinds) {
    const jaar = profiel.lidSinds.slice(0, 4);
    const aant = profiel.seizoenenActief ?? spelerspad.length;
    lidLabel = `${jaar}${aant > 0 ? `  (${aant} seizoenen)` : ""}`;
  } else if (profiel?.seizoenenActief) {
    lidLabel = `${profiel.seizoenenActief} seizoenen`;
  }

  const evalGroepen = groepeerEvaluaties(evaluaties);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      {/* ── Dialog ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          profiel ? `Profiel van ${profiel.roepnaam} ${profiel.achternaam}` : "Spelersprofiel"
        }
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: T.bg1,
          border: `1px solid ${T.border1}`,
          borderRadius: 18,
          width: 680,
          maxWidth: "92vw",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 28px 80px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.5)",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* ───────────────────────────────────────────
            HEADER — 240px, twee kolommen
            ─────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            height: 240,
            borderBottom: `1px solid ${T.border0}`,
            position: "relative",
          }}
        >
          {/* Links: gradient + avatar + status */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "24px 20px 20px",
              background: headerGradient,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Achtergrondgloed */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: glowKleur,
                top: -120,
                left: -60,
                pointerEvents: "none",
              }}
            />

            {/* Avatar */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 38,
                fontWeight: 700,
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
                background: avatarBg,
                border: `3px solid ${avatarRingKleur}`,
                color: avatarTextKleur,
                boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 5px ${isVrouw ? "rgba(236,72,153,.1)" : "rgba(96,165,250,.1)"}`,
              }}
            >
              {init}
            </div>

            {/* Status dropdown */}
            <div
              ref={statusMenuRef}
              style={{
                position: "relative",
                width: "100%",
                flexShrink: 0,
                zIndex: 10,
              }}
            >
              <button
                onClick={() => setStatusMenuOpen((v) => !v)}
                disabled={statusBezig}
                style={{
                  width: "100%",
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 10px",
                  borderRadius: 8,
                  border: `1px solid ${statusCfg.border}`,
                  background: statusCfg.bg,
                  color: statusCfg.kleur,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Inter, system-ui, sans-serif",
                  cursor: statusBezig ? "not-allowed" : "pointer",
                  gap: 7,
                  opacity: statusBezig ? 0.7 : 1,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: statusCfg.kleur,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, textAlign: "left" }}>{statusCfg.label}</span>
                <span style={{ fontSize: 8, opacity: 0.7 }}>▾</span>
              </button>

              {statusMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    left: 0,
                    width: "100%",
                    background: T.bg2,
                    border: `1px solid ${T.border1}`,
                    borderRadius: 10,
                    overflow: "hidden",
                    zIndex: 200,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                  }}
                >
                  {STATUSSEN.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <div
                        key={s}
                        onClick={() => selecteerStatus(s)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "9px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: cfg.kleur,
                          background: s === huidigStatus ? T.bg3 : "transparent",
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: cfg.kleur,
                            flexShrink: 0,
                          }}
                        />
                        {cfg.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Scheidingslijn */}
          <div style={{ width: 1, background: T.border0, flexShrink: 0, alignSelf: "stretch" }} />

          {/* Rechts: naam + kenmerken */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "20px 20px 20px 22px",
              background: T.bg1,
              position: "relative",
              minWidth: 0,
            }}
          >
            {/* Sluit-knop */}
            <button
              onClick={onClose}
              aria-label="Sluiten"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 30,
                height: 30,
                borderRadius: 7,
                background: "none",
                border: `1px solid transparent`,
                color: T.text3,
                fontSize: 18,
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            {loading ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: T.text3,
                  fontSize: 13,
                }}
              >
                Laden...
              </div>
            ) : profiel ? (
              <>
                {/* Naam */}
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: T.text1,
                    lineHeight: 1.15,
                    letterSpacing: "-0.2px",
                    marginBottom: 14,
                    paddingRight: 36,
                  }}
                >
                  {profiel.roepnaam} {profiel.achternaam}
                </div>

                {/* Kenmerken */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                    flex: 1,
                  }}
                >
                  {/* Geboortedatum */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                        color: T.text3,
                        width: 96,
                        flexShrink: 0,
                      }}
                    >
                      Geboortedatum
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>
                      {leeftijdLabel(profiel.geboortedatum, profiel.geboortejaar)}
                    </span>
                  </div>

                  {/* Korfballeeftijd */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                        color: T.text3,
                        width: 96,
                        flexShrink: 0,
                      }}
                    >
                      Korfballeeftijd
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>
                      {korfbalLeeftijd(profiel.geboortedatum, profiel.geboortejaar)}
                    </span>
                  </div>

                  {/* Team */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                        color: T.text3,
                        width: 96,
                        flexShrink: 0,
                      }}
                    >
                      Team
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {huidigTeamObj?.team ? (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 6,
                            border: `1px solid ${T.border1}`,
                            background: T.bg3,
                            color: T.text1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {huidigTeamObj.team}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: T.text3 }}>—</span>
                      )}
                      {volgendSeizoenObj?.team && (
                        <>
                          <span style={{ fontSize: 12, color: T.accent, fontWeight: 700 }}>→</span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 6,
                              border: `1px solid ${T.accentBorder}`,
                              background: T.accentDim,
                              color: T.accent,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {volgendSeizoenObj.team}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lid */}
                  {lidLabel && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.6px",
                          color: T.text3,
                          width: 96,
                          flexShrink: 0,
                        }}
                      >
                        Lid
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>
                        {lidLabel}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: T.text3,
                  fontSize: 13,
                }}
              >
                Speler niet gevonden
              </div>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────
            TABS — 40px
            ─────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            height: 40,
            display: "flex",
            padding: "0 16px",
            background: T.bg1,
            borderBottom: `1px solid ${T.border0}`,
          }}
        >
          {(["pad", "evaluaties", "memo"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "pad" ? "Pad" : tab === "evaluaties" ? "Evaluaties" : "Memo";
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0 14px",
                  height: 40,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? T.text1 : T.text3,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  fontFamily: "Inter, system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 6,
                      right: 6,
                      height: 2,
                      background: T.accent,
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                )}
                {tab === "memo" && memoData.memoStatus === "open" && (
                  <span style={{ fontSize: 8, color: T.accent }}>▲</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────
            TAB BODY — flex:1, inner scroll
            ─────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "18px 18px 16px",
            scrollbarWidth: "thin",
            scrollbarColor: `${T.bg3} transparent`,
            minHeight: 220,
            maxHeight: 320,
          }}
        >
          {/* ── Tab: Pad ── */}
          {activeTab === "pad" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: T.text3,
                }}
              >
                Spelerspad
              </div>

              {spelerspad.length === 0 ? (
                <div style={{ fontSize: 13, color: T.text3 }}>Geen spelerspad beschikbaar</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {spelerspad.map((item, i) => {
                    const dotKleur = item.kleur
                      ? (KLEUR_DOT[item.kleur.toLowerCase()] ?? "#6b7280")
                      : "#6b7280";
                    const isLast = i === spelerspad.length - 1;
                    return (
                      <div
                        key={i}
                        style={{ display: "flex", alignItems: "stretch", minHeight: 32 }}
                      >
                        {/* Gutter */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: 20,
                            flexShrink: 0,
                            paddingTop: 3,
                          }}
                        >
                          <div
                            style={{
                              width: 9,
                              height: 9,
                              borderRadius: "50%",
                              background: dotKleur,
                              flexShrink: 0,
                              position: "relative",
                              zIndex: 1,
                              boxShadow: `0 0 4px ${dotKleur}80`,
                            }}
                          />
                          {!isLast && (
                            <div
                              style={{
                                flex: 1,
                                width: 1,
                                background: T.border0,
                                marginTop: 2,
                              }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div
                          style={{
                            flex: 1,
                            padding: "1px 0 10px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {item.seizoen && (
                            <span
                              style={{
                                fontSize: 11,
                                color: T.text3,
                                fontWeight: 500,
                                width: 64,
                                flexShrink: 0,
                              }}
                            >
                              {item.seizoen}
                            </span>
                          )}
                          {item.team && (
                            <span
                              style={{ fontSize: 13, fontWeight: 700, color: T.text1, flex: 1 }}
                            >
                              {item.team}
                            </span>
                          )}
                          {item.kleur && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "1px 6px",
                                borderRadius: 4,
                                background: `${dotKleur}1a`,
                                color: dotKleur,
                                border: `1px solid ${dotKleur}38`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.kleur.charAt(0).toUpperCase() + item.kleur.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Evaluaties ── */}
          {activeTab === "evaluaties" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {evalLoading ? (
                <div style={{ fontSize: 13, color: T.text3, textAlign: "center", padding: 16 }}>
                  Laden...
                </div>
              ) : evalGroepen.length === 0 ? (
                <div style={{ fontSize: 13, color: T.text3 }}>Geen evaluaties beschikbaar</div>
              ) : (
                evalGroepen.map(({ seizoen, items }, gi) => {
                  const isOpen = openGroepen.has(seizoen);
                  return (
                    <div key={seizoen}>
                      {/* Seizoen header */}
                      <div
                        onClick={() => toggleEvalGroep(seizoen)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: T.text2,
                          cursor: "pointer",
                          userSelect: "none",
                          flexShrink: 0,
                          marginBottom: isOpen ? 8 : 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            color: T.text3,
                            transition: "transform 150ms ease",
                            transform: isOpen ? "rotate(90deg)" : "none",
                            flexShrink: 0,
                          }}
                        >
                          ▶
                        </span>
                        Seizoen {seizoen}
                        <span
                          style={{
                            flex: 1,
                            height: 1,
                            background: T.border0,
                          }}
                        />
                        {gi === 0 && !isOpen && (
                          <span style={{ fontSize: 10, color: T.text3, fontWeight: 400 }}>
                            {items.length} ronde{items.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Evaluaties */}
                      {isOpen && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {items.map((item, idx) => (
                            <EvalBlok
                              key={`${seizoen}-${item.ronde}-${idx}`}
                              item={item}
                              teamVergelijking={teamVergelijking}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Tab: Memo ── */}
          {activeTab === "memo" && (
            <MemoPanel memo={memoData} onSave={slaMemoOp} opslaanBezig={opslaanBezig} />
          )}
        </div>
      </div>
    </div>
  );
}
