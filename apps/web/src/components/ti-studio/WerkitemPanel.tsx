"use client";

import { useState } from "react";
import { logger } from "@oranje-wit/types";
import type { WerkbordWerkitem } from "@/components/ti-studio/werkbord/types";
import {
  createWerkitem,
  updateWerkitemStatus,
  verwijderWerkitem,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/werkitem-actions";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export interface WerkitemPanelProps {
  entiteitType: "TEAM" | "SPELER" | "STAF";
  teamId?: string;
  spelerId?: string;
  stafId?: string;
  kadersId: string;
  werkindelingId?: string;
  initieleWerkitems: WerkbordWerkitem[];
}

type Prioriteit = "BLOCKER" | "HOOG" | "MIDDEL" | "LAAG" | "INFO";
type Status = "OPEN" | "IN_BESPREKING" | "OPGELOST" | "GEACCEPTEERD_RISICO" | "GEARCHIVEERD";

// ──────────────────────────────────────────────────────────
// Configuratie
// ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; kleur: string; bg: string; border: string }> =
  {
    OPEN: {
      label: "Open",
      kleur: "#f97316",
      bg: "rgba(249,115,22,.12)",
      border: "rgba(249,115,22,.3)",
    },
    IN_BESPREKING: {
      label: "In bespreking",
      kleur: "#60a5fa",
      bg: "rgba(96,165,250,.12)",
      border: "rgba(96,165,250,.3)",
    },
    OPGELOST: {
      label: "Opgelost",
      kleur: "#22c55e",
      bg: "rgba(34,197,94,.12)",
      border: "rgba(34,197,94,.3)",
    },
    GEACCEPTEERD_RISICO: {
      label: "Risico geaccepteerd",
      kleur: "#eab308",
      bg: "rgba(234,179,8,.12)",
      border: "rgba(234,179,8,.3)",
    },
    GEARCHIVEERD: {
      label: "Gearchiveerd",
      kleur: "#6b7280",
      bg: "rgba(107,114,128,.12)",
      border: "rgba(107,114,128,.3)",
    },
  };

const PRIORITEIT_LABELS: Record<Prioriteit, string> = {
  BLOCKER: "Blocker",
  HOOG: "Hoog",
  MIDDEL: "Middel",
  LAAG: "Laag",
  INFO: "Info",
};

const PRIORITEIT_KLEUR: Record<Prioriteit, string> = {
  BLOCKER: "#ef4444",
  HOOG: "#f97316",
  MIDDEL: "#eab308",
  LAAG: "#60a5fa",
  INFO: "#6b7280",
};

const STATUSSEN = Object.keys(STATUS_CONFIG) as Status[];
const PRIORITEITEN = Object.keys(PRIORITEIT_LABELS) as Prioriteit[];

// ──────────────────────────────────────────────────────────
// WerkitemPanel
// ──────────────────────────────────────────────────────────

