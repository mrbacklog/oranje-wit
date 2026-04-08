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
  onOpenWhatIf?: () => void;
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
  onOpenWhatIf,
}: EditorToolbarProps) {
  const isLocked = scenario.status === "DEFINITIEF" || scenario.status === "GEARCHIVEERD";

  return (
    <div
      className="relative flex h-12 items-center justify-between px-4"
      style={{
        background: "var(--surface-card)",
        borderBottom: "2px solid var(--ow-oranje-500)",
      }}
    >
      {/* Links: sluiten + scenario info */}
      <div className="flex items-center gap-3">
        <Link
          href="/ti-studio/indeling"
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: "var(--text-secondary)" }}
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
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {scenario.naam}
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={
              scenario.status === "DEFINITIEF"
                ? { background: "#14532d33", color: "#4ade80" }
                : scenario.status === "GEARCHIVEERD"
                  ? { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
                  : { background: "#FF6B0022", color: "var(--ow-oranje-500)" }
            }
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
      <span
        className="absolute left-1/2 -translate-x-1/2 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        {zichtbaar} van {totaal} teams zichtbaar
      </span>

      {/* Rechts: score toggle + nieuw team + toggle + definitief */}
      <div className="flex items-center gap-2">
        {onToggleCompact && (
          <button
            onClick={onToggleCompact}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={
              compactMode
                ? { background: "var(--ow-oranje-500)", color: "#fff" }
                : { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
            }
            title={compactMode ? "Schakel naar detailweergave" : "Schakel naar compacte weergave"}
          >
            {compactMode ? "Detail" : "Compact"}
          </button>
        )}
        {onToggleRanking && (
          <button
            onClick={onToggleRanking}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={
              showRanking
                ? { background: "var(--ow-oranje-500)", color: "#fff" }
                : { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
            }
            title={showRanking ? "Verberg scores" : "Toon scores"}
          >
            Score
          </button>
        )}
        {onSyncScores && (
          <button
            onClick={onSyncScores}
            disabled={syncingScores}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
            title="Synchroniseer teamscores vanuit dit scenario naar competitieteams"
          >
            {syncingScores ? "Syncing..." : "Sync scores"}
          </button>
        )}
        {onOpenWhatIf && (
          <button
            onClick={onOpenWhatIf}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
            title="What-if scenario starten"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            What-if
          </button>
        )}
        {!isLocked && onCreateTeam && mode === "edit" && (
          <button
            onClick={onCreateTeam}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
            style={{ background: "var(--ow-oranje-500)" }}
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
        {!isLocked && mode === "preview" && <MaakDefinitiefKnop werkindelingId={scenario.id} />}

        {!isLocked && (
          <button
            onClick={onToggleMode}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={
              mode === "preview"
                ? { background: "#FF6B0022", color: "var(--ow-oranje-500)" }
                : { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
            }
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
