"use client";

/**
 * HeroGreeting — tijdsgebonden begroeting met fade-in animatie.
 * Bepaalt ochtend/middag/avond client-side (gebruiker's lokale tijd).
 */

import { useEffect, useState } from "react";

interface HeroGreetingProps {
  naam?: string;
  rolLabel: string;
}

function getGroet(): { tekst: string; periode: "ochtend" | "middag" | "avond" } {
  const uur = new Date().getHours();
  if (uur >= 5 && uur < 12) return { tekst: "Goedemorgen", periode: "ochtend" };
  if (uur >= 12 && uur < 18) return { tekst: "Goedemiddag", periode: "middag" };
  return { tekst: "Goedenavond", periode: "avond" };
}

/** Radial gradient verschuift subtiel per dagdeel */
function heroGradient(periode: "ochtend" | "middag" | "avond"): string {
  switch (periode) {
    case "ochtend":
      return "radial-gradient(ellipse at top, rgba(249,115,22,0.08) 0%, transparent 60%)";
    case "middag":
      return "radial-gradient(ellipse at top, rgba(251,146,60,0.08) 0%, transparent 60%)";
    case "avond":
      return "radial-gradient(ellipse at top, rgba(249,115,22,0.06) 0%, rgba(30,58,138,0.03) 50%, transparent 70%)";
  }
}

export function HeroGreeting({ naam, rolLabel }: HeroGreetingProps) {
  const [mounted, setMounted] = useState(false);
  const [groet, setGroet] = useState<ReturnType<typeof getGroet>>({
    tekst: "Welkom",
    periode: "ochtend",
  });

  useEffect(() => {
    setGroet(getGroet());
    setMounted(true);
  }, []);

  const voornaam = naam?.split(" ")[0];

  return (
    <div
      className="px-5 pt-8 pb-6"
      style={{ background: mounted ? heroGradient(groet.periode) : "none" }}
    >
      <h1
        className="animate-fade-in text-[28px] leading-tight font-bold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {mounted ? groet.tekst : "Welkom"}
        {voornaam ? `, ${voornaam}` : ""}
      </h1>
      <p
        className="animate-fade-in animate-fade-in-delay-1 mt-1 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        {rolLabel}
      </p>
    </div>
  );
}
