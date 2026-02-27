/**
 * Regelvalidatie-engine voor teamindelingen.
 *
 * Controleert KNKV-regels (hard) en OW-voorkeuren (zacht)
 * en kent een stoplicht-status toe per team.
 */

// ============================================================
// Types
// ============================================================

export type ValidatieStatus = "GROEN" | "ORANJE" | "ROOD";
export type MeldingErnst = "kritiek" | "aandacht" | "info";

export interface ValidatieMelding {
  regel: string;
  bericht: string;
  ernst: MeldingErnst;
}

export interface TeamValidatie {
  status: ValidatieStatus;
  meldingen: ValidatieMelding[];
}

export interface TeamData {
  naam: string;
  categorie: "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE";
  kleur?: "BLAUW" | "GROEN" | "GEEL" | "ORANJE" | "ROOD" | null;
  niveau?: string | null;
  spelers: SpelerData[];
}

export interface SpelerData {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geslacht: "M" | "V";
  status?: "BESCHIKBAAR" | "TWIJFELT" | "GAAT_STOPPEN" | "NIEUW";
}

// ============================================================
// Constanten & Targets
// ============================================================

/** Standaard teamgrootte-grenzen (gebruikt als fallback). */
const DEFAULT_TEAMGROOTTE = {
  viertal: { min: 4, ideaalMin: 5, ideaalMax: 6, max: 8 },
  achttal: { min: 8, ideaalMin: 9, ideaalMax: 11, max: 13 },
} as const;

/**
 * Optionele teamgrootte-targets vanuit de blauwdruk.
 * Als meegegeven, worden ideaalMin/ideaalMax hieruit afgeleid.
 */
export interface TeamgrootteOverrides {
  viertal?: { min: number; ideaal: number; max: number };
  breedteAchttal?: { min: number; ideaal: number; max: number };
  aCatTeam?: { min: number; ideaal: number; max: number };
}

function getTeamgrootte(
  format: "viertal" | "achttal",
  isACat: boolean,
  overrides?: TeamgrootteOverrides
) {
  const defaults = DEFAULT_TEAMGROOTTE[format];

  if (!overrides) return defaults;

  if (format === "viertal" && overrides.viertal) {
    return {
      min: Math.max(defaults.min, overrides.viertal.min - 1),
      ideaalMin: overrides.viertal.min,
      ideaalMax: overrides.viertal.max,
      max: overrides.viertal.max + 2,
    };
  }

  if (format === "achttal" && isACat && overrides.aCatTeam) {
    return {
      min: Math.max(defaults.min, overrides.aCatTeam.min - 2),
      ideaalMin: overrides.aCatTeam.min,
      ideaalMax: overrides.aCatTeam.max,
      max: overrides.aCatTeam.max + 2,
    };
  }

  if (format === "achttal" && !isACat && overrides.breedteAchttal) {
    return {
      min: Math.max(defaults.min, overrides.breedteAchttal.min - 1),
      ideaalMin: overrides.breedteAchttal.min,
      ideaalMax: overrides.breedteAchttal.max,
      max: overrides.breedteAchttal.max + 2,
    };
  }

  return defaults;
}

const KLEUR_FORMAT: Record<string, "viertal" | "achttal"> = {
  BLAUW: "viertal",
  GROEN: "viertal",
  GEEL: "achttal",
  ORANJE: "achttal",
  ROOD: "achttal",
};

/** Leeftijdsrange per kleur (min-max leeftijd in peiljaar). */
const KLEUR_LEEFTIJD: Record<string, { min: number; max: number }> = {
  BLAUW: { min: 5, max: 7 },
  GROEN: { min: 8, max: 9 },
  GEEL: { min: 10, max: 12 },
  ORANJE: { min: 13, max: 15 },
  ROOD: { min: 16, max: 18 },
};

const MIN_GEMIDDELDE_LEEFTIJD_8TAL = 9.0;

// ============================================================
// Hoofdfunctie
// ============================================================

