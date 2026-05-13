"use client";

import { useEffect, useRef } from "react";
import type { SpelerRijData } from "@/components/personen/types";
import { createPortal } from "react-dom";

interface SpelerDialogProps {
  speler: SpelerRijData;
  onClose: () => void;
}

export function SpelerDialog({ speler, onClose }: SpelerDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // Focus trap: focus eerste focusable element
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.6)",
          zIndex: 10000,
          backdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
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
          width: 480,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--bg-2)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-1)",
          boxShadow: "0 24px 64px rgba(0,0,0,.8)",
          zIndex: 10001,
          outline: "none",
          padding: 24,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--text-1)",
              }}
            >
              {speler.roepnaam} {speler.achternaam}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              {speler.id} · {speler.geslacht === "M" ? "Heer" : "Dame"} · {speler.korfbalLeeftijd}{" "}
              jr
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-3)",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
              borderRadius: "var(--radius-sm)",
            }}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        {/* Informatie */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 24px",
            marginBottom: 20,
          }}
        >
          <InfoRij label="Status" waarde={speler.status} />
          <InfoRij label="Gezien" waarde={speler.gezienStatus} />
          <InfoRij label="Huidig team" waarde={speler.huidigTeam ?? "—"} />
          <InfoRij label="Indeling" waarde={speler.indelingTeamNaam ?? "Niet ingedeeld"} />
          <InfoRij label="Leeftijdscategorie" waarde={speler.leeftijdscategorie} />
          <InfoRij
            label="Memo"
            waarde={speler.memoBadge === "geen" ? "Geen memo" : speler.memoBadge}
          />
        </div>

        {/* Sluiten */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "1px solid var(--border-1)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-2)",
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

function InfoRij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 700,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>{waarde}</div>
    </div>
  );
}
