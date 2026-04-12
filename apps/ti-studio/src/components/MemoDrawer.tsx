"use client";
import { useState, useEffect, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import {
  updateWerkitemInhoud,
  updateWerkitemPrioriteit,
  updateWerkitemStatus,
  verwijderWerkitem,
} from "@/app/indeling/werkitem-actions";
import { WerkitemTijdlijn } from "./WerkitemTijdlijn";
import type { TijdlijnToelichting, TijdlijnLog } from "@/app/memo/tijdlijn-utils";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_BESPREKING: "In bespreking",
  OPGELOST: "Opgelost",
  GEACCEPTEERD_RISICO: "Risico geaccepteerd",
  GEARCHIVEERD: "Gearchiveerd",
};

const PRIORITEIT_LABELS: Record<string, string> = {
  BLOCKER: "Blocker",
  HOOG: "Hoog",
  MIDDEL: "Middel",
  LAAG: "Laag",
  INFO: "Info",
};

const ENTITEIT_BADGE: Record<string, { label: string; kleur: string; bg: string }> = {
  team: { label: "Team", kleur: "#60a5fa", bg: "rgba(96,165,250,.15)" },
  speler: { label: "Speler", kleur: "#ec4899", bg: "rgba(236,72,153,.15)" },
  doelgroep: { label: "Doelgroep", kleur: "#a78bfa", bg: "rgba(167,139,250,.15)" },
  tc: { label: "TC-algemeen", kleur: "#9ca3af", bg: "rgba(156,163,175,.12)" },
};

export interface DrawerWerkitem {
  id: string;
  beschrijving: string;
  status: string;
  prioriteit: string;
  resolutie: string | null;
  entiteitType: "team" | "speler" | "doelgroep" | "tc";
  entiteitNaam: string;
  toelichtingen: TijdlijnToelichting[];
  activiteiten: TijdlijnLog[];
}

interface MemoDrawerProps {
  werkitem: DrawerWerkitem | null;
  onSluiten: () => void;
  onVerwijderd: (id: string) => void;
  onBijgewerkt: (id: string, wijzigingen: Partial<DrawerWerkitem>) => void;
  huidigeGebruikerNaam: string;
}

