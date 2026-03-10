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
 * B-team voorstel per kleurcategorie (voor wizard preview).
 */
export interface BTeamVoorstel {
  kleur: Kleur;
  label: string;
  format: "viertal" | "achttal";
  streefPerTeam: number;
  aantalSpelers: number;
  aantalM: number;
  aantalV: number;
  aantalTeams: number;
}

/**
 * A-categorie configuratie (U15/U17/U19).
 */
export interface ACatConfig {
  niveau: "U15" | "U17" | "U19";
  aantalTeams: number;
}

/**
 * Leeftijdsverdeling per kleurcategorie (voor wizard preview).
 */
export interface KleurVerdeling {
  kleur: Kleur;
  label: string;
  format: "viertal" | "achttal";
  streefPerTeam: number;
  minLeeftijd: number;
  maxLeeftijd: number;
  aantalSpelers: number;
  aantalM: number;
  aantalV: number;
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

/** Statussen die uitgesloten worden bij wizard-berekeningen. */
const UITGESLOTEN_STATUSSEN = new Set(["GAAT_STOPPEN", "ALGEMEEN_RESERVE"]);

/** A-categorie leeftijdsbanden (peildatum 31 dec). */
const A_CAT_BANDEN: Record<string, { minLeeftijd: number; maxLeeftijd: number }> = {
  U15: { minLeeftijd: 13, maxLeeftijd: 14 },
  U17: { minLeeftijd: 15, maxLeeftijd: 16 },
  U19: { minLeeftijd: 17, maxLeeftijd: 18 },
};

const KLEUREN: KleurConfig[] = [
  {
    kleur: "BLAUW",
    label: "Blauw",
    minLeeftijd: 5,
    maxLeeftijd: 7,
    format: "viertal",
    streefPerTeam: 6,
  },
  {
    kleur: "GROEN",
    label: "Groen",
    minLeeftijd: 8,
    maxLeeftijd: 9,
    format: "viertal",
    streefPerTeam: 6,
  },
  {
    kleur: "GEEL",
    label: "Geel",
    minLeeftijd: 10,
    maxLeeftijd: 12,
    format: "achttal",
    streefPerTeam: 10,
  },
  {
    kleur: "ORANJE",
    label: "Oranje",
    minLeeftijd: 13,
    maxLeeftijd: 15,
    format: "achttal",
    streefPerTeam: 10,
  },
  {
    kleur: "ROOD",
    label: "Rood",
    minLeeftijd: 16,
    maxLeeftijd: 18,
    format: "achttal",
    streefPerTeam: 10,
  },
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
    const label = keuzeId
      .replace(/_teams?$/i, "")
      .replace(/_/g, " ")
      .toUpperCase();

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
      const perTeam =
        seniorenSpelers.length > 0 ? Math.ceil(seniorenSpelers.length / aantalSenioren) : 10;

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

/**
 * Berekent de leeftijdsverdeling per kleurcategorie (voor wizard preview).
 */
export function berekenLeeftijdVerdeling(
  spelers: SpelerBasis[],
  seizoenJaar: number
): KleurVerdeling[] {
  const beschikbaar = spelers.filter((s) => !UITGESLOTEN_STATUSSEN.has(s.status));

  return KLEUREN.map((config) => {
    const groep = beschikbaar.filter((s) => {
      const leeftijd = seizoenJaar - s.geboortejaar;
      return leeftijd >= config.minLeeftijd && leeftijd <= config.maxLeeftijd;
    });

    return {
      kleur: config.kleur,
      label: config.label,
      format: config.format,
      streefPerTeam: config.streefPerTeam,
      minLeeftijd: config.minLeeftijd,
      maxLeeftijd: config.maxLeeftijd,
      aantalSpelers: groep.length,
      aantalM: groep.filter((s) => s.geslacht === "M").length,
      aantalV: groep.filter((s) => s.geslacht === "V").length,
    };
  });
}

/**
 * Berekent B-team voorstel op basis van beschikbare spelers minus A-cat/senioren.
 */
export function berekenBTeamVoorstel(
  spelers: SpelerBasis[],
  seizoenJaar: number,
  aantalSenioren: number,
  aCatTeams: ACatConfig[]
): BTeamVoorstel[] {
  const beschikbaar = spelers.filter((s) => !UITGESLOTEN_STATUSSEN.has(s.status));
  const metLeeftijd = beschikbaar.map((s) => ({
    ...s,
    leeftijd: seizoenJaar - s.geboortejaar,
  }));

  // Bepaal welke spelers naar A-cat gaan (op basis van leeftijdsband)
  const aCatSpelerIds = new Set<string>();
  for (const { niveau, aantalTeams } of aCatTeams) {
    if (aantalTeams <= 0) continue;
    const band = A_CAT_BANDEN[niveau];
    if (!band) continue;
    const kandidaten = metLeeftijd.filter(
      (s) => s.leeftijd >= band.minLeeftijd && s.leeftijd <= band.maxLeeftijd
    );
    // Schat: aantalTeams × 10 spelers naar A-cat (max beschikbaar)
    const geschat = Math.min(aantalTeams * 10, kandidaten.length);
    kandidaten.slice(0, geschat).forEach((s) => aCatSpelerIds.add(s.id));
  }

  // Senioren uitsluiten
  const seniorenSpelers = metLeeftijd.filter((s) => s.leeftijd >= 19);
  const seniorenGeschat = Math.min(aantalSenioren * 10, seniorenSpelers.length);
  const seniorenIds = new Set(seniorenSpelers.slice(0, seniorenGeschat).map((s) => s.id));

  // B-categorie: resterende spelers
  const bSpelers = metLeeftijd.filter((s) => !aCatSpelerIds.has(s.id) && !seniorenIds.has(s.id));

  return KLEUREN.map((config) => {
    const groep = bSpelers.filter(
      (s) => s.leeftijd >= config.minLeeftijd && s.leeftijd <= config.maxLeeftijd
    );

    const aantalTeams =
      groep.length === 0 ? 0 : Math.max(1, Math.round(groep.length / config.streefPerTeam));

    return {
      kleur: config.kleur,
      label: config.label,
      format: config.format,
      streefPerTeam: config.streefPerTeam,
      aantalSpelers: groep.length,
      aantalM: groep.filter((s) => s.geslacht === "M").length,
      aantalV: groep.filter((s) => s.geslacht === "V").length,
      aantalTeams,
    };
  });
}

/**
 * Bouwt TeamVoorstel[] op basis van wizard-input (senioren + A-cat + B-team overschrijvingen).
 */
export function bouwTeamVoorstellen(
  spelers: SpelerBasis[],
  seizoenJaar: number,
  aantalSenioren: number,
  aCatTeams: ACatConfig[],
  bTeamOverrides?: Record<string, number>
): TeamVoorstel[] {
  const beschikbaar = spelers.filter((s) => !UITGESLOTEN_STATUSSEN.has(s.status));
  const metLeeftijd = beschikbaar.map((s) => ({
    ...s,
    leeftijd: seizoenJaar - s.geboortejaar,
  }));

  const teams: TeamVoorstel[] = [];

  // --- Senioren ---
  if (aantalSenioren > 0) {
    const seniorenSpelers = metLeeftijd.filter((s) => s.leeftijd >= 19);
    const perTeam =
      seniorenSpelers.length > 0 ? Math.ceil(seniorenSpelers.length / aantalSenioren) : 10;

    for (let i = 1; i <= aantalSenioren; i++) {
      teams.push({
        naam: `Senioren ${i}`,
        categorie: "SENIOREN",
        kleur: null,
        format: "achttal",
        geschatAantal: Math.min(perTeam, Math.max(0, seniorenSpelers.length - perTeam * (i - 1))),
      });
    }
  }

  // --- A-categorie ---
  for (const { niveau, aantalTeams } of aCatTeams) {
    for (let i = 1; i <= aantalTeams; i++) {
      teams.push({
        naam: `${niveau}-${i}`,
        categorie: "A_CATEGORIE",
        kleur: null,
        format: "achttal",
        geschatAantal: 10,
      });
    }
  }

  // --- B-categorie ---
  const bVoorstel = berekenBTeamVoorstel(spelers, seizoenJaar, aantalSenioren, aCatTeams);
  for (const voorstel of bVoorstel) {
    const aantalTeams = bTeamOverrides?.[voorstel.kleur] ?? voorstel.aantalTeams;
    if (aantalTeams <= 0) continue;

    const spelersPerTeam = Math.ceil(voorstel.aantalSpelers / aantalTeams);

    for (let i = 1; i <= aantalTeams; i++) {
      teams.push({
        naam: `${voorstel.label}-${i}`,
        categorie: "B_CATEGORIE",
        kleur: voorstel.kleur,
        format: voorstel.format,
        geschatAantal: Math.min(
          spelersPerTeam,
          Math.max(0, voorstel.aantalSpelers - spelersPerTeam * (i - 1))
        ),
      });
    }
  }

  return teams;
}
