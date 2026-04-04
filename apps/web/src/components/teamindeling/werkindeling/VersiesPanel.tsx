"use client";

import { useState, useTransition } from "react";
import {
  verwijderVersie,
  herstelVersie,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/versies-actions";

interface Versie {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: string;
  isHuidig: boolean;
}

interface VersiesPanelProps {
  versies: Versie[];
  gebruikerEmail: string;
}

export default function VersiesPanel({ versies, gebruikerEmail }: VersiesPanelProps) {
  const [bevestigDelete, setBevestigDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (versieId: string) => {
    if (bevestigDelete !== versieId) {
      setBevestigDelete(versieId);
      return;
    }
    startTransition(async () => {
      const result = await verwijderVersie(versieId);
      if (!result.ok) alert(result.fout);
      setBevestigDelete(null);
    });
  };

  const handleHerstel = (versieId: string) => {
    startTransition(async () => {
      await herstelVersie(versieId, gebruikerEmail);
    });
  };

  return (
    <div className="space-y-1">
      <div
        className="mb-3 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Versies
      </div>

      {versies.map((versie) => (
        <div
          key={versie.id}
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            backgroundColor: versie.isHuidig ? "var(--state-selected)" : "transparent",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              v{versie.nummer}
              {versie.isHuidig && (
                <span className="ml-2 text-xs" style={{ color: "var(--ow-oranje-500)" }}>
                  Huidig
                </span>
              )}
            </div>
            <div className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
              {versie.naam ?? versie.auteur} &middot;{" "}
              {new Date(versie.createdAt).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          {!versie.isHuidig && (
            <button
              onClick={() => handleHerstel(versie.id)}
              disabled={isPending}
              className="shrink-0 rounded px-2 py-1 text-xs"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
            >
              Herstel
            </button>
          )}

          {versies.length > 1 && (
            <button
              onClick={() => handleDelete(versie.id)}
              disabled={isPending}
              className="shrink-0 rounded px-2 py-1 text-xs"
              style={{
                color:
                  bevestigDelete === versie.id ? "var(--color-error-500)" : "var(--text-tertiary)",
                border: `1px solid ${
                  bevestigDelete === versie.id ? "var(--color-error-500)" : "var(--border-default)"
                }`,
              }}
            >
              {bevestigDelete === versie.id ? "Zeker?" : "🗑"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
