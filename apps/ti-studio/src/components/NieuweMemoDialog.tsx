"use client";

import { useState, useEffect, useRef } from "react";
import { logger } from "@oranje-wit/types";
import { createWerkitem } from "@/app/(protected)/indeling/werkitem-actions";
import type { WerkitemData } from "@/app/(protected)/indeling/werkitem-actions";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

type EntiteitType = "SPELER" | "STAF" | "TEAM" | "TC";
type Prioriteit = "BLOCKER" | "HOOG" | "MIDDEL" | "LAAG" | "INFO";
type Doelgroep =
  | "KWEEKVIJVER"
  | "ONTWIKKELHART"
  | "TOP"
  | "WEDSTRIJDSPORT"
  | "KORFBALPLEZIER"
  | "ALLE";

export type NieuweMemoContext = {
  type: EntiteitType;
  id?: string;
  label?: string;
  teamKleur?: string;
  doelgroep?: Doelgroep;
};

export interface NieuweMemoDialogProps {
  open: boolean;
  onClose: () => void;
  context?: NieuweMemoContext;
  kadersId: string;
  werkindelingId?: string;
  onCreated?: (item: WerkitemData) => void;
}

type ZoekResultaat = {
  id: string;
  label: string;
  subLabel?: string;
  rel_code?: string;
};

// ──────────────────────────────────────────────────────────
// Constanten
// ──────────────────────────────────────────────────────────

const PRIORITEIT_CONFIG: Record<
  Prioriteit,
  { label: string; actief: string; activeBg: string; activeBorder: string; activeColor: string }
> = {
  BLOCKER: {
    label: "Blocker",
    actief: "BLOCKER",
    activeBg: "#ef4444",
    activeBorder: "#ef4444",
    activeColor: "#fff",
  },
  HOOG: {
    label: "Hoog",
    actief: "HOOG",
    activeBg: "#f97316",
    activeBorder: "#f97316",
    activeColor: "#fff",
  },
  MIDDEL: {
    label: "Middel",
    actief: "MIDDEL",
    activeBg: "#eab308",
    activeBorder: "#eab308",
    activeColor: "#1a1a00",
  },
  LAAG: {
    label: "Laag",
    actief: "LAAG",
    activeBg: "#60a5fa",
    activeBorder: "#60a5fa",
    activeColor: "#fff",
  },
  INFO: {
    label: "Info",
    actief: "INFO",
    activeBg: "#6b7280",
    activeBorder: "#6b7280",
    activeColor: "#fff",
  },
};

const ENTITEIT_OPTIES: { type: EntiteitType; label: string }[] = [
  { type: "SPELER", label: "Speler" },
  { type: "STAF", label: "Staf" },
  { type: "TEAM", label: "Team" },
  { type: "TC", label: "TC-algemeen" },
];

const DOELGROEP_OPTIES: { value: Doelgroep | ""; label: string }[] = [
  { value: "", label: "— automatisch —" },
  { value: "KWEEKVIJVER", label: "Kweekvijver" },
  { value: "ONTWIKKELHART", label: "Opleidingshart" },
  { value: "TOP", label: "Topsport" },
  { value: "WEDSTRIJDSPORT", label: "Wedstrijdsport" },
  { value: "KORFBALPLEZIER", label: "Korfbalplezier" },
  { value: "ALLE", label: "Alle (TC-algemeen)" },
];

// ──────────────────────────────────────────────────────────
// Token shortcuts
// ──────────────────────────────────────────────────────────

const T = {
  bg1: "#0a0a0a",
  bg2: "#141414",
  bg3: "#1e1e1e",
  accent: "#ff6b00",
  accentHover: "#ff8533",
  text1: "#fafafa",
  text2: "#a3a3a3",
  textMuted: "#666666",
  border0: "#262626",
  border1: "#3a3a3a",
};

// ──────────────────────────────────────────────────────────
// Context-badge type kleuren
// ──────────────────────────────────────────────────────────

const CONTEXT_TYPE_STYLE: Record<
  EntiteitType,
  { color: string; bg: string; border: string; label: string }
