"use client";

/**
 * HeroTellers — grote tellerblokken met count-up animatie en oranje glow.
 * Toont rol-specifieke tellers direct onder de begroeting.
 */

import { useEffect, useRef, useState } from "react";

export interface Teller {
  label: string;
  waarde: number;
  href: string;
}

interface HeroTellersProps {
  tellers: Teller[];
}

// ── Count-up hook ───────────────────────────────────────────────

function useCountUp(target: number, duur: number = 300): number {
  const [waarde, setWaarde] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setWaarde(0);
      return;
    }

    // Respecteer prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setWaarde(target);
      return;
    }

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const voortgang = Math.min((timestamp - startRef.current) / duur, 1);
      // Ease-out quad
      const eased = 1 - (1 - voortgang) * (1 - voortgang);
      setWaarde(Math.round(eased * target));

      if (voortgang < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duur]);

  return waarde;
}

// ── TellerBlok ──────────────────────────────────────────────────

function TellerBlok({ teller, index }: { teller: Teller; index: number }) {
  const displayed = useCountUp(teller.waarde);
  const heeftWaarde = teller.waarde > 0;

  return (
    <a
      href={teller.href}
      className={`animate-fade-in flex-1 rounded-2xl p-4 transition-transform active:scale-[0.98] ${
        index === 0
          ? "animate-fade-in-delay-2"
          : index === 1
            ? "animate-fade-in-delay-3"
            : "animate-fade-in-delay-4"
      }`}
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        boxShadow: heeftWaarde ? "0 0 20px rgba(249,115,22,0.15)" : "none",
        textDecoration: "none",
        display: "block",
        minHeight: "44px",
      }}
    >
      <div
        className="text-[48px] leading-none font-bold tracking-tight"
        style={{
          color: heeftWaarde ? "var(--text-primary)" : "var(--text-tertiary)",
        }}
      >
        {displayed}
      </div>
      <div
        className="mt-1.5 text-xs font-medium tracking-wider uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        {teller.label}
      </div>
    </a>
  );
}

// ── HeroTellers ─────────────────────────────────────────────────

export function HeroTellers({ tellers }: HeroTellersProps) {
  if (tellers.length === 0) return null;

  return (
    <div className="flex gap-3 px-5">
      {tellers.map((teller, i) => (
        <TellerBlok key={teller.label} teller={teller} index={i} />
      ))}
    </div>
  );
}
