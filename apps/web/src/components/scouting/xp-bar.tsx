"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface XPBarProps {
  /** Huidige XP van de scout */
  currentXP: number;
  /** XP nodig voor het volgende level (absoluut) */
  levelXP: number;
  /** Huidig level-nummer */
  level: number;
  /** Level-naam (bijv. "Verkenner") */
  levelNaam: string;
  /** Voortgang als fractie 0-1 */
  voortgang: number;
  /** Toon compacte variant (alleen bar, geen tekst) */
  compact?: boolean;
  /** Animeer een XP-gain */
  animateGain?: number;
}

export function XPBar({
  currentXP,
  levelXP,
  level,
  levelNaam,
  voortgang,
  compact = false,
  animateGain,
}: XPBarProps) {
  const [showGain, setShowGain] = useState(false);
  const [displayXP, setDisplayXP] = useState(currentXP - (animateGain ?? 0));
  const animFrameRef = useRef<number | null>(null);

  // Animeer XP counter bij gain
  useEffect(() => {
    if (!animateGain || animateGain <= 0) {
      setDisplayXP(currentXP);
      return;
    }

    setShowGain(true);
    const startXP = currentXP - animateGain;
    const startTime = performance.now();
    const duration = 800;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXP(Math.round(startXP + eased * animateGain!));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);

    const hideTimer = setTimeout(() => setShowGain(false), 2000);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearTimeout(hideTimer);
    };
  }, [currentXP, animateGain]);

  const pct = Math.min(100, Math.max(0, voortgang * 100));

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--knkv-paars-500)] text-[10px] font-bold text-white">
          {level}
        </div>
        <div className="bg-surface-elevated relative h-2 flex-1 overflow-hidden rounded-full">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--knkv-paars-500)] to-[var(--knkv-paars-400)]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <span className="text-text-muted text-[10px] font-medium tabular-nums">{displayXP} XP</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--knkv-paars-500)] text-xs font-bold text-white shadow-[var(--knkv-paars-500)]/30 shadow-sm">
            {level}
          </div>
          <span className="text-text-primary text-sm font-semibold">{levelNaam}</span>
        </div>
        <div className="relative flex items-center gap-1">
          <span className="text-text-secondary text-xs tabular-nums">
            {displayXP} / {levelXP} XP
          </span>
          {/* Floating +XP */}
          {showGain && animateGain && animateGain > 0 && (
            <motion.span
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -20, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute -top-4 -right-1 text-xs font-bold text-[var(--knkv-paars-400)]"
            >
              +{animateGain}
            </motion.span>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className="bg-surface-elevated relative h-3 overflow-hidden rounded-full">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--knkv-paars-500)] to-[var(--knkv-paars-400)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            boxShadow: showGain
              ? "0 0 12px 4px color-mix(in srgb, var(--knkv-paars-500) 30%, transparent)"
              : "none",
          }}
        />
      </div>
    </div>
  );
}
