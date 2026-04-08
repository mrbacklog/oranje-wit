"use client";

import { useEffect } from "react";

const KLEUR_GRADIENT: Record<string, string> = {
  PAARS: "linear-gradient(135deg, #a855f7, #818cf8)",
  BLAUW: "linear-gradient(135deg, #3b82f6, #60a5fa)",
  GROEN: "linear-gradient(135deg, #22c55e, #a3c928)",
  GEEL: "linear-gradient(135deg, #eab308, #f09030)",
  ORANJE: "linear-gradient(135deg, #f97316, #e8c020)",
  ROOD: "linear-gradient(135deg, #ef4444, #cc2222)",
};

function leeftijdGradient(geboortejaar: number): string {
  const huidigJaar = new Date().getFullYear();
  const leeftijd = huidigJaar - geboortejaar;
  if (leeftijd <= 8) return "linear-gradient(135deg, #2478cc 0%, #2d9d5e 100%)";
  if (leeftijd === 9) return "linear-gradient(135deg, #22c55e 0%, #a3c928 100%)";
  if (leeftijd <= 12) return "linear-gradient(135deg, #f0c024 0%, #f09030 100%)";
  if (leeftijd <= 15) return "linear-gradient(135deg, #f07830 0%, #e8c020 100%)";
  if (leeftijd <= 18) return "linear-gradient(135deg, #e85518 0%, #cc2222 100%)";
  return "linear-gradient(135deg, #374151 0%, #1f2937 100%)";
}

function initialen(roepnaam: string, achternaam: string): string {
  return `${roepnaam.trim().charAt(0)}${achternaam.trim().charAt(0)}`.toUpperCase() || "??";
}

type SpelerInTeam = {
  id: string;
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    geslacht: "M" | "V";
    geboortejaar: number;
    status: string;
    huidig?: unknown;
  };
  isPinned?: boolean;
};

