/**
 * Regelvalidatie-engine voor teamindelingen.
 *
 * Controleert KNKV-regels (hard) en OW-voorkeuren (zacht)
 * en kent een stoplicht-status toe per team.
 *
 * Dit bestand is de publieke API — alle submodules worden hier ge-reexporteerd.
 */

// Re-export types
export type {
  ValidatieStatus,
  MeldingErnst,
  ValidatieMelding,
  TeamValidatie,
  TeamData,
  SpelerData,
  TeamgrootteOverrides,
  BlauwdrukCategorieSettings,
  BlauwdrukKaders,
} from "./types";

// Re-export constanten
export { KLEUR_VOLGORDE, KLEUR_VEILIGE_RANGE } from "./constanten";

// Re-export zachte-regels (cross-team validatie)
export { valideerDubbeleSpelersOverTeams } from "./zachte-regels";

// Interne imports voor valideerTeam
import type { TeamData, ValidatieMelding, TeamgrootteOverrides, BlauwdrukKaders } from "./types";
import type { TeamValidatie } from "./types";
import { isSeniorenA, isSeniorenB } from "./helpers";
import { valideerBCategorie, valideerACategorie, valideerSenioren } from "./harde-regels";
import { valideerGender, valideerDuplicaten } from "./zachte-regels";

// ============================================================
// Hoofdfunctie
// ============================================================

export function valideerTeam(
  team: TeamData,
  seizoenJaar: number,
  overrides?: TeamgrootteOverrides,
  kaders?: BlauwdrukKaders
): TeamValidatie {
  const meldingen: ValidatieMelding[] = [];

  // Bepaal effectieve categorie (senioren splitsen in A/B)
  const isACat = team.categorie === "A_CATEGORIE" || isSeniorenA(team);
  const isBCat = team.categorie === "B_CATEGORIE" || isSeniorenB(team);

  // Bepaal teamtype
  if (isBCat && team.kleur) {
    valideerBCategorie(team, seizoenJaar, meldingen, overrides, kaders);
  } else if (isACat) {
    valideerACategorie(team, seizoenJaar, meldingen, overrides, kaders);
  } else if (team.categorie === "SENIOREN") {
    // Senioren zonder duidelijke A/B → valideer als achttal
    valideerSenioren(team, meldingen, overrides, kaders);
  }

  // Gender checks — categorie-afhankelijk, met blauwdruk-kaders
  valideerGender(team, isACat, meldingen, kaders);
  valideerDuplicaten(team, meldingen);

  // Bepaal overall status
  const heeftKritiek = meldingen.some((m) => m.ernst === "kritiek");
  const heeftAandacht = meldingen.some((m) => m.ernst === "aandacht");

  return {
    status: heeftKritiek ? "ROOD" : heeftAandacht ? "ORANJE" : "GROEN",
    meldingen,
  };
}