> = {
  SPELER: {
    color: "#2563eb",
    bg: "rgba(37,99,235,.1)",
    border: "rgba(37,99,235,.2)",
    label: "Speler",
  },
  STAF: {
    color: "#eab308",
    bg: "rgba(234,179,8,.08)",
    border: "rgba(234,179,8,.2)",
    label: "Staf",
  },
  TEAM: {
    color: T.text2,
    bg: "rgba(255,255,255,.04)",
    border: T.border1,
    label: "Team",
  },
  TC: {
    color: T.accent,
    bg: "rgba(255,107,0,.08)",
    border: "rgba(255,107,0,.15)",
    label: "Doelgroep",
  },
};

// ──────────────────────────────────────────────────────────
// NieuweMemoDialog
// ──────────────────────────────────────────────────────────

export function NieuweMemoDialog({
  open,
  onClose,
  context: initialContext,
  kadersId,
  werkindelingId,
  onCreated,
}: NieuweMemoDialogProps) {
  const [context, setContext] = useState<NieuweMemoContext | undefined>(initialContext);
  const [contextWijzigen, setContextWijzigen] = useState(!initialContext);
  const [entiteitType, setEntiteitType] = useState<EntiteitType>(initialContext?.type ?? "TC");
  const [geselecteerdEntiteit, setGeselecteerdEntiteit] = useState<ZoekResultaat | null>(
    initialContext && initialContext.id && initialContext.label
      ? { id: initialContext.id, label: initialContext.label }
      : null
  );
  const [zoekQuery, setZoekQuery] = useState("");
  const [zoekResultaten, setZoekResultaten] = useState<ZoekResultaat[]>([]);
  const [zoekBezig, setZoekBezig] = useState(false);
  const [zoekOpen, setZoekOpen] = useState(false);
  const [beschrijving, setBeschrijving] = useState("");
  const [prioriteit, setPrioriteit] = useState<Prioriteit>("MIDDEL");
  const [doelgroep, setDoelgroep] = useState<Doelgroep | "">(initialContext?.doelgroep ?? "");
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const zoekRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tekstRef = useRef<HTMLTextAreaElement>(null);

  // Reset bij openen
  useEffect(() => {
    if (open) {
      setContext(initialContext);
      setContextWijzigen(!initialContext);
      setEntiteitType(initialContext?.type ?? "TC");
      setGeselecteerdEntiteit(
        initialContext && initialContext.id && initialContext.label
          ? { id: initialContext.id, label: initialContext.label }
          : null
      );
      setZoekQuery("");
      setZoekResultaten([]);
      setZoekOpen(false);
      setBeschrijving("");
      setPrioriteit("MIDDEL");
      setDoelgroep(initialContext?.doelgroep ?? "");
      setFout(null);
      setTimeout(() => tekstRef.current?.focus(), 80);
    }
  }, [open, initialContext]);

  // Zoeken met debounce
  useEffect(() => {
    if (entiteitType === "TC" || !contextWijzigen) return;
    if (!zoekQuery) {
      setZoekResultaten([]);
      setZoekOpen(false);
      return;
    }

    if (zoekRef.current) clearTimeout(zoekRef.current);
    zoekRef.current = setTimeout(async () => {
      const typeParam =
        entiteitType === "SPELER" ? "speler" : entiteitType === "STAF" ? "staf" : "team";
      setZoekBezig(true);
      try {
        const res = await fetch(
          `/api/teamindeling/zoek?type=${typeParam}&q=${encodeURIComponent(zoekQuery)}`
        );
        const json = (await res.json()) as { ok: boolean; data?: ZoekResultaat[] };
        if (json.ok && json.data) {
          setZoekResultaten(json.data);
          setZoekOpen(json.data.length > 0);
        }
      } catch (err) {
        logger.warn("NieuweMemoDialog: zoek mislukt", err);
      } finally {
        setZoekBezig(false);
      }
    }, 280);
  }, [zoekQuery, entiteitType, contextWijzigen]);

  async function handleOpslaan() {
    const tekst = beschrijving.trim();
    if (!tekst) return;

    // Valideer entiteit-keuze
    if ((contextWijzigen || !context) && entiteitType !== "TC" && !geselecteerdEntiteit) {
      setFout("Selecteer een speler, staf of team.");
      return;
    }

    setOpslaan(true);
    setFout(null);

    // Bepaal IDs
    const teamId = entiteitType === "TEAM" ? (geselecteerdEntiteit?.id ?? context?.id) : undefined;
    const spelerId =
      entiteitType === "SPELER" ? (geselecteerdEntiteit?.id ?? context?.id) : undefined;
    const stafId = entiteitType === "STAF" ? (geselecteerdEntiteit?.id ?? context?.id) : undefined;

    try {
      const result = await createWerkitem({
        kadersId,
        werkindelingId,
        teamId,
        spelerId,
        stafId,
        beschrijving: tekst,
        prioriteit,
        doelgroep: doelgroep || undefined,
      });

      if (result.ok && result.data) {
        onCreated?.(result.data);
        onClose();
      } else if (!result.ok) {
        setFout(result.error ?? "Aanmaken mislukt");
        logger.warn("NieuweMemoDialog: aanmaken mislukt", result.error);
      }
    } catch (err) {
      logger.error("NieuweMemoDialog: fout bij aanmaken", err);
      setFout("Er is een fout opgetreden.");
    } finally {
      setOpslaan(false);
    }
  }

  function handleEntiteitSelect(type: EntiteitType) {
    setEntiteitType(type);
    setGeselecteerdEntiteit(null);
    setZoekQuery("");
    setZoekResultaten([]);
    setZoekOpen(false);
  }

  function handleWijzigKlik() {
    setContextWijzigen(true);
    setGeselecteerdEntiteit(null);
    setZoekQuery("");
  }

  // Toon doelgroep-select als TC of als doelgroep-context
  const toonDoelgroep = entiteitType === "TC" || context?.type === "SPELER";
  const toonZoekVeld = contextWijzigen && entiteitType !== "TC";

  if (!open) return null;

  const typeStijl = CONTEXT_TYPE_STYLE[entiteitType];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.65)",
          zIndex: 1000,
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nieuwe memo"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: 440,
          maxWidth: "calc(100vw - 32px)",
          background: T.bg2,
          border: `1px solid ${T.border1}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,.7)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: `1px solid ${T.border0}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text1, margin: 0 }}>Nieuwe memo</h2>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: `1px solid ${T.border1}`,
              color: T.textMuted,
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Context-badge (als context bekend is en niet in wijzig-modus) */}
          {context && !contextWijzigen ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,.03)",
                border: `1px solid ${T.border0}`,
                fontSize: 12,
                color: T.text1,
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  padding: "1px 6px",
                  borderRadius: 4,
                  color: CONTEXT_TYPE_STYLE[context.type].color,
                  background: CONTEXT_TYPE_STYLE[context.type].bg,
                  border: `1px solid ${CONTEXT_TYPE_STYLE[context.type].border}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {context.type === "TEAM" && context.teamKleur && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: context.teamKleur,
                      flexShrink: 0,
                    }}
                  />
                )}
                {CONTEXT_TYPE_STYLE[context.type].label}
              </span>
              <span style={{ fontWeight: 600 }}>
                {context.doelgroep
                  ? (DOELGROEP_OPTIES.find((d) => d.value === context.doelgroep)?.label ??
                    context.label)
                  : context.label}
              </span>
              <button
                onClick={handleWijzigKlik}
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  color: T.textMuted,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  textDecoration: "underline",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                wijzig
              </button>
            </div>
          ) : (
            /* Entiteit-keuze (geen context of in wijzig-modus) */
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: T.textMuted,
                }}
              >
                {context ? "Koppel aan (optioneel)" : "Koppel aan"}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {ENTITEIT_OPTIES.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => handleEntiteitSelect(type)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 7,
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: `1px solid ${entiteitType === type ? "rgba(255,107,0,.4)" : T.border1}`,
                      background: entiteitType === type ? "rgba(255,107,0,.06)" : T.bg3,
                      color: entiteitType === type ? T.accent : T.textMuted,
                      fontFamily: "inherit",
                      transition: "all 120ms",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zoek-veld */}
          {toonZoekVeld && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: T.textMuted,
                }}
              >
                Zoek{" "}
                {entiteitType === "SPELER"
                  ? "speler"
                  : entiteitType === "STAF"
                    ? "stafled"
                    : "team"}
              </span>
              <input
                type="text"
                value={geselecteerdEntiteit ? geselecteerdEntiteit.label : zoekQuery}
                onChange={(e) => {
                  setGeselecteerdEntiteit(null);
                  setZoekQuery(e.target.value);
                }}
                placeholder="Typ een naam..."
                autoComplete="off"
                style={{
                  background: T.bg3,
                  border: `1px solid ${T.border1}`,
                  borderRadius: 7,
                  padding: "8px 12px",
                  color: geselecteerdEntiteit ? T.text1 : T.text1,
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              {/* Dropdown resultaten */}
              {zoekOpen && !geselecteerdEntiteit && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 2,
                    background: T.bg3,
                    border: `1px solid ${T.border1}`,
                    borderRadius: 8,
                    overflow: "hidden",
                    zIndex: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                  }}
                >
                  {zoekBezig ? (
                    <div style={{ padding: "8px 12px", fontSize: 12, color: T.textMuted }}>
                      Zoeken...
                    </div>
                  ) : zoekResultaten.length === 0 ? (
                    <div style={{ padding: "8px 12px", fontSize: 12, color: T.textMuted }}>
                      Geen resultaten
                    </div>
                  ) : (
                    zoekResultaten.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setGeselecteerdEntiteit(r);
                          setZoekQuery(r.label);
                          setZoekOpen(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          fontSize: 13,
                          color: T.text1,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          borderBottom: `1px solid ${T.border0}`,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "rgba(255,255,255,.04)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "none";
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{r.label}</span>
                        {r.subLabel && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: T.textMuted }}>
                            {r.subLabel}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Beschrijving */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: T.textMuted,
              }}
            >
              Beschrijving *
            </span>
            <textarea
              ref={tekstRef}
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              placeholder="Wat is het aandachtspunt?"
              rows={3}
              style={{
                background: T.bg3,
                border: `1px solid ${T.border1}`,
                borderRadius: 7,
                padding: "8px 12px",
                color: T.text1,
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
                width: "100%",
                boxSizing: "border-box",
                minHeight: 80,
                resize: "vertical",
                lineHeight: 1.5,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,107,0,.4)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border1;
              }}
            />
          </div>

          {/* Prioriteit */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: T.textMuted,
              }}
            >
              Prioriteit
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {(Object.keys(PRIORITEIT_CONFIG) as Prioriteit[]).map((p) => {
                const cfg = PRIORITEIT_CONFIG[p];
                const actief = prioriteit === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPrioriteit(p)}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: 6,
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 120ms",
                      border: `1px solid ${actief ? cfg.activeBorder : T.border1}`,
                      background: actief ? cfg.activeBg : T.bg3,
                      color: actief ? cfg.activeColor : T.textMuted,
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doelgroep — bij TC of speler-context */}
          {toonDoelgroep && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: T.textMuted,
                }}
              >
                Doelgroep
              </span>
              <select
                value={doelgroep}
                onChange={(e) => setDoelgroep(e.target.value as Doelgroep | "")}
                style={{
                  background: T.bg3,
                  border: `1px solid ${T.border1}`,
                  borderRadius: 7,
                  padding: "8px 12px",
                  color: T.text1,
                  fontSize: 13,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  width: "100%",
                  outline: "none",
                }}
              >
                {DOELGROEP_OPTIES.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={{ background: T.bg3, color: T.text1 }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Foutmelding */}
          {fout && (
            <div
              style={{
                fontSize: 12,
                color: "#ef4444",
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.2)",
                borderRadius: 6,
                padding: "6px 10px",
              }}
            >
              {fout}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: `1px solid ${T.border0}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 7,
              border: `1px solid ${T.border1}`,
              background: "none",
              color: T.text2,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleOpslaan}
            disabled={opslaan || !beschrijving.trim()}
            style={{
              padding: "8px 20px",
              borderRadius: 7,
              border: "none",
              background:
                opslaan || !beschrijving.trim()
                  ? "#2a2a2a"
                  : typeStijl.color === T.text2
                    ? T.accent
                    : T.accent,
              color: opslaan || !beschrijving.trim() ? "#555" : "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: opslaan || !beschrijving.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "background 120ms",
            }}
          >
            {opslaan ? "Aanmaken..." : "Aanmaken"}
          </button>
        </div>
      </div>
    </>
  );
}