export function valideerTeam(
  team: TeamData,
  seizoenJaar: number,
  overrides?: TeamgrootteOverrides
): TeamValidatie {
  const meldingen: ValidatieMelding[] = [];

  // Bepaal effectieve categorie (senioren splitsen in A/B)
  const isACat = team.categorie === "A_CATEGORIE" || isSeniorenA(team);
  const isBCat = team.categorie === "B_CATEGORIE" || isSeniorenB(team);

  // Bepaal teamtype
  if (isBCat && team.kleur) {
    valideerBCategorie(team, seizoenJaar, meldingen, overrides);
  } else if (isACat) {
    valideerACategorie(team, seizoenJaar, meldingen, overrides);
  } else if (team.categorie === "SENIOREN") {
    // Senioren zonder duidelijke A/B → valideer als achttal
    valideerSenioren(team, meldingen, overrides);
  }

  // Gender checks — categorie-afhankelijk
  valideerGender(team, isACat, meldingen);
  valideerDuplicaten(team, meldingen);

  // Bepaal overall status
  const heeftKritiek = meldingen.some((m) => m.ernst === "kritiek");
  const heeftAandacht = meldingen.some((m) => m.ernst === "aandacht");

  return {
    status: heeftKritiek ? "ROOD" : heeftAandacht ? "ORANJE" : "GROEN",
    meldingen,
  };
}

// ============================================================
// B-categorie validatie
// ============================================================

function valideerBCategorie(
  team: TeamData,
  seizoenJaar: number,
  meldingen: ValidatieMelding[],
  overrides?: TeamgrootteOverrides
) {
  const kleur = team.kleur!;
  const format = KLEUR_FORMAT[kleur];
  const grootte = getTeamgrootte(format, false, overrides);
  const aantalSpelers = team.spelers.length;

  // Teamgrootte
  if (aantalSpelers < grootte.min) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, minimum is ${grootte.min}`,
      ernst: "kritiek",
    });
  } else if (aantalSpelers > grootte.max) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, maximum is ${grootte.max}`,
      ernst: "kritiek",
    });
  } else if (
    aantalSpelers < grootte.ideaalMin ||
    aantalSpelers > grootte.ideaalMax
  ) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, ideaal is ${grootte.ideaalMin}-${grootte.ideaalMax}`,
      ernst: "aandacht",
    });
  }

  // Leeftijdsspreiding
  if (team.spelers.length > 0) {
    const jaren = team.spelers.map((s) => s.geboortejaar);
    const spreiding = Math.max(...jaren) - Math.min(...jaren);
    const maxSpreiding = format === "viertal" ? 2 : 3;

    if (spreiding > maxSpreiding) {
      meldingen.push({
        regel: "bandbreedte",
        bericht: `${team.naam}: leeftijdsspreiding ${spreiding} jaar, max is ${maxSpreiding}`,
        ernst: "kritiek",
      });
    }
  }

  // Individuele leeftijdscheck: speler past bij deze kleur?
  if (team.kleur && KLEUR_LEEFTIJD[team.kleur] && team.spelers.length > 0) {
    const range = KLEUR_LEEFTIJD[team.kleur];
    for (const speler of team.spelers) {
      const leeftijd = seizoenJaar - speler.geboortejaar;
      if (leeftijd < range.min || leeftijd > range.max) {
        meldingen.push({
          regel: "leeftijd_kleur",
          bericht: `${speler.roepnaam} ${speler.achternaam} (${leeftijd} jr) valt buiten ${team.kleur.toLowerCase()} (${range.min}-${range.max} jr)`,
          ernst: "aandacht",
        });
      }
    }
  }

  // Gemiddelde leeftijd (8-tallen)
  if (format === "achttal" && team.spelers.length > 0) {
    const gemiddeldGeboortejaar =
      team.spelers.reduce((sum, s) => sum + s.geboortejaar, 0) /
      team.spelers.length;
    const gemiddeldeLeeftijd = seizoenJaar - gemiddeldGeboortejaar;

    if (gemiddeldeLeeftijd < MIN_GEMIDDELDE_LEEFTIJD_8TAL) {
      meldingen.push({
        regel: "gemiddelde_leeftijd",
        bericht: `${team.naam}: gemiddelde leeftijd ${gemiddeldeLeeftijd.toFixed(1)}, minimum is ${MIN_GEMIDDELDE_LEEFTIJD_8TAL}`,
        ernst: "kritiek",
      });
    }
  }
}

// ============================================================
// A-categorie validatie
// ============================================================

function valideerACategorie(
  team: TeamData,
  seizoenJaar: number,
  meldingen: ValidatieMelding[],
  overrides?: TeamgrootteOverrides
) {
  const aantalSpelers = team.spelers.length;
  const grootte = getTeamgrootte("achttal", true, overrides);

  // Teamgrootte
  if (aantalSpelers < grootte.min) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, minimum is ${grootte.min}`,
      ernst: "kritiek",
    });
  } else if (aantalSpelers > grootte.max) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, maximum is ${grootte.max}`,
      ernst: "kritiek",
    });
  } else if (
    aantalSpelers < grootte.ideaalMin ||
    aantalSpelers > grootte.ideaalMax
  ) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, ideaal is ${grootte.ideaalMin}-${grootte.ideaalMax}`,
      ernst: "aandacht",
    });
  }

  // Bandbreedte: 2 geboortejaren per A-categorie
  if (team.spelers.length > 0) {
    const categorie = detecteerACategorie(team.naam);
    if (categorie) {
      const [minJaar, maxJaar] = aCategorieGeboortejaren(
        categorie,
        seizoenJaar
      );

      for (const speler of team.spelers) {
        if (speler.geboortejaar < minJaar || speler.geboortejaar > maxJaar) {
          meldingen.push({
            regel: "bandbreedte",
            bericht: `${speler.roepnaam} (${speler.geboortejaar}) valt buiten ${categorie}-bandbreedte (${minJaar}-${maxJaar})`,
            ernst: "kritiek",
          });
        }
      }
    }
  }
}

