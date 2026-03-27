"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BottomSheet } from "@oranje-wit/ui/feedback/bottom-sheet";
import type { SpelerData, TeamData, HuidigData, SpelerspadEntry } from "../types";
import {
  korfbalLeeftijd,
  kleurIndicatie,
  KLEUR_DOT,
  KLEUR_LABELS,
  STATUS_KLEUREN,
  KLEUR_BADGE_KLEUREN,
} from "../types";

interface SpelerDetailSheetProps {
  /** Speler data (null = sheet is verborgen) */
  speler: SpelerData | null;
  /** Is het sheet open? */
  open: boolean;
  /** Sluit het sheet */
  onClose: () => void;
  /** Alle teams voor de "verplaats naar" optie */
  teams: TeamData[];
  /** Verplaats speler naar een ander team */
  onMoveToTeam?: (spelerId: string, teamId: string) => void;
  /** Verwijder speler uit huidig team */
  onRemove?: (spelerId: string) => void;
  /** ID van het team waar de speler momenteel in zit */
  huidigTeamId?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Gaat stoppen",
  NIEUW_POTENTIEEL: "Nieuw (potentieel)",
  NIEUW_DEFINITIEF: "Nieuw (definitief)",
  ALGEMEEN_RESERVE: "Algemeen reserve",
};

/**
 * SpelerDetailSheet -- BottomSheet met speler detail info.
 *
 * Features:
 * - Mini SpelersKaart-achtige weergave
 * - Leeftijd, kleur, status, huidig team
 * - Spelerspad (laatste 3 seizoenen)
 * - Acties: "Verplaats naar..." (selecteer team), "Verwijder uit team"
 */
export default function SpelerDetailSheet({
  speler,
  open,
  onClose,
  teams,
  onMoveToTeam,
  onRemove,
  huidigTeamId,
}: SpelerDetailSheetProps) {
  const huidigTeamNaam = useMemo(
    () => teams.find((t) => t.id === huidigTeamId)?.naam,
    [teams, huidigTeamId]
  );

  // Andere teams (voor verplaats-optie, exclusief huidig team)
  const andereTeams = useMemo(
    () => teams.filter((t) => t.id !== huidigTeamId),
    [teams, huidigTeamId]
  );

  if (!speler) return null;

  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const huidig = speler.huidig as HuidigData | null;
  const spelerspad = (speler.spelerspad ?? []) as SpelerspadEntry[];
  const recentPad = spelerspad.slice(0, 3);
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      height={85}
      title={`${speler.roepnaam} ${speler.achternaam}`}
    >
      {/* ---- Speler header ---- */}
      <div className="mb-4 flex items-center gap-4">
        {/* Avatar */}
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
          style={{
            background: kleur
              ? `linear-gradient(135deg, var(--tw-color-${kleur.toLowerCase()}-400, #888), var(--tw-color-${kleur.toLowerCase()}-600, #666))`
              : "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-700))",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {initialen}
        </div>

        {/* Info kolom */}
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* Kleur dot + leeftijd */}
            {kleur && <span className={`h-2 w-2 rounded-full ${KLEUR_DOT[kleur]}`} />}
            <span
              className="text-sm font-medium tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {leeftijd.toFixed(1)} jaar
            </span>
            {kleur && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${KLEUR_BADGE_KLEUREN[kleur]}`}
              >
                {KLEUR_LABELS[kleur]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Geslacht */}
            <span
              className="text-xs font-medium"
              style={{
                color:
                  speler.geslacht === "M"
                    ? "var(--color-info-400, #60a5fa)"
                    : "var(--color-error-400, #f87171)",
              }}
            >
              {speler.geslacht === "M" ? "Heren" : "Dames"}
            </span>

            {/* Status */}
            <span className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_KLEUREN[speler.status]}`} />
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {STATUS_LABELS[speler.status] ?? speler.status}
              </span>
            </span>
          </div>

          {/* Huidig team in scenario */}
          {huidigTeamNaam && (
            <span className="text-xs" style={{ color: "var(--ow-oranje-400)" }}>
              In: {huidigTeamNaam}
            </span>
          )}
        </div>
      </div>

      {/* ---- Huidig veld ---- */}
      {huidig?.team && (
        <div
          className="mb-3 rounded-lg px-3 py-2"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-default)",
          }}
        >
          <span
            className="mb-0.5 block text-[10px] font-medium tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Huidig team (dit seizoen)
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {huidig.team}
          </span>
        </div>
      )}

      {/* ---- Spelerspad (laatste 3 seizoenen) ---- */}
      {recentPad.length > 0 && (
        <div className="mb-4">
          <span
            className="mb-1.5 block text-[10px] font-medium tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Spelerspad
          </span>
          <div className="flex flex-col gap-1">
            {recentPad.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg px-3 py-1.5"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {entry.seizoen}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {entry.team}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Notitie ---- */}
      {speler.notitie && (
        <div
          className="mb-4 rounded-lg px-3 py-2"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-default)",
          }}
        >
          <span
            className="mb-0.5 block text-[10px] font-medium tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Notitie
          </span>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {speler.notitie}
          </p>
        </div>
      )}

      {/* ---- Acties ---- */}
      <div className="flex flex-col gap-2">
        {/* Verwijder uit team */}
        {huidigTeamId && onRemove && (
          <motion.button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              minHeight: 44,
            }}
            onClick={() => {
              onRemove(speler.id);
              onClose();
            }}
            whileTap={{ scale: 0.97 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Verwijder uit {huidigTeamNaam ?? "team"}
          </motion.button>
        )}

        {/* Verplaats naar ander team */}
        {onMoveToTeam && andereTeams.length > 0 && (
          <div>
            <span
              className="mb-1.5 block text-[10px] font-medium tracking-wider uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Verplaats naar
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {andereTeams.map((team) => (
                <motion.button
                  key={team.id}
                  type="button"
                  className="flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                    minHeight: 44,
                  }}
                  onClick={() => {
                    onMoveToTeam(speler.id, team.id);
                    onClose();
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {team.naam}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
