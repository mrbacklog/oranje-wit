"use client";

import { useEffect, useCallback } from "react";
import type { SpelerStatus } from "@oranje-wit/database";
import type { TeamData, SpelerData } from "./types";
import type { TeamValidatie, MeldingErnst } from "@/lib/validatie/regels";
import {
  KLEUR_BADGE_KLEUREN,
  KLEUR_DOT,
  korfbalLeeftijd,
  kleurIndicatie,
  STATUS_KLEUREN,
} from "./types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";

interface TeamDetailProps {
  team: TeamData;
  validatie?: TeamValidatie;
  onClose: () => void;
  onSpelerClick?: (speler: SpelerData) => void;
}

const ERNST_CONFIG: Record<MeldingErnst, { icon: string; kleur: string }> = {
  kritiek: { icon: "\u2715", kleur: "text-red-600 bg-red-50" },
  aandacht: { icon: "\u26A0", kleur: "text-orange-600 bg-orange-50" },
  info: { icon: "\u2139", kleur: "text-blue-600 bg-blue-50" },
};

const ERNST_VOLGORDE: MeldingErnst[] = ["kritiek", "aandacht", "info"];

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Stopt",
  NIEUW_POTENTIEEL: "Nieuw",
  NIEUW_DEFINITIEF: "Nieuw",
};

export default function TeamDetail({ team, validatie, onClose, onSpelerClick }: TeamDetailProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  // Stats
  const aantalSpelers = team.spelers.length;
  const heren = team.spelers
    .filter((ts) => ts.speler.geslacht === "M")
    .sort((a, b) => a.speler.achternaam.localeCompare(b.speler.achternaam));
  const dames = team.spelers
    .filter((ts) => ts.speler.geslacht === "V")
    .sort((a, b) => a.speler.achternaam.localeCompare(b.speler.achternaam));
  const gemLeeftijd =
    aantalSpelers > 0
      ? (
          team.spelers.reduce(
            (sum, ts) => sum + korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar),
            0
          ) / aantalSpelers
        ).toFixed(2)
      : "-";

  // Validatie meldingen gesorteerd op ernst
  const meldingen = validatie
    ? [...validatie.meldingen].sort(
        (a, b) => ERNST_VOLGORDE.indexOf(a.ernst) - ERNST_VOLGORDE.indexOf(b.ernst)
      )
    : [];

  // Notities verzamelen
  const notities: { naam: string; tekst: string }[] = [];
  for (const ts of team.spelers) {
    if (ts.notitie) {
      notities.push({
        naam: `${ts.speler.roepnaam} ${ts.speler.achternaam}`,
        tekst: ts.notitie,
      });
    }
    if (ts.speler.notitie) {
      notities.push({
        naam: `${ts.speler.roepnaam} ${ts.speler.achternaam}`,
        tekst: ts.speler.notitie,
      });
    }
  }

  const statusBadgeKleur =
    validatie?.status === "ROOD"
      ? "bg-red-100 text-red-700"
      : validatie?.status === "ORANJE"
        ? "bg-orange-100 text-orange-700"
        : "bg-green-100 text-green-700";

  function SpelerRij({
    speler,
    statusOverride,
  }: {
    speler: SpelerData;
    statusOverride: SpelerStatus | null;
  }) {
    const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
    const kleurInd = kleurIndicatie(leeftijd);
    const status = statusOverride ?? speler.status;

    return (
      <div
        className={`flex items-center gap-2 rounded px-2 py-1 ${
          onSpelerClick ? "cursor-pointer hover:bg-gray-50" : ""
        }`}
        onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
      >
        <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="xs" />
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_KLEUREN[status]}`} />
        <span
          className={`flex-1 text-sm text-gray-800 ${onSpelerClick ? "hover:text-orange-600" : ""}`}
        >
          {speler.roepnaam} {speler.achternaam}
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5">
          {kleurInd && <span className={`h-1.5 w-1.5 rounded-full ${KLEUR_DOT[kleurInd]}`} />}
          <span className="text-xs text-gray-400 tabular-nums">{leeftijd.toFixed(2)}</span>
        </span>
        <span className="shrink-0 text-xs">{speler.geslacht === "M" ? "\u2642" : "\u2640"}</span>
        {status !== "BESCHIKBAAR" && (
          <span className="text-[10px] text-gray-400">{STATUS_LABELS[status] ?? status}</span>
        )}
      </div>
    );
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-panel max-h-[85vh] w-full max-w-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dialog-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            {validatie && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeKleur}`}
              >
                {validatie.status === "ROOD"
                  ? "Kritiek"
                  : validatie.status === "ORANJE"
                    ? "Aandacht"
                    : "OK"}
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-900">{team.naam}</h3>
            {team.kleur && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {team.kleur}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-xl leading-none text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="dialog-body">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{aantalSpelers} spelers</span>
            <span>
              {heren.length}&#9794; {dames.length}&#9792;
            </span>
            <span>gem. {gemLeeftijd} jr</span>
          </div>

          {/* Heren */}
          {heren.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-1">
                <span className="text-xs font-medium text-gray-500">Heren ({heren.length})</span>
              </div>
              <div className="space-y-0.5">
                {heren.map((ts) => (
                  <SpelerRij key={ts.id} speler={ts.speler} statusOverride={ts.statusOverride} />
                ))}
              </div>
            </div>
          )}

          {/* Dames */}
          {dames.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-1">
                <span className="text-xs font-medium text-gray-500">Dames ({dames.length})</span>
              </div>
              <div className="space-y-0.5">
                {dames.map((ts) => (
                  <SpelerRij key={ts.id} speler={ts.speler} statusOverride={ts.statusOverride} />
                ))}
              </div>
            </div>
          )}

          {/* Staf */}
          {team.staf.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-1">
                <span className="text-xs font-medium text-gray-500">Staf</span>
              </div>
              <div className="space-y-1">
                {team.staf.map((ts) => (
                  <div key={ts.id} className="flex items-center gap-2 px-2 text-sm text-gray-700">
                    <span>{ts.staf.naam}</span>
                    <span className="text-xs text-gray-400">({ts.rol})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constateringen */}
          {meldingen.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-1">
                <span className="text-xs font-medium text-gray-500">
                  Constateringen ({meldingen.length})
                </span>
              </div>
              <div className="space-y-1">
                {meldingen.map((m, i) => {
                  const config = ERNST_CONFIG[m.ernst];
                  return (
                    <div key={`${m.regel}-${i}`} className="flex items-start gap-2 px-2 py-0.5">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] ${config.kleur}`}
                      >
                        {config.icon}
                      </span>
                      <span className="text-xs leading-snug text-gray-700">{m.bericht}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notities */}
          {notities.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-1">
                <span className="text-xs font-medium text-gray-500">Notities</span>
              </div>
              <div className="space-y-1">
                {notities.map((n, i) => (
                  <div key={i} className="rounded bg-gray-50 px-3 py-1.5">
                    <span className="text-[11px] font-medium text-gray-600">{n.naam}:</span>{" "}
                    <span className="text-[11px] text-gray-500">{n.tekst}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
