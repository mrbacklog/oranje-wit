"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Spring presets uit animatie-spec ───

const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.8 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15, mass: 1 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 20, mass: 1.2 },
  dramatic: { type: "spring" as const, stiffness: 150, damping: 12, mass: 1.5 },
};

// ─── Confetti kleuren (leeftijdsgroep-kleuren) ───

const CONFETTI_KLEUREN = [
  "var(--knkv-blauw-500)",
  "var(--knkv-groen-500)",
  "var(--knkv-geel-400)",
  "var(--knkv-oranje-500)",
  "var(--knkv-rood-500)",
  "var(--ow-oranje-600)",
  "var(--tier-goud-icon)",
];

// ─── Types ───

export interface CelebrationProps {
  xpGained: number;
  badgeUnlocked?: { badge: string; naam: string };
  kaartData?: { overall: number; tier: string; isNieuw: boolean };
  teamModus?: boolean;
  aantalRapporten?: number;
  onDismiss: () => void;
}

// ─── Confetti Particle ───

interface ConfettiParticle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  type: "circle" | "rect" | "triangle";
}

function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 1.5,
    color: CONFETTI_KLEUREN[Math.floor(Math.random() * CONFETTI_KLEUREN.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    type: (["circle", "rect", "triangle"] as const)[Math.floor(Math.random() * 3)],
  }));
}

function ConfettiShape({ particle }: { particle: ConfettiParticle }) {
  if (particle.type === "circle") {
    return (
      <circle
        cx={particle.size / 2}
        cy={particle.size / 2}
        r={particle.size / 2}
        fill={particle.color}
      />
    );
  }
  if (particle.type === "rect") {
    return <rect width={particle.size} height={particle.size * 0.6} rx={1} fill={particle.color} />;
  }
  // triangle
  const h = particle.size;
  return <polygon points={`${h / 2},0 ${h},${h} 0,${h}`} fill={particle.color} />;
}

// ─── Counter animatie ───

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target <= 0) return;

    const startTime = performance.now();
    let frame: number;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return <>{current}</>;
}

// ─── CelebrationOverlay ───

