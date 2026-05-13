"use client";

import { useState } from "react";
import type { SyncKaartData, SyncStatus } from "./types";
import { VoorbereidingStap } from "./VoorbereidingStap";
import { VoortgangStap } from "./VoortgangStap";
import { ResultaatStap } from "./ResultaatStap";

interface SyncOverlayProps {
  open: boolean;
  kaartId: SyncKaartData["id"] | null;
  status: SyncStatus;
  onClose: () => void;
}

// Stap-namen — VoortgangStap en ResultaatStap zijn gebouwd maar niet bereikbaar in Route B
type OverlayStap = "voorbereiding" | "voortgang" | "resultaat";

const TITEL_MAP: Record<SyncKaartData["id"], string> = {
  leden: "Leden synchroniseren",
  competitie: "Competitie synchroniseren",
  historie: "Notificaties synchroniseren",
};

export function SyncOverlay({ open, kaartId, status, onClose }: SyncOverlayProps) {
  // Route B: stap is altijd 'voorbereiding', geen transitie mogelijk
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stap] = useState<OverlayStap>("voorbereiding");

  if (!open || !kaartId) return null;

  const kaartData = status[kaartId];
  const titel = TITEL_MAP[kaartId];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 420,
          background: "var(--surface-page)",
          border: "1px solid var(--border-default)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,.7)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {titel}
          </h2>
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
              border: "1px solid var(--border-default)",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px" }}>
          {stap === "voorbereiding" && <VoorbereidingStap kaartData={kaartData} />}
          {stap === "voortgang" && <VoortgangStap />}
          {stap === "resultaat" && <ResultaatStap />}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "1px solid var(--border-default)",
              background: "none",
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Annuleren
          </button>
          <button
            disabled
            title="Synchronisatie beschikbaar in volgende release"
            style={{
              padding: "7px 16px",
              borderRadius: 7,
              border: "none",
              background: "var(--ow-accent)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "not-allowed",
              opacity: 0.45,
              fontFamily: "inherit",
            }}
          >
            Starten
          </button>
        </div>
      </div>
    </div>
  );
}
