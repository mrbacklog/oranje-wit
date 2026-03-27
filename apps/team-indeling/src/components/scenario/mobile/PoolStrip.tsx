"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SpelerData } from "../types";
import { korfbalLeeftijd, kleurIndicatie, KLEUR_DOT } from "../types";

interface PoolStripProps {
  /** Ongeplaatste spelers */
  poolSpelers: SpelerData[];
  /** Callback: open de pool sheet */
  onOpen: () => void;
  /** Is de pool sheet momenteel open? */
  isOpen: boolean;
}

/**
 * PoolStrip -- Sticky balk boven BottomNav.
 *
 * Features:
 * - Toont ongeplaatste spelers count
 * - Horizontaal scrollbare rij met mini speler pills
 * - Tap opent PoolSheet
 * - Glassmorphism achtergrond
 */
export default function PoolStrip({ poolSpelers, onOpen, isOpen }: PoolStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (poolSpelers.length === 0) return null;

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-30"
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <motion.button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: "rgba(20, 22, 28, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "1px solid var(--border-default)",
              minHeight: 52,
            }}
            onClick={onOpen}
            aria-label={`${poolSpelers.length} ongeplaatste spelers, tik om te openen`}
          >
            {/* Count badge */}
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-700))",
                color: "#ffffff",
                boxShadow: "0 0 12px rgba(255,133,51,0.3)",
              }}
            >
              {poolSpelers.length}
            </div>

            {/* Scrollbare pills */}
            <div
              ref={scrollRef}
              className="flex flex-1 gap-1.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
              onClick={(e) => e.stopPropagation()}
            >
              {poolSpelers.slice(0, 15).map((speler) => {
                const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
                const kleur = kleurIndicatie(leeftijd);
                return (
                  <span
                    key={speler.id}
                    className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {kleur && (
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KLEUR_DOT[kleur]}`} />
                    )}
                    {speler.roepnaam}
                  </span>
                );
              })}
              {poolSpelers.length > 15 && (
                <span
                  className="flex shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  +{poolSpelers.length - 15}
                </span>
              )}
            </div>

            {/* Chevron up */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden="true"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
