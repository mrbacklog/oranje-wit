"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { TeamData } from "../types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/types";
import TeamSlide from "./TeamSlide";

interface TeamCarouselProps {
  /** Alle teams in de versie */
  teams: TeamData[];
  /** Index van het actieve (zichtbare) team */
  activeIndex: number;
  /** Callback wanneer de gebruiker naar een ander team swipet */
  onIndexChange: (index: number) => void;
  /** Validatie resultaten per team-id */
  validatieMap?: Map<string, TeamValidatie>;
  /** Callback: tapped op een speler */
  onSpelerClick?: (spelerId: string) => void;
  /** Callback: open de pool om speler toe te voegen */
  onAddSpeler?: () => void;
  /** Callback: verwijder speler uit team */
  onRemoveSpeler?: (spelerId: string, teamId: string) => void;
}

/**
 * TeamCarousel -- Horizontale snap-scroll carousel van teams.
 *
 * Features:
 * - CSS scroll-snap-type: x mandatory
 * - Per team een TeamSlide
 * - Dots indicator bovenaan (welk team je bekijkt)
 * - Scroll event detectie -> update activeTeamIndex
 * - Touch targets minimaal 44px
 */
export default function TeamCarousel({
  teams,
  activeIndex,
  onIndexChange,
  validatieMap,
  onSpelerClick,
  onAddSpeler,
  onRemoveSpeler,
}: TeamCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Scroll naar het actieve team wanneer activeIndex programmatisch verandert
  useEffect(() => {
    if (isScrolling) return;
    const container = scrollRef.current;
    if (!container) return;

    const slideWidth = container.clientWidth;
    const targetScroll = activeIndex * slideWidth;

    if (Math.abs(container.scrollLeft - targetScroll) > 10) {
      container.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  }, [activeIndex, isScrolling]);

  // Detecteer scroll-positie om activeIndex te updaten
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      const slideWidth = container.clientWidth;
      if (slideWidth === 0) return;
      const newIndex = Math.round(container.scrollLeft / slideWidth);
      const clampedIndex = Math.max(0, Math.min(newIndex, teams.length - 1));
      if (clampedIndex !== activeIndex) {
        onIndexChange(clampedIndex);
      }
    }, 100);
  }, [teams.length, activeIndex, onIndexChange]);

  // Cleanup timeout bij unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (teams.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        <p className="text-sm">Geen teams in dit scenario.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ---- Dots indicator ---- */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {teams.map((team, i) => {
          const validatie = validatieMap?.get(team.id);
          const dotColor =
            validatie?.status === "ROOD"
              ? "#ef4444"
              : validatie?.status === "ORANJE"
                ? "#f59e0b"
                : validatie?.status === "GROEN"
                  ? "#22c55e"
                  : "var(--text-tertiary)";

          return (
            <motion.button
              key={team.id}
              type="button"
              className="rounded-full"
              style={{
                width: i === activeIndex ? 20 : 8,
                height: 8,
                backgroundColor: i === activeIndex ? dotColor : "var(--border-default)",
                minWidth: 8,
                minHeight: 8,
              }}
              animate={{
                width: i === activeIndex ? 20 : 8,
                backgroundColor: i === activeIndex ? dotColor : "var(--border-default)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onIndexChange(i)}
              aria-label={`Ga naar ${team.naam}`}
              aria-current={i === activeIndex ? "true" : undefined}
            />
          );
        })}
      </div>

      {/* ---- Scroll container ---- */}
      <div
        ref={scrollRef}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
        onScroll={handleScroll}
      >
        {teams.map((team) => (
          <div
            key={team.id}
            className="w-full flex-shrink-0 snap-center"
            style={{ scrollSnapAlign: "center" }}
          >
            <TeamSlide
              team={team}
              validatie={validatieMap?.get(team.id)}
              onSpelerClick={onSpelerClick}
              onAddSpeler={onAddSpeler}
              onRemoveSpeler={
                onRemoveSpeler ? (spelerId) => onRemoveSpeler(spelerId, team.id) : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
