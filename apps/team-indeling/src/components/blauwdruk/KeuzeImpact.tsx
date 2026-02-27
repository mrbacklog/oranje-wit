"use client";

import type { LedenStatistieken } from "@/app/blauwdruk/actions";

interface KeuzeImpactProps {
  keuzes: { id: string; vraag: string; opties: string[] }[];
  statistieken: LedenStatistieken;
}

/**
 * Probeer een teamnummer uit een optie-tekst te halen, bijv. "2 teams" -> 2, "1 team" -> 1.
 */
function extractTeamAantal(optie: string): number | null {
  const match = optie.match(/(\d+)\s*team/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Zoek de best-passende categorie in de statistieken op basis van de vraagtekst.
 * Zoekt op kleurnaam of categorie-indicator (U15, U13, etc.).
 */
function vindCategorie(
  vraag: string,
  statistieken: LedenStatistieken
): { beschikbaar: number; streefPerTeam: number } | null {
  const lower = vraag.toLowerCase();

  // Probeer kleur te matchen
  for (const cat of statistieken.perCategorie) {
    if (lower.includes(cat.label.toLowerCase())) {
      return { beschikbaar: cat.beschikbaar + cat.nieuw, streefPerTeam: cat.streefPerTeam };
    }
  }

  // Probeer U-categorie te matchen (U7 = blauw, U9 = groen, U12 = geel, U15 = oranje, U18 = rood)
  const uMatch = lower.match(/u(\d+)/);
  if (uMatch) {
    const leeftijd = parseInt(uMatch[1], 10);
    const kleurMapping: Record<number, string> = {
      7: "BLAUW",
      9: "GROEN",
      12: "GEEL",
      15: "ORANJE",
      18: "ROOD",
    };
    const kleur = kleurMapping[leeftijd];
    if (kleur) {
      const cat = statistieken.perCategorie.find((c) => c.kleur === kleur);
      if (cat) {
        return { beschikbaar: cat.beschikbaar + cat.nieuw, streefPerTeam: cat.streefPerTeam };
      }
    }
  }

  // Check "senioren"
  if (lower.includes("senior")) {
    return {
      beschikbaar: statistieken.senioren.beschikbaar + statistieken.senioren.nieuw,
      streefPerTeam: 10,
    };
  }

  return null;
}

/**
 * Bepaal de kleur-indicatie op basis van spelers per team vs. streef.
 * Achttal (streef 6): groen 5-8, oranje buiten, rood <4 of >10
 * Overige (streef 10): groen 8-12, oranje buiten, rood <6 of >14
 */
function impactKleur(
  spelersPerTeam: number,
  streefPerTeam: number
): string {
  if (streefPerTeam <= 6) {
    // Achttal / viertal
    if (spelersPerTeam >= 5 && spelersPerTeam <= 8) return "badge-green";
    if (spelersPerTeam >= 4 && spelersPerTeam <= 10) return "badge-orange";
    return "badge-red";
  }
  // Grotere teams
  if (spelersPerTeam >= 8 && spelersPerTeam <= 12) return "badge-green";
  if (spelersPerTeam >= 6 && spelersPerTeam <= 14) return "badge-orange";
  return "badge-red";
}

export default function KeuzeImpact({
  keuzes,
  statistieken,
}: KeuzeImpactProps) {
  if (keuzes.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-sm text-gray-400 italic">
            Voeg keuzes toe om de impact te zien.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keuzes.map((keuze) => {
        const categorie = vindCategorie(keuze.vraag, statistieken);

        return (
          <div key={keuze.id} className="card">
            <div className="card-header">
              <h4 className="text-sm font-medium text-gray-700">
                {keuze.vraag || "Nog geen vraag ingevuld"}
              </h4>
            </div>
            <div className="card-body">
              {keuze.opties.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Geen opties</p>
              ) : (
                <div className="space-y-2">
                  {keuze.opties.map((optie, i) => {
                    const teamAantal = extractTeamAantal(optie);

                    if (teamAantal && categorie) {
                      const perTeam = Math.round(
                        categorie.beschikbaar / teamAantal
                      );

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-sm text-gray-700">{optie}</span>
                          <span className={impactKleur(perTeam, categorie.streefPerTeam)}>
                            ~{perTeam} spelers/team
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">{optie}</span>
                        <span className="badge-gray">geen impact berekend</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {categorie && (
                <p className="mt-2 text-xs text-gray-400">
                  {categorie.beschikbaar} beschikbare spelers in deze categorie
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
