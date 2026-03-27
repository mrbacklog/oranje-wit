"use client";

import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";

const GROEP_GRADIENT: Record<LeeftijdsgroepNaam, { from: string; to: string }> = {
  paars: { from: "var(--knkv-paars-500)", to: "var(--knkv-paars-400)" },
  blauw: { from: "var(--knkv-blauw-500)", to: "var(--knkv-blauw-400)" },
  groen: { from: "var(--knkv-groen-500)", to: "var(--knkv-groen-400)" },
  geel: { from: "var(--knkv-geel-500)", to: "var(--knkv-geel-400)" },
  oranje: { from: "var(--knkv-oranje-500)", to: "var(--knkv-oranje-400)" },
  rood: { from: "var(--knkv-rood-500)", to: "var(--knkv-rood-400)" },
};

const FALLBACK_GRADIENT = { from: "var(--ow-zwart-400)", to: "var(--ow-zwart-500)" };

export function SpelerInitiaal({
  roepnaam,
  leeftijdsgroep,
  small = false,
}: {
  roepnaam: string;
  leeftijdsgroep: LeeftijdsgroepNaam;
  small?: boolean;
}) {
  const gradient = GROEP_GRADIENT[leeftijdsgroep] ?? FALLBACK_GRADIENT;
  const initiaal = roepnaam.charAt(0).toUpperCase();
  const size = small ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div
      className={`flex ${size} flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm`}
      style={{
        background: `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})`,
      }}
    >
      {initiaal}
    </div>
  );
}
