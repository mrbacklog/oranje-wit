"use client";

import type { TeamData, TeamGroepConfig } from "./types";
import TeamGroep from "./TeamGroep";

interface NavigatorProps {
  teams: TeamData[];
  zichtbaar: Set<string>;
  onToggle: (teamId: string) => void;
  onToggleAlles: (teamIds: string[], aan: boolean) => void;
}

/**
 * Groepeer teams dynamisch:
 * - B-categorie per kleur (Blauw, Groen, Geel, Oranje, Rood)
 * - A-categorie (U15, U17, U19)
 * - Senioren
 * - Overig (Recreanten, Midweek, Kangaroes)
 */
function groepeerTeams(teams: TeamData[]): TeamGroepConfig[] {
  const groepen: TeamGroepConfig[] = [];

  // B-categorie per kleur
  const bKleurVolgorde = ["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"];
  const bTeams = teams.filter((t) => t.categorie === "B_CATEGORIE");
  for (const kleur of bKleurVolgorde) {
    const kleurTeams = bTeams.filter((t) => t.kleur === kleur);
    if (kleurTeams.length > 0) {
      const kleurLabels: Record<string, string> = {
        BLAUW: "Blauw",
        GROEN: "Groen",
        GEEL: "Geel",
        ORANJE: "Oranje",
        ROOD: "Rood",
      };
      groepen.push({
        label: kleurLabels[kleur] ?? kleur,
        teams: kleurTeams,
      });
    }
  }
  // B-teams zonder kleur
  const bZonderKleur = bTeams.filter((t) => !t.kleur);
  if (bZonderKleur.length > 0) {
    groepen.push({ label: "B-categorie", teams: bZonderKleur });
  }

  // A-categorie
  const aTeams = teams.filter((t) => t.categorie === "A_CATEGORIE");
  if (aTeams.length > 0) {
    groepen.push({ label: "A-categorie", teams: aTeams });
  }

  // Senioren
  const seniorenTeams = teams.filter((t) => t.categorie === "SENIOREN");
  if (seniorenTeams.length > 0) {
    groepen.push({ label: "Senioren", teams: seniorenTeams });
  }

  return groepen;
}

export default function Navigator({
  teams,
  zichtbaar,
  onToggle,
  onToggleAlles,
}: NavigatorProps) {
  const groepen = groepeerTeams(teams);

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Teams</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 max-h-[calc(100vh-12rem)]">
        {groepen.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Geen teams beschikbaar
          </p>
        ) : (
          groepen.map((groep) => (
            <TeamGroep
              key={groep.label}
              label={groep.label}
              teams={groep.teams}
              zichtbaar={zichtbaar}
              onToggle={onToggle}
              onToggleAlles={onToggleAlles}
            />
          ))
        )}
      </div>
    </aside>
  );
}
