"use client";

import { useMemo } from "react";
import type { TeamData as UITeamData } from "./types";
import type {
  TeamData as ValidatieTeamData,
  SpelerData as ValidatieSpelerData,
} from "@/lib/validatie/regels";
import { berekenImpact } from "@/lib/validatie/impact";
import type { ImpactAnalyse } from "@/lib/validatie/impact";

function mapNaarValidatieTeam(team: UITeamData): ValidatieTeamData {
  return {
    naam: team.naam,
    categorie: team.categorie,
    kleur: team.kleur,
    niveau: team.niveau,
    spelers: team.spelers.map(
      (ts): ValidatieSpelerData => ({
        id: ts.spelerId,
        roepnaam: ts.speler.roepnaam,
        achternaam: ts.speler.achternaam,
        geboortejaar: ts.speler.geboortejaar,
        geslacht: ts.speler.geslacht,
        status: ts.statusOverride ?? ts.speler.status,
      })
    ),
  };
}

function barKleur(totaal: number, min: number): string {
  if (totaal >= min + 2) return "bg-green-500";
  if (totaal >= min) return "bg-orange-400";
  return "bg-red-500";
}

interface ImpactOverzichtProps {
  teams: UITeamData[];
}

export default function ImpactOverzicht({ teams }: ImpactOverzichtProps) {
  const analyses = useMemo<ImpactAnalyse[]>(() => {
    return teams.map((t) => berekenImpact(mapNaarValidatieTeam(t)));
  }, [teams]);

  if (analyses.length === 0) {
    return <p className="text-xs text-gray-400">Geen teams om te analyseren.</p>;
  }

  // Bepaal max voor schaal
  const maxTotaal = Math.max(
    ...analyses.flatMap((a) => [
      a.huidig.totaal,
      a.bestCase.totaal,
      a.verwacht.totaal,
      a.worstCase.totaal,
    ]),
    1
  );

  return (
    <div className="space-y-4">
      {analyses.map((analyse) => {
        const scenarios = [
          { label: "Huidig", data: analyse.huidig },
          { label: "Best case", data: analyse.bestCase },
          { label: "Verwacht", data: analyse.verwacht },
          { label: "Worst case", data: analyse.worstCase },
        ];

        return (
          <div key={analyse.teamNaam} className="overflow-hidden rounded-lg border border-gray-100">
            <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-800">{analyse.teamNaam}</span>
            </div>
            <div className="space-y-1.5 px-3 py-2">
              {scenarios.map(({ label, data }) => {
                const pct = maxTotaal > 0 ? (data.totaal / maxTotaal) * 100 : 0;
                // Minimum 8 voor achttal als vuistregel
                const kleur = barKleur(data.totaal, 8);

                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-right text-[10px] text-gray-500">
                      {label}
                    </span>
                    <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${kleur} transition-all`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-[10px] text-gray-600">
                      {data.m}M + {data.v}V = {data.totaal}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-50 px-3 py-1.5">
              <p className="text-[10px] leading-snug text-gray-400">
                {analyse.verwacht.beschrijving}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