export function CelebrationOverlay({
  xpGained,
  badgeUnlocked,
  kaartData,
  teamModus = false,
  aantalRapporten,
  onDismiss,
}: CelebrationProps) {
  const [fase, setFase] = useState(0);
  const confetti = useMemo(() => generateConfetti(teamModus ? 50 : 30), [teamModus]);

  // Animatie-sequentie: elke fase na een delay
  useEffect(() => {
    const timers = [
      setTimeout(() => setFase(1), 300), // confetti start
      setTimeout(() => setFase(2), 800), // kaart verschijnt
      setTimeout(() => setFase(3), 1500), // score telt op
      setTimeout(() => setFase(4), 2200), // XP float
      setTimeout(() => setFase(5), 2800), // badge (als die er is)
      setTimeout(() => setFase(6), 3400), // knoppen
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleScoutNog = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Donkere achtergrond */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Confetti-regen */}
        {fase >= 1 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  x: `${p.x}vw`,
                  y: "-10%",
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: "110vh",
                  rotate: p.rotation + 720,
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "linear",
                }}
                className="absolute"
              >
                <svg width={p.size} height={p.size} viewBox={`0 0 ${p.size} ${p.size}`}>
                  <ConfettiShape particle={p} />
                </svg>
              </motion.div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          {/* Titel */}
          {fase >= 2 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springs.bouncy}
            >
              {teamModus ? (
                <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30">
                  <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-white">
                    <path
                      d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={2.5} />
                    <path
                      d="M23 21v-2a4 4 0 00-3-3.87"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    <path
                      d="M16 3.13a4 4 0 010 7.75"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              ) : (
                <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30">
                  <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-white">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          )}

          {fase >= 2 && (
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springs.gentle, delay: 0.1 }}
              className="mb-1 text-2xl font-bold text-white"
            >
              {teamModus ? "Team gescout!" : "Rapport ingediend!"}
            </motion.h2>
          )}

          {fase >= 2 && teamModus && aantalRapporten && (
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springs.gentle, delay: 0.2 }}
              className="mb-6 text-sm text-white/70"
            >
              {aantalRapporten} spelers beoordeeld
            </motion.p>
          )}

          {!teamModus && fase >= 2 && (
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springs.gentle, delay: 0.2 }}
              className="mb-6 text-sm text-white/70"
            >
              Beoordeling opgeslagen
            </motion.p>
          )}

          {/* Score kaart(en) */}
          {fase >= 3 && kaartData && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ ...springs.dramatic, delay: 0 }}
              className="mb-6"
            >
              <div
                className={`rounded-2xl border-2 px-8 py-6 text-center shadow-2xl ${
                  kaartData.tier === "goud"
                    ? "border-yellow-400 bg-gradient-to-b from-yellow-400/20 to-yellow-600/10 shadow-yellow-400/20"
                    : kaartData.tier === "zilver"
                      ? "border-gray-300 bg-gradient-to-b from-gray-300/20 to-gray-500/10 shadow-gray-300/20"
                      : "border-amber-600 bg-gradient-to-b from-amber-600/20 to-amber-800/10 shadow-amber-600/20"
                } `}
              >
                <p className="mb-1 text-xs tracking-wider text-white/60 uppercase">
                  {kaartData.isNieuw ? "Nieuwe kaart" : "Kaart bijgewerkt"}
                </p>
                <p className="text-5xl font-black text-white">
                  <AnimatedCounter target={kaartData.overall} duration={1200} />
                </p>
                <p className="mt-1 text-xs font-semibold tracking-widest text-white/50 uppercase">
                  Overall
                </p>
              </div>
            </motion.div>
          )}

          {/* Team-modus: meerdere mini-kaarten */}
          {fase >= 3 && teamModus && !kaartData && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springs.bouncy}
              className="mb-6 flex gap-2"
            >
              {Array.from({ length: Math.min(aantalRapporten ?? 3, 5) }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...springs.snappy, delay: i * 0.1 }}
                  className="h-16 w-12 rounded-lg border border-white/20 bg-gradient-to-b from-white/10 to-white/5"
                />
              ))}
              {(aantalRapporten ?? 0) > 5 && (
                <div className="flex items-center text-sm text-white/50">
                  +{(aantalRapporten ?? 0) - 5}
                </div>
              )}
            </motion.div>
          )}

          {/* XP float */}
          {fase >= 4 && (
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={springs.bouncy}
              className="mb-4 flex items-center gap-4"
            >
              <div className="bg-surface-card/10 rounded-2xl px-6 py-3 backdrop-blur-sm">
                <motion.p className="text-2xl font-black" style={{ color: "var(--ow-oranje-500)" }}>
                  +<AnimatedCounter target={xpGained} duration={800} /> XP
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Badge unlock */}
          {fase >= 5 && badgeUnlocked && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springs.dramatic}
              className="mb-6"
            >
              <div className="rounded-2xl border border-yellow-400/50 bg-yellow-500/20 px-6 py-3 backdrop-blur-sm">
                <p className="mb-1 text-xs font-semibold tracking-wider text-yellow-300 uppercase">
                  Badge ontgrendeld
                </p>
                <p className="text-lg font-bold text-yellow-200">{badgeUnlocked.naam}</p>
              </div>
            </motion.div>
          )}

          {/* Actie-knoppen */}
          {fase >= 6 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springs.gentle, delay: 0 }}
              className="flex w-full max-w-xs flex-col gap-3"
            >
              <button
                type="button"
                onClick={handleScoutNog}
                className="bg-ow-oranje shadow-ow-oranje/30 w-full rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.97]"
              >
                {teamModus ? "Scout nog een team" : "Scout nog een speler"}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="active:bg-surface-card/5 w-full rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition-all"
              >
                Terug naar home
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
