import { berekenKorfbalLeeftijd } from "@oranje-wit/types";
import type { WerkbordTeam } from "@/components/werkbord/types";

function gemLeeftijd(team: WerkbordTeam, peildatum: Date): number | null {
  const spelers = [...team.dames, ...team.heren];
  if (spelers.length === 0) return null;

  const leeftijden = spelers
    .map((s) => berekenKorfbalLeeftijd(s.speler.geboortedatum, s.speler.geboortejaar, peildatum))
    .filter((l) => l > 0);

  if (leeftijden.length === 0) return null;
  return leeftijden.reduce((a, b) => a + b, 0) / leeftijden.length;
}

/**
 * Rangschikt B-categorie teams op gemiddelde korfballeeftijd (hoog→laag)
 * en kent J1, J2, … toe. Teams zonder spelers krijgen geen J-nummer.
 * Retourneert een map van teamId → "J1", "J2", etc.
 */
export function berekenJNummers(teams: WerkbordTeam[], peildatum: Date): Map<string, string> {
  const bTeams = teams.filter((t) => t.teamCategorie === "B_CATEGORIE");

  const metLeeftijd = bTeams
    .map((t) => ({ id: t.id, leeftijd: gemLeeftijd(t, peildatum) }))
    .filter((t) => t.leeftijd !== null)
    .sort((a, b) => (b.leeftijd ?? 0) - (a.leeftijd ?? 0));

  const result = new Map<string, string>();
  metLeeftijd.forEach((t, i) => {
    result.set(t.id, `J${i + 1}`);
  });
  return result;
}
