"use client";

import type { SpelerStatus } from "@oranje-wit/database";
import type { SpelerData } from "./types";
import { STATUS_KLEUREN, KLEUR_DOT, korfbalLeeftijd, kleurIndicatie } from "./types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";
import AfmeldBadge from "./AfmeldBadge";

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Stopt",
  NIEUW_POTENTIEEL: "Nieuw",
  NIEUW_DEFINITIEF: "Nieuw",
};

export default function PanelSpelerRij({
  speler,
  statusOverride,
  onSpelerClick,
}: {
  speler: SpelerData;
  statusOverride: SpelerStatus | null;
  onSpelerClick?: (speler: SpelerData) => void;
}) {
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleurInd = kleurIndicatie(leeftijd);
  const status = statusOverride ?? speler.status;

  return (
    <div
      className={`flex items-center gap-2 rounded px-2 py-1 ${onSpelerClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
      onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
    >
      <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="xs" />
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_KLEUREN[status]}`} />
      <span
        className={`flex min-w-0 flex-1 items-center gap-1 text-sm text-gray-800 ${onSpelerClick ? "hover:text-orange-600" : ""}`}
      >
        <span className="truncate">
          {speler.roepnaam} {speler.achternaam}
        </span>
        {speler.afmelddatum && <AfmeldBadge afmelddatum={speler.afmelddatum} />}
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5">
        {kleurInd && <span className={`h-1.5 w-1.5 rounded-full ${KLEUR_DOT[kleurInd]}`} />}
        <span className="text-xs text-gray-400 tabular-nums">{leeftijd.toFixed(2)}</span>
      </span>
      <span className="shrink-0 text-xs">{speler.geslacht === "M" ? "\u2642" : "\u2640"}</span>
      {status !== "BESCHIKBAAR" && (
        <span className="text-[10px] text-gray-400">{STATUS_LABELS[status] ?? status}</span>
      )}
    </div>
  );
}
