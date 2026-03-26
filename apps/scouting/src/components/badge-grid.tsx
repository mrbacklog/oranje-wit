"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Alle beschikbare badges met iconen en voorwaarde-hints ───

const ALLE_BADGES: Record<string, BadgeDef> = {
  eerste_rapport: {
    naam: "Eerste Rapport",
    beschrijving: "Je eerste scouting-rapport ingediend",
    icoon: "clipboard",
    hint: "Dien je eerste rapport in",
  },
  vijf_rapporten: {
    naam: "Vijf in de pocket",
    beschrijving: "5 scouting-rapporten ingediend",
    icoon: "five",
    hint: "Dien 5 rapporten in",
  },
  tien_rapporten: {
    naam: "Dubbele cijfers",
    beschrijving: "10 scouting-rapporten ingediend",
    icoon: "ten",
    hint: "Dien 10 rapporten in",
  },
  vijfentwintig_rapporten: {
    naam: "Kwart eeuw",
    beschrijving: "25 scouting-rapporten ingediend",
    icoon: "star",
    hint: "Dien 25 rapporten in",
  },
  vijftig_rapporten: {
    naam: "Halve Eeuw",
    beschrijving: "50 scouting-rapporten ingediend",
    icoon: "trophy",
    hint: "Dien 50 rapporten in",
  },
  vijf_unieke_spelers: {
    naam: "Breed kijker",
    beschrijving: "5 verschillende spelers gescout",
    icoon: "eye",
    hint: "Scout 5 verschillende spelers",
  },
  tien_unieke_spelers: {
    naam: "Talentenjager",
    beschrijving: "10 verschillende spelers gescout",
    icoon: "target",
    hint: "Scout 10 verschillende spelers",
  },
  drie_contexten: {
    naam: "Veelzijdig",
    beschrijving: "Gescouted in wedstrijd, training en overig",
    icoon: "circle-three",
    hint: "Scout in alle drie contexten",
  },
  wedstrijd_specialist: {
    naam: "Wedstrijd-specialist",
    beschrijving: "10 wedstrijdrapporten ingediend",
    icoon: "whistle",
    hint: "Dien 10 wedstrijdrapporten in",
  },
};

interface BadgeDef {
  naam: string;
  beschrijving: string;
  icoon: string;
  hint: string;
}

interface UnlockedBadge {
  id: string;
  naam: string | null;
  beschrijving: string | null;
  unlockedAt: string;
}

interface BadgeGridProps {
  /** Ontgrendelde badges van de scout */
  unlockedBadges: UnlockedBadge[];
}

export function BadgeGrid({ unlockedBadges }: BadgeGridProps) {
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null);

  const unlockedIds = new Set(unlockedBadges.map((b) => b.id));

  const handleBadgeTap = useCallback((badgeId: string) => {
    setGeselecteerd((prev) => (prev === badgeId ? null : badgeId));
  }, []);

  const sluitDetail = useCallback(() => {
    setGeselecteerd(null);
  }, []);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(ALLE_BADGES).map(([id, badge]) => {
          const unlocked = unlockedIds.has(id);
          const unlockedData = unlockedBadges.find((b) => b.id === id);

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleBadgeTap(id)}
              className={`touch-target flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all active:scale-95 ${
                unlocked ? "bg-surface-card" : "bg-surface-card/50 opacity-50"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  unlocked
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md shadow-yellow-500/20"
                    : "bg-surface-elevated"
                }`}
              >
                {unlocked ? (
                  <BadgeIcoon icoon={badge.icoon} />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-text-muted h-5 w-5"
                    strokeWidth={1.5}
                  >
                    <circle cx="12" cy="12" r="3" stroke="currentColor" />
                    <path
                      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
                      stroke="currentColor"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-center text-[11px] leading-tight font-medium ${
                  unlocked ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {unlocked ? badge.naam : "???"}
              </span>
              {unlocked && unlockedData && (
                <span className="text-text-muted text-[9px]">
                  {new Date(unlockedData.unlockedAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail-modal */}
      <AnimatePresence>
        {geselecteerd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] flex items-center justify-center"
            onClick={sluitDetail}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-surface-card relative z-10 mx-6 w-full max-w-xs rounded-3xl p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <BadgeDetail
                badgeId={geselecteerd}
                unlocked={unlockedIds.has(geselecteerd)}
                unlockedAt={unlockedBadges.find((b) => b.id === geselecteerd)?.unlockedAt}
                onClose={sluitDetail}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Badge detail modal ───

function BadgeDetail({
  badgeId,
  unlocked,
  unlockedAt,
  onClose,
}: {
  badgeId: string;
  unlocked: boolean;
  unlockedAt?: string;
  onClose: () => void;
}) {
  const badge = ALLE_BADGES[badgeId];
  if (!badge) return null;

  return (
    <>
      <div
        className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
          unlocked
            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30"
            : "bg-surface-elevated"
        }`}
      >
        {unlocked ? (
          <BadgeIcoon icoon={badge.icoon} size="lg" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="text-text-muted h-8 w-8"
            strokeWidth={1.5}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" />
          </svg>
        )}
      </div>
      <h3 className="text-text-primary mb-1 text-lg font-bold">
        {unlocked ? badge.naam : "Vergrendeld"}
      </h3>
      <p className="text-text-secondary mb-3 text-sm">
        {unlocked ? badge.beschrijving : badge.hint}
      </p>
      {unlocked && unlockedAt && (
        <p className="text-text-muted mb-4 text-xs">
          Behaald op{" "}
          {new Date(unlockedAt).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="touch-target bg-surface-elevated text-text-primary active:bg-surface-dark w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
      >
        Sluiten
      </button>
    </>
  );
}

// ─── Badge iconen (inline SVG) ───

function BadgeIcoon({ icoon, size = "sm" }: { icoon: string; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-8 w-8 text-white" : "h-5 w-5 text-white";

  switch (icoon) {
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" />
        </svg>
      );
    case "five":
    case "ten":
      return (
        <span className={`font-black ${size === "lg" ? "text-2xl" : "text-base"}`}>
          {icoon === "five" ? "5" : "10"}
        </span>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "trophy":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <path
            d="M6 9H4a2 2 0 01-2-2V5h4m12 4h2a2 2 0 002-2V5h-4M8 3h8v7a4 4 0 01-8 0V3zM10 14v2m4-2v2M8 20h8M12 16v4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" />
          <circle cx="12" cy="12" r="6" stroke="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case "circle-three":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <circle cx="8" cy="10" r="4" stroke="currentColor" />
          <circle cx="16" cy="10" r="4" stroke="currentColor" />
          <circle cx="12" cy="16" r="4" stroke="currentColor" />
        </svg>
      );
    case "whistle":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} strokeWidth={2}>
          <circle cx="12" cy="14" r="6" stroke="currentColor" />
          <path
            d="M12 8V2M8 4l4-2 4 2"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
  }
}
