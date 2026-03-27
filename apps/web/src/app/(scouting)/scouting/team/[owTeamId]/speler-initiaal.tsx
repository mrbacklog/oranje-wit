"use client";

import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";

const GROEP_GRADIENT: Record<LeeftijdsgroepNaam, string> = {
  paars: "from-purple-500 to-purple-400",
  blauw: "from-blue-500 to-blue-400",
  groen: "from-green-500 to-green-400",
  geel: "from-yellow-500 to-yellow-400",
  oranje: "from-orange-500 to-orange-400",
  rood: "from-red-500 to-red-400",
};

export function SpelerInitiaal({
  roepnaam,
  leeftijdsgroep,
  small = false,
}: {
  roepnaam: string;
  leeftijdsgroep: LeeftijdsgroepNaam;
  small?: boolean;
}) {
  const gradient = GROEP_GRADIENT[leeftijdsgroep] ?? "from-gray-400 to-gray-500";
  const initiaal = roepnaam.charAt(0).toUpperCase();
  const size = small ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div
      className={`flex ${size} flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-bold text-white shadow-sm`}
    >
      {initiaal}
    </div>
  );
}
