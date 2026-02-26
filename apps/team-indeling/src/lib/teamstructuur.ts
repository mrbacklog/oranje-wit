import type { TeamCategorie, Kleur } from "@oranje-wit/database";

export interface TeamVoorstel {
  naam: string; // "Rood-1", "U15-1", "Senioren 3"
  categorie: TeamCategorie;
  kleur: Kleur | null;
  format: "viertal" | "achttal";
  geschatAantal: number;
}

export interface SpelerBasis {
  id: string;
  geboortejaar: number;
  geslacht: "M" | "V";
  status: string;
}

/**
 * Kleur-configuratie: leeftijdsbereik, spelvorm en streef-teamgrootte.
 */
interface KleurConfig {
  kleur: Kleur;
  label: string;
  minLeeftijd: number;
  maxLeeftijd: number;
  format: "viertal" | "achttal";
  streefPerTeam: number;
}

const KLEUREN: KleurConfig[] = [
  { kleur: "BLAUW", label: "Blauw", minLeeftijd: 5, maxLeeftijd: 7, format: "viertal", streefPerTeam: 6 },
  { kleur: "GROEN", label: "Groen", minLeeftijd: 8, maxLeeftijd: 9, format: "viertal", streefPerTeam: 6 },
  { kleur: "GEEL", label: "Geel", minLeeftijd: 10, maxLeeftijd: 12, format: "achttal", streefPerTeam: 10 },
  { kleur: "ORANJE", label: "Oranje", minLeeftijd: 13, maxLeeftijd: 15, format: "achttal", streefPerTeam: 10 },
  { kleur: "ROOD", label: "Rood", minLeeftijd: 16, maxLeeftijd: 18, format: "achttal", streefPerTeam: 10 },
];

/**
 * Berekent optimale teamstructuur op basis van beschikbare leden.
 *
 * @param spelers - Alle spelers in de pool
 * @param keuzeWaardes - Gekozen opties per keuze-ID (bijv. { "u15_teams": "2" })
 * @param seizoenJaar - Het startjaar van het seizoen (bijv. 2026 voor 2026-2027)
 * @returns Array van teamvoorstellen
 */
export function berekenTeamstructuur(
  spelers: SpelerBasis[],
  keuzeWaardes: Record<string, string>,
  seizoenJaar: number
): TeamVoorstel[] {
  // Filter spelers die gaan stoppen
  const beschikbaar = spelers.filter((s) => s.status !== "GAAT_STOPPEN");

  // Bereken leeftijd op peildatum (31 december van seizoenJaar)
  const metLeeftijd = beschikbaar.map((s) => ({
    ...s,
    leeftijd: seizoenJaar - s.geboortejaar,
  }));

  const teams: TeamVoorstel[] = [];

  // --- B-categorie: verdeel per kleur ---
  for (const config of KLEUREN) {
    const groep = metLeeftijd.filter(
      (s) => s.leeftijd >= config.minLeeftijd && s.leeftijd <= config.maxLeeftijd
    );

    if (groep.length === 0) continue;

    const aantalTeams = Math.max(1, Math.round(groep.length / config.streefPerTeam));
    const spelersPerTeam = Math.ceil(groep.length / aantalTeams);

    for (let i = 1; i <= aantalTeams; i++) {
      teams.push({
        naam: `${config.label}-${i}`,
        categorie: "B_CATEGORIE",
        kleur: config.kleur,
        format: config.format,
        geschatAantal: Math.min(spelersPerTeam, groep.length - spelersPerTeam * (i - 1)),
      });
    }
  }

  // --- A-categorie: uit keuzeWaardes ---
  // Zoek keuzes die gaan over A-categorie teams (bijv. "u15_teams", "u17_teams")
  for (const [keuzeId, waarde] of Object.entries(keuzeWaardes)) {
    const aantalMatch = waarde.match(/^(\d+)/);
    if (!aantalMatch) continue;
    const aantal = parseInt(aantalMatch[1], 10);
    if (aantal <= 0) continue;

    // Probeer A-categorie label af te leiden uit keuze-ID
    const label = keuzeId.replace(/_teams?$/i, "").replace(/_/g, " ").toUpperCase();

    for (let i = 1; i <= aantal; i++) {
      teams.push({
        naam: `${label}-${i}`,
        categorie: "A_CATEGORIE",
        kleur: null,
        format: "achttal",
        geschatAantal: 10,
      });
    }
  }

  // --- Senioren: uit keuzeWaardes ---
  const seniorenKey = Object.keys(keuzeWaardes).find(
    (k) => k.toLowerCase().includes("senioren") || k.toLowerCase().includes("senior")
  );
  if (seniorenKey) {
    const match = keuzeWaardes[seniorenKey].match(/^(\d+)/);
    if (match) {
      const aantalSenioren = parseInt(match[1], 10);
      const seniorenSpelers = metLeeftijd.filter((s) => s.leeftijd >= 19);
      const perTeam = seniorenSpelers.length > 0
        ? Math.ceil(seniorenSpelers.length / aantalSenioren)
        : 10;

      for (let i = 1; i <= aantalSenioren; i++) {
        teams.push({
          naam: `Senioren ${i}`,
          categorie: "SENIOREN",
          kleur: null,
          format: "achttal",
          geschatAantal: Math.min(perTeam, seniorenSpelers.length - perTeam * (i - 1)),
        });
      }
    }
  } else {
    // Fallback: als er geen senioren-keuze is, maak teams op basis van aantallen
    const seniorenSpelers = metLeeftijd.filter((s) => s.leeftijd >= 19);
    if (seniorenSpelers.length > 0) {
      const aantalTeams = Math.max(1, Math.round(seniorenSpelers.length / 10));
      const perTeam = Math.ceil(seniorenSpelers.length / aantalTeams);

      for (let i = 1; i <= aantalTeams; i++) {
        teams.push({
          naam: `Senioren ${i}`,
          categorie: "SENIOREN",
          kleur: null,
          format: "achttal",
          geschatAantal: Math.min(perTeam, seniorenSpelers.length - perTeam * (i - 1)),
        });
      }
    }
  }

  return teams;
}
