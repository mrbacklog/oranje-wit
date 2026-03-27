"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SpelerData, TeamSpelerData } from "../types";
import { korfbalLeeftijd, kleurIndicatie, KLEUR_DOT, STATUS_KLEUREN } from "../types";

interface MobileSpelerKaartProps {
  /** Speler data — kan TeamSpelerData of losse SpelerData zijn */
  speler: TeamSpelerData | SpelerData;
  /** Callback bij tappen op de kaart */
  onTap?: () => void;
  /** Callback bij verwijderen (swipe left of long press) */
  onRemove?: () => void;
  /** Compacte modus (kleiner, minder info) */
  compact?: boolean;
}

/** Haal SpelerData op ongeacht of het een TeamSpelerData of SpelerData is */
function getSpelerData(speler: TeamSpelerData | SpelerData): SpelerData {
  if ("speler" in speler && speler.speler) {
    return speler.speler;
  }
  return speler as SpelerData;
}

/**
 * MobileSpelerKaart -- Compacte spelerskaart voor het mobile grid.
 *
 * Features:
 * - Avatar met leeftijdskleur gradient
 * - Roepnaam (max 1 regel, ellipsis)
 * - Korfballeeftijd met kleur-dot
 * - Geslacht indicator
 * - Swipe left om te verwijderen
 * - Tap = detail popup
 * - Touch target minimaal 44px
 */
export default function MobileSpelerKaart({
  speler,
  onTap,
  onRemove,
  compact = false,
}: MobileSpelerKaartProps) {
  const data = getSpelerData(speler);
  const leeftijd = korfbalLeeftijd(data.geboortedatum, data.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const statusOverride = "statusOverride" in speler ? speler.statusOverride : null;
  const effectiveStatus = statusOverride ?? data.status;

  const initialen = `${data.roepnaam.charAt(0)}${data.achternaam.charAt(0)}`.toUpperCase();

  // -- Swipe-to-remove state --
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swiping) return;
      currentXRef.current = e.touches[0].clientX;
      const dx = currentXRef.current - startXRef.current;
      // Alleen naar links swipen toestaan
      if (dx < 0) {
        setSwipeX(Math.max(dx, -80));
      }
    },
    [swiping]
  );

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (swipeX < -50 && onRemove) {
      // Verwijder threshold bereikt
      setSwipeX(-200); // Animeer weg
      setTimeout(() => onRemove(), 200);
    } else {
      setSwipeX(0);
    }
  }, [swipeX, onRemove]);

  const cardSize = compact ? "min-h-[56px]" : "min-h-[64px]";

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Verwijder-achtergrond (rood) */}
      <AnimatePresence>
        {swipeX < -10 && onRemove && (
          <motion.div
            className="absolute inset-0 flex items-center justify-end rounded-xl pr-4"
            style={{ backgroundColor: "var(--color-error-500, #ef4444)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kaart zelf */}
      <motion.button
        type="button"
        className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${cardSize}`}
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform 0.2s ease-out",
          minHeight: 44,
        }}
        onClick={onTap}
        onTouchStart={onRemove ? handleTouchStart : undefined}
        onTouchMove={onRemove ? handleTouchMove : undefined}
        onTouchEnd={onRemove ? handleTouchEnd : undefined}
        whileTap={{ scale: 0.97 }}
        aria-label={`${data.roepnaam} ${data.achternaam}`}
      >
        {/* Avatar met leeftijdskleur */}
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{
            background: kleur
              ? `linear-gradient(135deg, var(--tw-color-${kleur.toLowerCase()}-400, #888), var(--tw-color-${kleur.toLowerCase()}-600, #666))`
              : "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-700))",
          }}
        >
          {initialen}
          {/* Status dot */}
          {effectiveStatus && effectiveStatus !== "BESCHIKBAAR" && (
            <span
              className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 ${STATUS_KLEUREN[effectiveStatus]}`}
              style={{ borderColor: "var(--surface-card)" }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className="truncate text-sm leading-tight font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {data.roepnaam}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Kleur dot */}
            {kleur && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KLEUR_DOT[kleur]}`} />}
            {/* Leeftijd */}
            <span className="text-xs tabular-nums" style={{ color: "var(--text-tertiary)" }}>
              {leeftijd.toFixed(compact ? 0 : 1)}
            </span>
            {/* Geslacht */}
            <span
              className="text-xs font-medium"
              style={{
                color:
                  data.geslacht === "M"
                    ? "var(--color-info-400, #60a5fa)"
                    : "var(--color-error-400, #f87171)",
              }}
            >
              {data.geslacht === "M" ? "H" : "D"}
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