interface TeamoverzichtDialogProps {
  team: {
    id: string;
    naam: string;
    alias?: string | null;
    kleur?: string | null;
    categorie: string;
    spelers: SpelerInTeam[];
  } | null;
  open: boolean;
  onClose: () => void;
  onSpelerVerwijderd?: (spelerId: string, teamId: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  beschikbaar: "#22c55e",
  twijfelt: "#facc15",
  gaat_stoppen: "#f87171",
  nieuw: "#60a5fa",
};

function SpelerRij({
  item,
  teamId,
  onVerwijderd,
}: {
  item: SpelerInTeam;
  teamId: string;
  onVerwijderd?: (spelerId: string, teamId: string) => void;
}) {
  const { speler } = item;
  const init = initialen(speler.roepnaam, speler.achternaam);
  const avatarGradient = leeftijdGradient(speler.geboortejaar);
  const dotKleur = STATUS_DOT[speler.status] ?? "#6b7280";
  const huidigJaar = new Date().getFullYear();
  const leeftijd = huidigJaar - speler.geboortejaar;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.625rem",
        borderRadius: 8,
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: avatarGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.6875rem",
          fontWeight: 800,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {init}
      </div>

      {/* Naam + leeftijdsband */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {speler.roepnaam} {speler.achternaam}
        </div>
        <div
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-secondary)",
          }}
        >
          {leeftijd} jr
        </div>
      </div>

      {/* Status dot */}
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dotKleur,
          flexShrink: 0,
          boxShadow: `0 0 6px ${dotKleur}66`,
        }}
        title={speler.status.replace("_", " ")}
      />

      {/* Pin icoon */}
      {item.isPinned && (
        <span
          title="Gepind"
          style={{ fontSize: "0.75rem", color: "var(--ow-oranje-500, #ff6b00)", flexShrink: 0 }}
        >
          📌
        </span>
      )}

      {/* Verwijder knop */}
      {onVerwijderd && (
        <button
          onClick={() => onVerwijderd(speler.id, teamId)}
          aria-label={`${speler.roepnaam} ${speler.achternaam} verwijderen`}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "0.125rem 0.25rem",
            borderRadius: 4,
            fontSize: "0.875rem",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function TeamoverzichtDialog({
  team,
  open,
  onClose,
  onSpelerVerwijderd,
}: TeamoverzichtDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !team) return null;

  const kleurUppercase = (team.kleur ?? "").toUpperCase();
  const teamGradient =
    KLEUR_GRADIENT[kleurUppercase] ?? "linear-gradient(135deg, #374151, #1f2937)";

  const dames = team.spelers.filter((s) => s.speler.geslacht === "V");
  const heren = team.spelers.filter((s) => s.speler.geslacht === "M");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9991,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Teamoverzicht: ${team.naam}`}
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--surface-raised)",
          borderRadius: 20,
          width: "90vw",
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-default)",
            flexShrink: 0,
          }}
        >
          {/* Kleurband */}
          <div
            style={{
              width: 6,
              height: 36,
              borderRadius: 3,
              background: teamGradient,
              flexShrink: 0,
            }}
          />

          {/* Teamnaam */}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              {team.naam}
              {team.alias && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  ({team.alias})
                </span>
              )}
            </h2>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                marginTop: 2,
              }}
            >
              {team.categorie}
            </div>
          </div>

          {/* Geslacht counts */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span
              style={{
                background: "rgba(236,72,153,0.15)",
                color: "#f9a8d4",
                borderRadius: 99,
                padding: "0.25rem 0.625rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              ♀ {dames.length}
            </span>
            <span
              style={{
                background: "rgba(59,130,246,0.15)",
                color: "#93c5fd",
                borderRadius: 99,
                padding: "0.25rem 0.625rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              ♂ {heren.length}
            </span>
          </div>

          {/* Sluitknop */}
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "1.5rem",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0.25rem 0.5rem",
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body: 2-kolom grid */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem 1.25rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            alignContent: "start",
          }}
        >
          {/* Dames kolom */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                marginBottom: "0.625rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#f9a8d4",
              }}
            >
              <span>♀</span>
              <span>Dames</span>
              <span
                style={{
                  marginLeft: "auto",
                  background: "rgba(236,72,153,0.12)",
                  color: "#f9a8d4",
                  borderRadius: 99,
                  padding: "0.1rem 0.5rem",
                  fontSize: "0.75rem",
                }}
              >
                {dames.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {dames.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1.5rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.8125rem",
                    border: "1px dashed var(--border-default)",
                    borderRadius: 8,
                  }}
                >
                  Geen dames toegevoegd
                </div>
              ) : (
                dames.map((item) => (
                  <SpelerRij
                    key={item.id}
                    item={item}
                    teamId={team.id}
                    onVerwijderd={onSpelerVerwijderd}
                  />
                ))
              )}
            </div>
          </div>

          {/* Heren kolom */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                marginBottom: "0.625rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#93c5fd",
              }}
            >
              <span>♂</span>
              <span>Heren</span>
              <span
                style={{
                  marginLeft: "auto",
                  background: "rgba(59,130,246,0.12)",
                  color: "#93c5fd",
                  borderRadius: 99,
                  padding: "0.1rem 0.5rem",
                  fontSize: "0.75rem",
                }}
              >
                {heren.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {heren.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1.5rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.8125rem",
                    border: "1px dashed var(--border-default)",
                    borderRadius: 8,
                  }}
                >
                  Geen heren toegevoegd
                </div>
              ) : (
                heren.map((item) => (
                  <SpelerRij
                    key={item.id}
                    item={item}
                    teamId={team.id}
                    onVerwijderd={onSpelerVerwijderd}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid var(--border-default)",
            padding: "0.875rem 1.25rem",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              background: "rgba(255,107,0,0.1)",
              color: "var(--ow-oranje-500, #ff6b00)",
              border: "1px solid rgba(255,107,0,0.25)",
              borderRadius: 8,
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Speler toevoegen
          </button>
        </div>
      </div>
    </div>
  );
}
