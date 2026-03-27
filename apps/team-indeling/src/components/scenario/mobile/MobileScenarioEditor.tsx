"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { ScenarioData, SpelerData } from "../types";
import type { EditorMode } from "../editor/EditorToolbar";
import { useScenarioEditor } from "../hooks/useScenarioEditor";
import TeamCarousel from "./TeamCarousel";
import PoolStrip from "./PoolStrip";
import PoolSheet from "./PoolSheet";
import SpelerDetailSheet from "./SpelerDetailSheet";

interface MobileScenarioEditorProps {
  /** Scenario data */
  scenario: ScenarioData;
  /** Alle beschikbare spelers */
  alleSpelers: SpelerData[];
  /** Initieel start-modus (standaard "edit") */
  initialMode?: EditorMode;
}

/**
 * MobileScenarioEditor -- Root mobile component voor de scenario-editor.
 *
 * Dit component is een compleet alternatieve rendering voor het scenario
 * editor op mobile apparaten. Het gebruikt dezelfde `useScenarioEditor` hook
 * als de desktop versie -- alleen de UI verschilt.
 *
 * Features:
 * - TopBar met scenario naam + team navigatie
 * - TeamCarousel: horizontale snap-scroll door teams
 * - PoolStrip: sticky balk met ongeplaatste spelers
 * - PoolSheet: bottom sheet met zoek/filter en speler-toevoeging
 * - SpelerDetailSheet: bottom sheet met speler detail + verplaats acties
 */
export default function MobileScenarioEditor({
  scenario,
  alleSpelers,
  initialMode: _initialMode = "edit",
}: MobileScenarioEditorProps) {
  const editor = useScenarioEditor(scenario, alleSpelers);

  // Mobile-specifieke state
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [poolOpen, setPoolOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);

  // Teams gesorteerd op volgorde
  const sortedTeams = useMemo(
    () => [...editor.teams].sort((a, b) => a.volgorde - b.volgorde),
    [editor.teams]
  );

  // Actief team
  const activeTeam = sortedTeams[activeTeamIndex] ?? null;
  const activeTeamId = activeTeam?.id ?? undefined;

  // Pool spelers (niet in een team of selectiegroep)
  const poolSpelers = useMemo(() => {
    const ingedeeld = new Set<string>();
    for (const team of editor.teams) {
      for (const ts of team.spelers) {
        ingedeeld.add(ts.spelerId);
      }
    }
    for (const sg of editor.selectieGroepen) {
      for (const ss of sg.spelers) {
        ingedeeld.add(ss.spelerId);
      }
    }
    return alleSpelers.filter((s) => !ingedeeld.has(s.id));
  }, [alleSpelers, editor.teams, editor.selectieGroepen]);

  // -- Handlers --

  const handleSpelerClick = useCallback(
    (spelerId: string) => {
      const speler = alleSpelers.find((s) => s.id === spelerId);
      if (!speler) return;
      editor.setDetailSpeler(speler);
      // Zoek in welk team deze speler zit
      const teamMetSpeler = editor.teams.find((t) =>
        t.spelers.some((ts) => ts.spelerId === spelerId)
      );
      setDetailTeamId(teamMetSpeler?.id ?? null);
      setDetailOpen(true);
    },
    [alleSpelers, editor]
  );

  const handleAddToTeam = useCallback(
    (spelerId: string) => {
      if (!activeTeamId) return;
      editor.handlePoolToTeam(spelerId, activeTeamId);
    },
    [activeTeamId, editor]
  );

  const handleRemoveSpeler = useCallback(
    (spelerId: string, teamId: string) => {
      editor.handleTeamToPool(spelerId, teamId);
    },
    [editor]
  );

  const handleMoveToTeam = useCallback(
    (spelerId: string, naarTeamId: string) => {
      if (!detailTeamId) {
        // Speler komt uit pool
        editor.handlePoolToTeam(spelerId, naarTeamId);
      } else {
        // Speler verplaatsen van het ene team naar het andere
        editor.handleTeamToTeam(spelerId, detailTeamId, naarTeamId);
      }
    },
    [detailTeamId, editor]
  );

  const handleRemoveFromDetail = useCallback(
    (spelerId: string) => {
      if (!detailTeamId) return;
      editor.handleTeamToPool(spelerId, detailTeamId);
    },
    [detailTeamId, editor]
  );

  const handleOpenPool = useCallback(() => setPoolOpen(true), []);
  const handleClosePool = useCallback(() => setPoolOpen(false), []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    editor.setDetailSpeler(null);
    setDetailTeamId(null);
  }, [editor]);

  if (!editor.laatsteVersie) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "var(--surface-page)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Dit scenario heeft nog geen versie.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--surface-page)" }}>
      {/* ---- Top Bar ---- */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{
          backgroundColor: "rgba(20, 22, 28, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        {/* Terug + scenario naam */}
        <div className="flex items-center gap-2">
          <Link
            href="/scenarios"
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              color: "var(--text-secondary)",
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="Terug naar scenario's"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="flex flex-col">
            <h1
              className="text-sm leading-tight font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {scenario.naam}
            </h1>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {activeTeam ? `${activeTeamIndex + 1} / ${sortedTeams.length} teams` : "Geen teams"}
            </span>
          </div>
        </div>

        {/* Team naam + navigatie knoppen */}
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              color: activeTeamIndex > 0 ? "var(--text-secondary)" : "var(--text-tertiary)",
              minWidth: 44,
              minHeight: 44,
            }}
            disabled={activeTeamIndex === 0}
            onClick={() => setActiveTeamIndex((i) => Math.max(0, i - 1))}
            whileTap={{ scale: 0.9 }}
            aria-label="Vorig team"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </motion.button>
          <motion.button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              color:
                activeTeamIndex < sortedTeams.length - 1
                  ? "var(--text-secondary)"
                  : "var(--text-tertiary)",
              minWidth: 44,
              minHeight: 44,
            }}
            disabled={activeTeamIndex >= sortedTeams.length - 1}
            onClick={() => setActiveTeamIndex((i) => Math.min(sortedTeams.length - 1, i + 1))}
            whileTap={{ scale: 0.9 }}
            aria-label="Volgend team"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </motion.button>
        </div>
      </header>

      {/* ---- Team Carousel ---- */}
      <TeamCarousel
        teams={sortedTeams}
        activeIndex={activeTeamIndex}
        onIndexChange={setActiveTeamIndex}
        validatieMap={editor.validatieMap}
        onSpelerClick={handleSpelerClick}
        onAddSpeler={handleOpenPool}
        onRemoveSpeler={handleRemoveSpeler}
      />

      {/* ---- Pool Strip (sticky onderaan) ---- */}
      <PoolStrip poolSpelers={poolSpelers} onOpen={handleOpenPool} isOpen={poolOpen} />

      {/* ---- Pool Sheet ---- */}
      <PoolSheet
        open={poolOpen}
        onClose={handleClosePool}
        poolSpelers={poolSpelers}
        alleSpelers={alleSpelers}
        teams={editor.teams}
        onAddToTeam={handleAddToTeam}
        activeTeamId={activeTeamId}
      />

      {/* ---- Speler Detail Sheet ---- */}
      <SpelerDetailSheet
        speler={editor.detailSpeler}
        open={detailOpen}
        onClose={handleCloseDetail}
        teams={editor.teams}
        onMoveToTeam={handleMoveToTeam}
        onRemove={handleRemoveFromDetail}
        huidigTeamId={detailTeamId}
      />
    </div>
  );
}