export function WerkitemPanel({
  entiteitType,
  teamId,
  spelerId,
  stafId,
  kadersId,
  werkindelingId,
  initieleWerkitems,
}: WerkitemPanelProps) {
  const [werkitems, setWerkitems] = useState<WerkbordWerkitem[]>(initieleWerkitems);
  const [formulierOpen, setFormulierOpen] = useState(false);
  const [nieuweBeschrijving, setNieuweBeschrijving] = useState("");
  const [nieuwePrioriteit, setNieuwePrioriteit] = useState<Prioriteit>("MIDDEL");
  const [opslaan, setOpslaan] = useState(false);
  const [statusBezig, setStatusBezig] = useState<string | null>(null);
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null);

  async function handleOpslaan() {
    const beschrijving = nieuweBeschrijving.trim();
    if (!beschrijving) return;
    setOpslaan(true);
    try {
      const result = await createWerkitem({
        kadersId,
        werkindelingId,
        teamId,
        spelerId,
        stafId,
        beschrijving,
        prioriteit: nieuwePrioriteit,
      });
      if (result.ok && result.data) {
        setWerkitems((prev) => [result.data!, ...prev]);
        setNieuweBeschrijving("");
        setNieuwePrioriteit("MIDDEL");
        setFormulierOpen(false);
      } else if (!result.ok) {
        logger.warn("WerkitemPanel: aanmaken mislukt", result.error);
      }
    } catch (err) {
      logger.error("WerkitemPanel: fout bij aanmaken werkitem", err);
    } finally {
      setOpslaan(false);
    }
  }

  async function handleStatusWijzig(id: string, nieuweStatus: string) {
    setStatusBezig(id);
    try {
      const result = await updateWerkitemStatus(id, nieuweStatus);
      if (result.ok) {
        setWerkitems((prev) => prev.map((w) => (w.id === id ? { ...w, status: nieuweStatus } : w)));
      } else {
        logger.warn("WerkitemPanel: status-update mislukt", result.error);
      }
    } catch (err) {
      logger.error("WerkitemPanel: fout bij status-update", err);
    } finally {
      setStatusBezig(null);
    }
  }

  async function handleVerwijder(id: string) {
    setVerwijderBezig(id);
    try {
      const result = await verwijderWerkitem(id);
      if (result.ok) {
        setWerkitems((prev) => prev.filter((w) => w.id !== id));
      } else {
        logger.warn("WerkitemPanel: verwijderen mislukt", result.error);
      }
    } catch (err) {
      logger.error("WerkitemPanel: fout bij verwijderen werkitem", err);
    } finally {
      setVerwijderBezig(null);
    }
  }

  // Onbekend entiteitType wordt nooit meegegeven maar TS vereist het niet expliciet
  void entiteitType;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Nieuwe notitie knop */}
      {!formulierOpen && (
        <button
          onClick={() => setFormulierOpen(true)}
          style={{
            background: "none",
            border: "1px dashed rgba(255,107,0,.35)",
            borderRadius: 8,
            color: "#ff6b00",
            fontSize: 12,
            fontWeight: 600,
            padding: "8px 12px",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          + Nieuwe notitie
        </button>
      )}

      {/* Inline formulier */}
      {formulierOpen && (
        <div
          style={{
            border: "1px solid rgba(255,107,0,.35)",
            borderRadius: 8,
            padding: 12,
            background: "rgba(255,107,0,.05)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <textarea
            value={nieuweBeschrijving}
            onChange={(e) => setNieuweBeschrijving(e.target.value)}
            placeholder="Notitie of actiepunt..."
            rows={3}
            autoFocus
            style={{
              background: "#1e1e1e",
              border: "1px solid #3a3a3a",
              borderRadius: 6,
              color: "#fafafa",
              fontSize: 13,
              padding: "8px 10px",
              resize: "vertical",
              fontFamily: "Inter, system-ui, sans-serif",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={nieuwePrioriteit}
              onChange={(e) => setNieuwePrioriteit(e.target.value as Prioriteit)}
              style={{
                background: "#1e1e1e",
                border: "1px solid #3a3a3a",
                borderRadius: 6,
                color: "#fafafa",
                fontSize: 12,
                padding: "5px 8px",
                fontFamily: "Inter, system-ui, sans-serif",
                cursor: "pointer",
              }}
            >
              {PRIORITEITEN.map((p) => (
                <option key={p} value={p}>
                  {PRIORITEIT_LABELS[p]}
                </option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => {
                setFormulierOpen(false);
                setNieuweBeschrijving("");
                setNieuwePrioriteit("MIDDEL");
              }}
              style={{
                background: "none",
                border: "1px solid #3a3a3a",
                borderRadius: 6,
                color: "#a3a3a3",
                fontSize: 12,
                padding: "5px 10px",
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Annuleren
            </button>
            <button
              onClick={handleOpslaan}
              disabled={opslaan || !nieuweBeschrijving.trim()}
              style={{
                background: opslaan || !nieuweBeschrijving.trim() ? "#2a2a2a" : "#ff6b00",
                border: "none",
                borderRadius: 6,
                color: opslaan || !nieuweBeschrijving.trim() ? "#666" : "#fff",
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                cursor: opslaan || !nieuweBeschrijving.trim() ? "not-allowed" : "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {opslaan ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      )}

      {/* Werkitems lijst */}
      {werkitems.length === 0 && !formulierOpen && (
        <div
          style={{
            fontSize: 12,
            color: "#666",
            padding: "12px 0",
            textAlign: "center",
          }}
        >
          Geen notities of actiepunten
        </div>
      )}

      {werkitems.map((item) => {
        const status = item.status as Status;
        const prioriteit = item.prioriteit as Prioriteit;
        const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN;
        const prioriteitKleur = PRIORITEIT_KLEUR[prioriteit] ?? "#6b7280";
        const prioriteitLabel = PRIORITEIT_LABELS[prioriteit] ?? prioriteit;

        return (
          <div
            key={item.id}
            style={{
              background: "#1e1e1e",
              border: "1px solid #262626",
              borderRadius: 8,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            {/* Beschrijving */}
            <div
              style={{
                fontSize: 13,
                color: "#fafafa",
                lineHeight: 1.45,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.beschrijving}
            </div>

            {/* Badges + acties rij */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {/* Prioriteit badge */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: prioriteitKleur,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: `${prioriteitKleur}18`,
                  border: `1px solid ${prioriteitKleur}40`,
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {prioriteitLabel}
              </span>

              {/* Status dropdown */}
              <select
                value={status}
                disabled={statusBezig === item.id}
                onChange={(e) => handleStatusWijzig(item.id, e.target.value)}
                style={{
                  background: statusCfg.bg,
                  border: `1px solid ${statusCfg.border}`,
                  borderRadius: 4,
                  color: statusCfg.kleur,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 6px",
                  cursor: "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                  opacity: statusBezig === item.id ? 0.5 : 1,
                }}
              >
                {STATUSSEN.map((s) => (
                  <option key={s} value={s} style={{ background: "#1e1e1e", color: "#fafafa" }}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>

              <div style={{ flex: 1 }} />

              {/* Datum */}
              <span style={{ fontSize: 10, color: "#666" }}>
                {new Date(item.createdAt).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                })}
              </span>

              {/* Verwijder-knop */}
              <button
                onClick={() => handleVerwijder(item.id)}
                disabled={verwijderBezig === item.id}
                title="Verwijder"
                style={{
                  background: "none",
                  border: "none",
                  color: verwijderBezig === item.id ? "#444" : "#666",
                  cursor: verwijderBezig === item.id ? "not-allowed" : "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  padding: "0 2px",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
