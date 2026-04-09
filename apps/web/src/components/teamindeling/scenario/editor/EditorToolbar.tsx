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
  zoomLabel?: string;
  ingedeeldSpelers?: number;
  totaalSpelers?: number;
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
  zichtbaar: _zichtbaar,
  totaal: _totaal,
  mode,
  showRanking,
  compactMode: _compactMode,
  zoomLabel,
  ingedeeldSpelers,
  totaalSpelers,
  onToggleRanking,
  onToggleCompact: _onToggleCompact,
  onSyncScores,
  syncingScores,
  onToggleMode,
  onCreateTeam,
  onOpenWhatIf,
}: EditorToolbarProps) {
  const isLocked = scenario.status === "DEFINITIEF" || scenario.status === "GEARCHIVEERD";

  return (
    <div
      className="relative flex items-center gap-2 px-3.5"
      style={{
        height: 52,
        background: "var(--surface-card)",
        borderBottom: "2px solid var(--ow-oranje-500)",
        flexShrink: 0,
      }}
    >
      {/* Links: terug + scenario naam + status badge */}
      <div className="flex items-center gap-2" style={{ minWidth: 0, flex: "0 0 auto" }}>
        <Link
          href="/ti-studio/indeling"
          className="flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors"
          style={{ color: "var(--text-muted)", fontSize: 12 }}
          title="Terug naar scenario's"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>

        <div className="h-4 w-px shrink-0" style={{ background: "var(--border-default)" }} />

        <h2
          className="truncate text-sm font-bold"
          style={{ color: "var(--text-primary)", maxWidth: 200 }}
        >
          {scenario.naam}
        </h2>

        <span
          className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
          style={
            scenario.status === "DEFINITIEF"
              ? {
                  background: "rgba(34,197,94,0.12)",
                  color: "#22C55E",
                  border: "1px solid rgba(34,197,94,0.2)",
                }
              : scenario.status === "GEARCHIVEERD"
                ? {
                    background: "var(--surface-sunken)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-default)",
                  }
                : {
                    background: "rgba(234,179,8,0.12)",
                    color: "#EAB308",
                    border: "1px solid rgba(234,179,8,0.2)",
                  }
          }
        >
          {scenario.status === "DEFINITIEF"
            ? "Definitief"
            : scenario.status === "GEARCHIVEERD"
              ? "Gearchiveerd"
              : "Concept"}
        </span>
      </div>

      {/* Midden: spelers-teller */}
      {ingedeeldSpelers != null && totaalSpelers != null && (
        <div
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-lg px-3 py-1"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border-subtle)",
            fontSize: 12,
          }}
        >
          <span
            className="font-bold tabular-nums"
            style={{ color: "var(--text-primary)", fontSize: 14 }}
          >
            {ingedeeldSpelers}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
            van {totaalSpelers} spelers ingedeeld
          </span>
        </div>
      )}

      {/* Rechts: zoom badge + acties */}
      <div className="ml-auto flex items-center gap-2">
        {/* Zoom-level badge */}
        {zoomLabel && (
          <span
            className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {zoomLabel}
          </span>
        )}

        {onToggleRanking && (
          <button
            onClick={onToggleRanking}
            className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
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
            className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
            title="Synchroniseer teamscores"
          >
            {syncingScores ? "Syncing..." : "Sync"}
          </button>
        )}

        {onOpenWhatIf && !isLocked && (
          <button
            onClick={onOpenWhatIf}
            className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
            title="What-if scenario starten"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            What-if
          </button>
        )}

        {!isLocked && onCreateTeam && mode === "edit" && (
          <button
            onClick={onCreateTeam}
            className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
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
            className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
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