export function MemoDrawer({
  werkitem,
  onSluiten,
  onVerwijderd,
  onBijgewerkt,
  huidigeGebruikerNaam,
}: MemoDrawerProps) {
  const [beschrijving, setBeschrijving] = useState("");
  const [status, setStatus] = useState("");
  const [prioriteit, setPrioriteit] = useState("");
  const [resolutie, setResolutie] = useState("");
  const [opslaan, setOpslaan] = useState(false);
  const [verwijderen, setVerwijderen] = useState(false);

  useEffect(() => {
    if (werkitem) {
      setBeschrijving(werkitem.beschrijving);
      setStatus(werkitem.status);
      setPrioriteit(werkitem.prioriteit);
      setResolutie(werkitem.resolutie ?? "");
    }
  }, [werkitem?.id]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onSluiten();
    },
    [onSluiten]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  if (!werkitem) return null;

  const toonResolutie = status === "OPGELOST" || status === "GEACCEPTEERD_RISICO";
  const badge = ENTITEIT_BADGE[werkitem.entiteitType] ?? ENTITEIT_BADGE.tc;

  async function handleOpslaan() {
    if (!werkitem) return;
    setOpslaan(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        updateWerkitemInhoud(werkitem.id, {
          beschrijving,
          resolutie: toonResolutie ? resolutie : null,
        }),
        status !== werkitem.status
          ? updateWerkitemStatus(werkitem.id, status)
          : Promise.resolve({ ok: true }),
        prioriteit !== werkitem.prioriteit
          ? updateWerkitemPrioriteit(werkitem.id, prioriteit)
          : Promise.resolve({ ok: true }),
      ]);
      if (r1.ok && (r2 as { ok: boolean }).ok && (r3 as { ok: boolean }).ok) {
        onBijgewerkt(werkitem.id, {
          beschrijving,
          status,
          prioriteit,
          resolutie: toonResolutie ? resolutie : null,
        });
      } else {
        logger.warn("MemoDrawer opslaan mislukt");
      }
    } catch (err) {
      logger.error("MemoDrawer handleOpslaan:", err);
    } finally {
      setOpslaan(false);
    }
  }

  async function handleVerwijder() {
    if (!werkitem) return;
    setVerwijderen(true);
    try {
      const result = await verwijderWerkitem(werkitem.id);
      if (result.ok) {
        onVerwijderd(werkitem.id);
        onSluiten();
      }
    } catch (err) {
      logger.error("MemoDrawer handleVerwijder:", err);
    } finally {
      setVerwijderen(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onSluiten}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.4)",
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          background: "var(--bg-1)",
          borderLeft: "1px solid var(--border-0)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, system-ui, sans-serif",
          boxShadow: "-8px 0 32px rgba(0,0,0,.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-2)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 4,
                background: badge.bg,
                color: badge.kleur,
              }}
            >
              {badge.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              {werkitem.entiteitNaam}
            </span>
          </div>
          <button
            onClick={onSluiten}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-3)",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollbaar inhoud */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* Beschrijving */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-0)" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".6px",
                color: "var(--text-3)",
                marginBottom: 5,
              }}
            >
              Beschrijving
            </div>
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                background: "var(--bg-0)",
                border: "1px solid var(--border-0)",
                borderRadius: 6,
                color: "var(--text-1)",
                fontSize: 12,
                padding: "8px 10px",
                resize: "vertical",
                fontFamily: "Inter, system-ui, sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Prioriteit + Status + Opslaan */}
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-0)",
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".6px",
                  color: "var(--text-3)",
                  marginBottom: 5,
                }}
              >
                Prioriteit
              </div>
              <select
                value={prioriteit}
                onChange={(e) => setPrioriteit(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-0)",
                  border: "1px solid var(--border-0)",
                  borderRadius: 6,
                  color: "var(--text-1)",
                  fontSize: 11,
                  padding: "5px 8px",
                }}
              >
                {Object.entries(PRIORITEIT_LABELS).map(([v, l]) => (
                  <option key={v} value={v} style={{ background: "var(--bg-1)" }}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".6px",
                  color: "var(--text-3)",
                  marginBottom: 5,
                }}
              >
                Status
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-0)",
                  border: "1px solid var(--border-0)",
                  borderRadius: 6,
                  color: "var(--text-1)",
                  fontSize: 11,
                  padding: "5px 8px",
                }}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v} style={{ background: "var(--bg-1)" }}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleOpslaan}
              disabled={opslaan}
              style={{
                background: opslaan ? "var(--bg-2)" : "var(--accent)",
                border: "none",
                borderRadius: 6,
                color: opslaan ? "var(--text-3)" : "#fff",
                fontSize: 11,
                fontWeight: 600,
                padding: "6px 12px",
                cursor: opslaan ? "not-allowed" : "pointer",
                flexShrink: 0,
              }}
            >
              {opslaan ? "..." : "Opslaan"}
            </button>
          </div>

          {/* Resolutie — conditioneel */}
          {toonResolutie && (
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-0)" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".6px",
                  color: "var(--text-3)",
                  marginBottom: 5,
                }}
              >
                Resolutie
              </div>
              <textarea
                value={resolutie}
                onChange={(e) => setResolutie(e.target.value)}
                placeholder="Hoe is dit opgelost?"
                rows={2}
                style={{
                  width: "100%",
                  background: "var(--bg-0)",
                  border: "1px solid var(--border-0)",
                  borderRadius: 6,
                  color: "var(--text-1)",
                  fontSize: 12,
                  padding: "8px 10px",
                  resize: "none",
                  fontFamily: "Inter, system-ui, sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Tijdlijn */}
          <div style={{ padding: "12px 16px", flex: 1 }}>
            <WerkitemTijdlijn
              werkitemId={werkitem.id}
              initieleToelichtingen={werkitem.toelichtingen}
              initieleLog={werkitem.activiteiten}
              huidigeGebruikerNaam={huidigeGebruikerNaam}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{ padding: "10px 16px", borderTop: "1px solid var(--border-0)", flexShrink: 0 }}
        >
          <button
            onClick={handleVerwijder}
            disabled={verwijderen}
            style={{
              background: "none",
              border: "none",
              color: verwijderen ? "var(--text-3)" : "#6b7280",
              fontSize: 11,
              cursor: verwijderen ? "not-allowed" : "pointer",
            }}
          >
            {verwijderen ? "Verwijderen..." : "🗑 Verwijderen"}
          </button>
        </div>
      </div>
    </>
  );
}