// ============================================================
// Generieke checks
// ============================================================

function valideerGender(
  team: TeamData,
  isACat: boolean,
  meldingen: ValidatieMelding[]
) {
  if (team.spelers.length === 0) return;

  // Blauw: geen genderonderscheid volgens KNKV
  if (team.kleur === "BLAUW") return;

  const aantalM = team.spelers.filter((s) => s.geslacht === "M").length;
  const aantalV = team.spelers.filter((s) => s.geslacht === "V").length;

  // OW-regel: nooit 1 kind alleen van één geslacht
  if (aantalM === 1 || aantalV === 1) {
    const geslacht = aantalM === 1 ? "jongen" : "meisje";
    meldingen.push({
      regel: "gender_alleen",
      bericht: `${team.naam}: slechts 1 ${geslacht} — OW-regel: minimaal 2 van elk geslacht`,
      ernst: "kritiek",
    });
  }

  // A-categorie: verplicht 4V + 4M (KNKV-regel)
  if (isACat && aantalM > 0 && aantalV > 0) {
    const ratio = Math.min(aantalM, aantalV) / Math.max(aantalM, aantalV);
    if (ratio < 0.75) {
      meldingen.push({
        regel: "gender_balans",
        bericht: `${team.naam}: ${aantalM}M + ${aantalV}V — KNKV vereist 4V+4M in A-categorie`,
        ernst: "kritiek",
      });
    }
  }

  // B-categorie: gender scheef is aandacht, geen harde eis
  if (!isACat && aantalM > 0 && aantalV > 0) {
    const ratio = Math.min(aantalM, aantalV) / Math.max(aantalM, aantalV);
    if (ratio < 0.5) {
      meldingen.push({
        regel: "gender_balans",
        bericht: `${team.naam}: ${aantalM}M + ${aantalV}V — genderbalans scheef`,
        ernst: "aandacht",
      });
    }
  }
}

