/**
 * Blauwdruk-kader-validatie voor what-ifs.
 *
 * Controleert of het aantal teams per categorie in de samengevoegde
 * staat (what-if + werkindeling) overeenkomt met de blauwdruk-kaders.
 *
 * Afwijkingen zijn geen harde fouten maar vereisen een toelichting
 * van de TC bij het toepassen van de what-if.
 */

import type { TeamData } from "../validatie/types";
import { teamNaarCategorieSleutel } from "../validatie/helpers";
import type { KaderAfwijking } from "./types";

/**
 * Kaders voor het verwachte aantal teams per categorie.
 * Key = categorie-sleutel (bijv. "GEEL", "ORANJE", "U15", "SENIOREN_A")
 * Value = verwacht aantal teams
 */
export type TeamAantalKaders = Record<string, number>;

/**
 * Check of de samengevoegde teamlijst (what-if + werkindeling)
 * afwijkt van de blauwdruk teamaantal-kaders.
 *
 * Telt het werkelijke aantal teams per categorie en vergelijkt
 * met het verwachte aantal uit de blauwdruk.
 */
export function valideerBlauwdrukKaders(
  samengevoegdeTeams: TeamData[],
  kaders: TeamAantalKaders
): KaderAfwijking[] {
  if (Object.keys(kaders).length === 0) return [];

  // Tel werkelijk aantal teams per categorie
  const tellingen = telTeamsPerCategorie(samengevoegdeTeams);

  const afwijkingen: KaderAfwijking[] = [];

  // Check elke categorie in de kaders
  for (const [categorie, verwachtAantal] of Object.entries(kaders)) {
    const werkelijkAantal = tellingen.get(categorie) ?? 0;
    const verschil = werkelijkAantal - verwachtAantal;

    if (verschil !== 0) {
      afwijkingen.push({
        categorie,
        verwachtAantal,
        werkelijkAantal,
        verschil,
      });
    }
  }

  return afwijkingen;
}

/**
 * Tel het aantal teams per categorie-sleutel.
 */
function telTeamsPerCategorie(teams: TeamData[]): Map<string, number> {
  const tellingen = new Map<string, number>();

  for (const team of teams) {
    // Sla lege teams over (geen spelers = niet ingedeeld)
    if (team.spelers.length === 0) continue;

    const sleutel = teamNaarCategorieSleutel(team);
    tellingen.set(sleutel, (tellingen.get(sleutel) ?? 0) + 1);
  }

  return tellingen;
}
