"use client";

import { motion } from "framer-motion";
import type { TeamData } from "../types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/types";
import {
  KLEUR_BADGE_KLEUREN,
  KLEUR_LABELS,
  CATEGORIE_BADGE,
  CATEGORIE_BADGE_LABEL,
} from "../types";
import MobileSpelerKaart from "./MobileSpelerKaart";
import { sorteerSpelers } from "../types";

interface TeamSlideProps {
  /** Team data */
  team: TeamData;
  /** Validatie resultaat voor dit team */
  validatie?: TeamValidatie;
  /** Callback: voeg speler toe aan dit team */
  onAddSpeler?: () => void;
  /** Callback: tapped op een speler */
  onSpelerClick?: (spelerId: string) => void;
  /** Callback: verwijder speler uit team */
  onRemoveSpeler?: (spelerId: string) => void;
}

/** Teamgrootte target op basis van teamtype */
function getTarget(team: TeamData): number {
  if (team.teamType === "VIERTAL") return 6;
  if (team.categorie === "SENIOREN") return 12;
  if (team.categorie === "A_CATEGORIE") return 12;
  return 10; // B-categorie achtal standaard
}

/**
 * TeamSlide -- Een team als slide in de carousel.
 *
 * Features:
 * - Header: teamnaam + categorie badge + validatie badge
 * - Vulgraad: progress bar (spelers.length / target)
 * - Speler grid: responsive grid van MobileSpelerKaart
 * - Lege plekken als gestippelde "+" kaartjes
 * - Validatie strip: KNKV + OW status
 * - "Speler toevoegen" button
 */
export default function TeamSlide({
  team,
  validatie,
  onAddSpeler,
  onSpelerClick,
  onRemoveSpeler,
}: TeamSlideProps) {
  const target = getTarget(team);
  const count = team.spelers.length;
  const percentage = Math.min(Math.round((count / target) * 100), 100);
  const gesorteerd = sorteerSpelers(team.spelers);
  const legePlekken = Math.max(0, target - count);

  // Validatie status kleuren
  const statusKleur =
    validatie?.status === "GROEN"
      ? "#22c55e"
      : validatie?.status === "ORANJE"
        ? "#f59e0b"
        : validatie?.status === "ROOD"
          ? "#ef4444"
          : "var(--text-tertiary)";

  const vulgraadKleur =
    percentage >= 80
      ? { from: "#16a34a", to: "#22c55e" }
      : percentage >= 50
        ? { from: "#d97706", to: "#f59e0b" }
        : { from: "#dc2626", to: "#ef4444" };

  // Tel kritieke/aandacht meldingen
  const kritiekCount = validatie?.meldingen.filter((m) => m.ernst === "kritiek").length ?? 0;
  const aandachtCount = validatie?.meldingen.filter((m) => m.ernst === "aandacht").length ?? 0;

  return (
    <div
      className="flex h-full w-full flex-col overflow-y-auto px-4 pb-28"
      style={{ scrollbarWidth: "none" }}
    >
      {/* ---- Header ---- */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {team.naam}
          </h2>
          {/* Kleur badge */}
          {team.kleur && KLEUR_BADGE_KLEUREN[team.kleur] && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${KLEUR_BADGE_KLEUREN[team.kleur]}`}
            >
              {KLEUR_LABELS[team.kleur]}
            </span>
          )}
          {/* Categorie badge */}
          {team.categorie !== "B_CATEGORIE" && CATEGORIE_BADGE[team.categorie] && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORIE_BADGE[team.categorie]}`}
            >
              {CATEGORIE_BADGE_LABEL[team.categorie]}
            </span>
          )}
        </div>

        {/* Validatie status dot */}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusKleur }} />
          {kritiekCount > 0 && (
            <span className="text-[10px] font-semibold text-red-400">{kritiekCount} kritiek</span>
          )}
          {aandachtCount > 0 && kritiekCount === 0 && (
            <span className="text-[10px] font-semibold text-yellow-400">
              {aandachtCount} aandacht
            </span>
          )}
        </div>
      </div>

      {/* ---- Vulgraad bar ---- */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {count} / {target} spelers
          </span>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {percentage}%
          </span>
        </div>
        <div
          className="relative h-1.5 w-full overflow-hidden rounded-full"
          style={{
            backgroundColor: "var(--surface-raised)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${vulgraadKleur.from}, ${vulgraadKleur.to})`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* ---- Validatie strip (compacte meldingen) ---- */}
      {validatie && validatie.meldingen.length > 0 && (
        <div
          className="mb-3 rounded-lg px-3 py-2"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: `1px solid ${statusKleur}33`,
          }}
        >
          {validatie.meldingen.slice(0, 2).map((melding, i) => (
            <div
              key={i}
              className="flex items-start gap-2 py-0.5 text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    melding.ernst === "kritiek"
                      ? "#ef4444"
                      : melding.ernst === "aandacht"
                        ? "#f59e0b"
                        : "var(--text-tertiary)",
                }}
              />
              <span className="line-clamp-1">{melding.bericht}</span>
            </div>
          ))}
          {validatie.meldingen.length > 2 && (
            <span className="mt-1 block text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              +{validatie.meldingen.length - 2} meer
            </span>
          )}
        </div>
      )}

      {/* ---- Speler grid ---- */}
      <div className="grid grid-cols-1 gap-2">
        {gesorteerd.map((ts) => (
          <MobileSpelerKaart
            key={ts.spelerId}
            speler={ts}
            onTap={() => onSpelerClick?.(ts.spelerId)}
            onRemove={onRemoveSpeler ? () => onRemoveSpeler(ts.spelerId) : undefined}
          />
        ))}

        {/* Lege plekken */}
        {Array.from({ length: Math.min(legePlekken, 3) }).map((_, i) => (
          <motion.button
            key={`empty-${i}`}
            type="button"
            className="flex min-h-[56px] w-full items-center justify-center rounded-xl border-2 border-dashed"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-tertiary)",
              minHeight: 44,
            }}
            onClick={onAddSpeler}
            whileTap={{ scale: 0.97 }}
            aria-label="Speler toevoegen"
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </motion.button>
        ))}
      </div>

      {/* ---- Toevoegen button ---- */}
      {onAddSpeler && (
        <motion.button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
          style={{
            background: "linear-gradient(135deg, rgba(255,133,51,0.15), rgba(255,107,0,0.1))",
            border: "1px solid rgba(255,133,51,0.3)",
            color: "var(--ow-oranje-400, #fb923c)",
            minHeight: 44,
          }}
          onClick={onAddSpeler}
          whileTap={{ scale: 0.97 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Speler toevoegen
        </motion.button>
      )}
    </div>
  );
}
