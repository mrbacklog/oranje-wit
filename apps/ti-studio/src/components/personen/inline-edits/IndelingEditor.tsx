"use client";

import { useEffect, useRef } from "react";
import { zetSpelerIndeling } from "@/app/(protected)/personen/speler-edit-actions";

export type IndelingsDoel = {
  id: string;
  naam: string;
  kleur: string | null;
  type: "team" | "selectie";
};

export const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
  BLAUW: "#3b82f6",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  SENIOR: "#94a3b8",
};

function kleurVoor(kleur: string | null | undefined): string {
  return KLEUR_DOT[(kleur ?? "").toLowerCase()] ?? KLEUR_DOT[kleur ?? ""] ?? "#6b7280";
}

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 4,
  zIndex: 50,
  background: "var(--surface-card)",
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  padding: "0.375rem",
  minWidth: 200,
  maxHeight: 300,
  overflowY: "auto",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const itemStyle = (actief: boolean): React.CSSProperties => ({
  padding: "0.375rem 0.625rem",
  borderRadius: 6,
  background: actief ? "rgba(255,107,0,0.1)" : "transparent",
  color: actief ? "var(--accent)" : "var(--text-primary)",
  fontSize: "0.75rem",
  fontWeight: 500,
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: 6,
});

interface Props {
  spelerId: string;
  versieId: string;
  teams: IndelingsDoel[];
  huidigIndelingTeam: { naam: string; kleur: string | null } | null;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOptimistischUpdate: (team: { naam: string; kleur: string | null } | null) => void;
  onFout: (fout: string) => void;
  onRefresh: () => void;
  spelernaam?: string;
}

export function IndelingEditor({
  spelerId,
  versieId,
  teams,
  huidigIndelingTeam,
  open,
  onOpen,
  onClose,
  onOptimistischUpdate,
  onFout,
  onRefresh,
  spelernaam,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const losseTeams = teams.filter((t) => t.type === "team");
  const selecties = teams.filter((t) => t.type === "selectie");
  const huidigId = teams.find((t) => t.naam === huidigIndelingTeam?.naam)?.id ?? null;
  const indelingKleur = kleurVoor(huidigIndelingTeam?.kleur);

  async function kies(doel: { id: string; type: "team" | "selectie" } | null) {
    const nieuwDoel = doel ? (teams.find((t) => t.id === doel.id) ?? null) : null;
    onOptimistischUpdate(nieuwDoel ? { naam: nieuwDoel.naam, kleur: nieuwDoel.kleur } : null);
    onClose();
    const resultaat = await zetSpelerIndeling(versieId, spelerId, doel);
    if (resultaat.ok) {
      onRefresh();
    } else {
      onOptimistischUpdate(huidigIndelingTeam);
      onFout(resultaat.error);
    }
  }

  const popover = open ? (
    <div style={popoverStyle} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => kies(null)} style={itemStyle(huidigId === null)}>
        <span style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>
          — geen indeling —
        </span>
      </button>
      {losseTeams.length > 0 && (
        <div
          style={{
            fontSize: "0.5625rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-secondary)",
            padding: "6px 10px 2px",
            marginTop: 4,
          }}
        >
          Teams
        </div>
      )}
      {losseTeams.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => kies({ id: t.id, type: "team" })}
          style={itemStyle(t.id === huidigId)}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: kleurVoor(t.kleur),
              flexShrink: 0,
            }}
          />
          {t.naam}
        </button>
      ))}
      {selecties.length > 0 && (
        <>
          <div
            style={{
              fontSize: "0.5625rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-secondary)",
              padding: "6px 10px 2px",
              marginTop: 4,
              borderTop: "1px solid var(--border-default)",
            }}
          >
            Selecties
          </div>
          {selecties.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => kies({ id: t.id, type: "selectie" })}
              style={itemStyle(t.id === huidigId)}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: kleurVoor(t.kleur),
                  flexShrink: 0,
                }}
              />
              {t.naam}
              <span
                style={{
                  fontSize: "0.5rem",
                  padding: "0.1rem 0.35rem",
                  borderRadius: 3,
                  background: "rgba(59,130,246,0.15)",
                  color: "#60a5fa",
                  fontWeight: 700,
                  marginLeft: "auto",
                }}
              >
                SEL
              </span>
            </button>
          ))}
        </>
      )}
      {teams.length === 0 && (
        <div
          style={{
            padding: "0.375rem 0.5rem",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            fontStyle: "italic",
          }}
        >
          Geen teams in versie
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      {huidigIndelingTeam ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 6,
            padding: "2px 2px 2px 8px",
            fontSize: "0.75rem",
            color: "#4ade80",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 120ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLSpanElement).style.background = "rgba(34,197,94,0.14)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLSpanElement).style.background = "rgba(34,197,94,0.08)";
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open ? onClose() : onOpen();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "none",
              border: "none",
              padding: "0.05rem 0.1rem",
              margin: 0,
              cursor: "pointer",
              color: "inherit",
              fontFamily: "inherit",
              fontSize: "inherit",
              fontWeight: "inherit",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: indelingKleur,
                flexShrink: 0,
              }}
            />
            {huidigIndelingTeam.naam}
          </button>
          <button
            type="button"
            aria-label={`Haal ${spelernaam ?? "speler"} uit ${huidigIndelingTeam.naam}`}
            title="Verwijder indeling"
            onClick={async (e) => {
              e.stopPropagation();
              await kies(null);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              borderRadius: 4,
              border: "none",
              background: "rgba(34,197,94,0.15)",
              color: "#4ade80",
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
              lineHeight: 1,
              fontSize: "0.75rem",
              transition: "background 100ms, color 100ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.2)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "#4ade80";
            }}
          >
            ×
          </button>
        </span>
      ) : (
        <button
          type="button"
          aria-label={`Wijs ${spelernaam ?? "speler"} toe aan team of selectie`}
          title="Voeg indeling toe"
          onClick={(e) => {
            e.stopPropagation();
            open ? onClose() : onOpen();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 6,
            border: "1px dashed var(--border-default)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 0,
            fontFamily: "inherit",
            fontSize: "0.9375rem",
            lineHeight: 1,
            transition: "border-color 120ms, color 120ms",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "var(--accent)";
            b.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "var(--border-default)";
            b.style.color = "var(--text-secondary)";
          }}
        >
          +
        </button>
      )}
      {popover}
    </div>
  );
}
