/**
 * Validatie voor selecties (altijd 2 achtallen).
 * Een selectie is een gedeelde spelerspool voor 2 teams.
 */
import type { ValidatieStatus, ValidatieMelding, BlauwdrukKaders } from "./regels";
import { KLEUR_VEILIGE_RANGE } from "./regels";
import { grofKorfbalLeeftijd, formatKorfbalLeeftijd } from "@oranje-wit/types";

export interface SelectieValidatie {
  status: ValidatieStatus;
  meldingen: ValidatieMelding[];
}

interface SelectieSpeler {
  id: string;
  geboortejaar: number;
  geslacht: "M" | "V";
}

interface SelectieTeamInfo {
  kleur: string | null;
  categorie: string;
}

// 2 achtallen: ideaal 18-22 spelers (2× 9-11)
const SELECTIE_GROOTTE = {
  min: 16,
  ideaalMin: 18,
  ideaalMax: 22,
  max: 26,
};

/**
 * Valideer een selectie (2 achtallen) als geheel.
 */
export function valideerSelectie(
  spelers: SelectieSpeler[],
  teams: SelectieTeamInfo[],
  peildatum: Date,
  _kaders?: BlauwdrukKaders
): SelectieValidatie {
  const meldingen: ValidatieMelding[] = [];
  const aantal = spelers.length;

  // --- Teamgrootte ---
  if (aantal < SELECTIE_GROOTTE.min) {
    meldingen.push({
      regel: "selectie_teamgrootte",
      ernst: "kritiek",
      bericht: `Te weinig spelers: ${aantal} (min ${SELECTIE_GROOTTE.min} voor 2 achtallen)`,
    });
  } else if (aantal > SELECTIE_GROOTTE.max) {
    meldingen.push({
      regel: "selectie_teamgrootte",
      ernst: "kritiek",
      bericht: `Te veel spelers: ${aantal} (max ${SELECTIE_GROOTTE.max} voor 2 achtallen)`,
    });
  } else if (aantal < SELECTIE_GROOTTE.ideaalMin || aantal > SELECTIE_GROOTTE.ideaalMax) {
    meldingen.push({
      regel: "selectie_teamgrootte",
      ernst: "aandacht",
      bericht: `${aantal} spelers (ideaal ${SELECTIE_GROOTTE.ideaalMin}-${SELECTIE_GROOTTE.ideaalMax} voor 2 achtallen)`,
    });
  }

  // --- Genderbalans ---
  const aantalM = spelers.filter((s) => s.geslacht === "M").length;
  const aantalV = spelers.filter((s) => s.geslacht === "V").length;
  // Minimaal 4 per geslacht per team → 8 totaal voor 2 teams
  if (aantalM < 4 || aantalV < 4) {
    meldingen.push({
      regel: "selectie_gender",
      ernst: "kritiek",
      bericht: `Onvoldoende genderbalans: ${aantalV}♀ ${aantalM}♂ (min 4 per geslacht)`,
    });
  } else if (aantalM < 8 || aantalV < 8) {
    meldingen.push({
      regel: "selectie_gender",
      ernst: "aandacht",
      bericht: `Genderbalans: ${aantalV}♀ ${aantalM}♂ (ideaal ≥8 per geslacht voor 2 achtallen)`,
    });
  }

  // --- Leeftijdsrange controle per kleur ---
  const kleuren = [...new Set(teams.map((t) => t.kleur).filter(Boolean))] as string[];
  if (kleuren.length > 0 && spelers.length > 0) {
    const leeftijden = spelers.map((s) => grofKorfbalLeeftijd(s.geboortejaar, peildatum));
    const gemLeeftijd = leeftijden.reduce((a, b) => a + b, 0) / leeftijden.length;

    for (const kleur of kleuren) {
      const range = KLEUR_VEILIGE_RANGE[kleur];
      if (!range) continue;

      if (gemLeeftijd < range.min) {
        meldingen.push({
          regel: "selectie_kleur_grens",
          ernst: "aandacht",
          bericht: `Gem. leeftijd ${formatKorfbalLeeftijd(gemLeeftijd)} te laag voor ${kleur.toLowerCase()} (min ${range.min})`,
        });
      } else if (gemLeeftijd > range.max) {
        meldingen.push({
          regel: "selectie_kleur_grens",
          ernst: "aandacht",
          bericht: `Gem. leeftijd ${formatKorfbalLeeftijd(gemLeeftijd)} te hoog voor ${kleur.toLowerCase()} (max ${range.max})`,
        });
      }
    }
  }

  // --- Status bepalen ---
  const heeftKritiek = meldingen.some((m) => m.ernst === "kritiek");
  const heeftAandacht = meldingen.some((m) => m.ernst === "aandacht");
  const status: ValidatieStatus = heeftKritiek ? "ROOD" : heeftAandacht ? "ORANJE" : "GROEN";

  return { status, meldingen };
}