function valideerDuplicaten(team: TeamData, meldingen: ValidatieMelding[]) {
  const ids = team.spelers.map((s) => s.id);
  const duplicaten = ids.filter((id, i) => ids.indexOf(id) !== i);

  for (const id of duplicaten) {
    const speler = team.spelers.find((s) => s.id === id)!;
    meldingen.push({
      regel: "duplicaat",
      bericht: `${speler.roepnaam} ${speler.achternaam} staat dubbel in ${team.naam}`,
      ernst: "kritiek",
    });
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Senioren A (Sen 1-4): wedstrijdkorfbal, A-categorie regels.
 */
function isSeniorenA(team: TeamData): boolean {
  if (team.categorie !== "SENIOREN") return false;
  const nummer = extractTeamNummer(team.naam);
  return nummer !== null && nummer <= 4;
}

/**
 * Senioren B (Sen 5+): breedtesport, B-categorie regels.
 */
function isSeniorenB(team: TeamData): boolean {
  if (team.categorie !== "SENIOREN") return false;
  const nummer = extractTeamNummer(team.naam);
  return nummer !== null && nummer >= 5;
}

function extractTeamNummer(naam: string): number | null {
  const match = naam.match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Senioren zonder duidelijke A/B indeling — valideer basisregels.
 */
function valideerSenioren(team: TeamData, meldingen: ValidatieMelding[], overrides?: TeamgrootteOverrides) {
  const aantalSpelers = team.spelers.length;
  const grootte = getTeamgrootte("achttal", false, overrides);

  if (aantalSpelers < grootte.min) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, minimum is ${grootte.min}`,
      ernst: "kritiek",
    });
  } else if (aantalSpelers > grootte.max) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, maximum is ${grootte.max}`,
      ernst: "kritiek",
    });
  } else if (
    aantalSpelers < grootte.ideaalMin ||
    aantalSpelers > grootte.ideaalMax
  ) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, ideaal is ${grootte.ideaalMin}-${grootte.ideaalMax}`,
      ernst: "aandacht",
    });
  }
}

function detecteerACategorie(
  teamNaam: string
): "U15" | "U17" | "U19" | null {
  const upper = teamNaam.toUpperCase();
  if (upper.includes("U15")) return "U15";
  if (upper.includes("U17")) return "U17";
  if (upper.includes("U19")) return "U19";
  return null;
}

function aCategorieGeboortejaren(
  categorie: "U15" | "U17" | "U19",
  seizoenJaar: number
): [number, number] {
  switch (categorie) {
    case "U15":
      return [seizoenJaar - 14, seizoenJaar - 13];
    case "U17":
      return [seizoenJaar - 16, seizoenJaar - 15];
    case "U19":
      return [seizoenJaar - 18, seizoenJaar - 17];
  }
}

/**
 * Valideer alle teams in een scenario op dubbele plaatsingen.
 */
export function valideerDubbeleSpelersOverTeams(
  teams: TeamData[]
): ValidatieMelding[] {
  const meldingen: ValidatieMelding[] = [];
  const spelerTeams = new Map<string, string[]>();

  for (const team of teams) {
    for (const speler of team.spelers) {
      const bestaand = spelerTeams.get(speler.id) || [];
      bestaand.push(team.naam);
      spelerTeams.set(speler.id, bestaand);
    }
  }

  for (const [spelerId, teamNamen] of spelerTeams) {
    if (teamNamen.length > 1) {
      // Zoek spelernaam
      const speler = teams
        .flatMap((t) => t.spelers)
        .find((s) => s.id === spelerId)!;
      meldingen.push({
        regel: "dubbele_plaatsing",
        bericht: `${speler.roepnaam} ${speler.achternaam} staat in ${teamNamen.length} teams: ${teamNamen.join(", ")}`,
        ernst: "kritiek",
      });
    }
  }

  return meldingen;
}
