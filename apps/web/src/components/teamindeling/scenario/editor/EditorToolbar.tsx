"use client";

import Link from "next/link";
import type { ScenarioData } from "../types";
import MaakDefinitiefKnop from "../MaakDefinitiefKnop";

export type EditorMode = "preview" | "edit";

interface EditorToolbarProps {
  scenario: ScenarioData;
  zichtbaar: number;
  totaal: number;
  mode: EditorMode;
  showRanking?: boolean;
  compactMode?: boolean;
  onToggleRanking?: () => void;
  onToggleCompact?: () => void;
  onSyncScores?: () => void;
  syncingScores?: boolean;
  onToggleMode: () => void;
  onCreateTeam?: () => void;
}

export default function EditorToolbar({
  scenario,
  zichtbaar,
  totaal,
  mode,
  showRanking,
  compactMode,
  onToggleRanking,
  onToggleCompact,
  onSyncScores,
  syncingScores,
  onToggleMode,
  onCreateTeam,
}: EditorToolbarProps) {
  const isLocked = scenario.status === "DEFINITIEF" || scenario.status === "GEARCHIVEERD";

  return (
    <div className="relative flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Links: sluiten + scenario info */}
      <div className="flex items-center gap-3">
        <Link
          href="/ti-studio/scenarios"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Terug naar scenario's"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">{scenario.naam}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              scenario.status === "DEFINITIEF"
                ? "bg-green-100 text-green-700"
                : scenario.status === "GEARCHIVEERD"
                  ? "bg-gray-100 text-gray-500"
                  : "bg-orange-100 text-orange-700"
            }`}
          >
            {scenario.status === "DEFINITIEF"
              ? "Definitief"
              : scenario.status === "GEARCHIVEERD"
                ? "Gearchiveerd"
                : "Actief"}
          </span>
        </div>
      </div>

      {/* Midden: teller */}
      <span className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-500">
        {zichtbaar} van {totaal} teams zichtbaar
      </span>

      {/* Rechts: score toggle + nieuw team + toggle + definitief */}
      <div className="flex items-center gap-2">
        {onToggleCompact && (
          <button
            onClick={onToggleCompact}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              compactMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title={compactMode ? "Schakel naar detailweergave" : "Schakel naar compacte weergave"}
          >
            {compactMode ? "Detail" : "Compact"}
          </button>
        )}
        {onToggleRanking && (
          <button
            onClick={onToggleRanking}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showRanking ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title={showRanking ? "Verberg scores" : "Toon scores"}
          >
            Score
          </button>
        )}
        {onSyncScores && (
          <button
            onClick={onSyncScores}
            disabled={syncingScores}
            className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50"
            title="Synchroniseer teamscores vanuit dit scenario naar competitieteams"
          >
            {syncingScores ? "Syncing..." : "Sync scores"}
          </button>
        )}
        {!isLocked && onCreateTeam && mode === "edit" && (
          <button
            onClick={onCreateTeam}
            className="flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nieuw team
          </button>
        )}
        {!isLocked && mode === "preview" && <MaakDefinitiefKnop scenarioId={scenario.id} />}

        {!isLocked && (
          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "preview"
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={mode === "preview" ? "Schakel naar bewerken" : "Schakel naar preview"}
          >
            {mode === "preview" ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Bewerken
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
