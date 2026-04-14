/**
 * Harde regels (kritieke meldingen): teamgrootte, bandbreedte, leeftijd.
 * Schending = ROOD stoplicht.
 */

import type { TeamData, ValidatieMelding, TeamgrootteOverrides, BlauwdrukKaders } from "./types";
import {
  KLEUR_FORMAT,
  KLEUR_LEEFTIJD,
  KLEUR_VEILIGE_RANGE,
  KLEUR_VOLGORDE,
  MIN_GEMIDDELDE_LEEFTIJD_8TAL,
} from "./constanten";
import {
  getTeamgrootte,
  getTeamgrootteUitKaders,
  detecteerACategorie,
  aCategorieGeboortejaren,
  spelerKorfbalLeeftijd,
} from "./helpers";
import { formatKorfbalLeeftijd } from "@oranje-wit/types";

// ============================================================
// B-categorie validatie
// ============================================================

export function valideerBCategorie(
  team: TeamData,
  peildatum: Date,
  meldingen: ValidatieMelding[],
  overrides?: TeamgrootteOverrides,
  kaders?: BlauwdrukKaders
) {
  const kleur = team.kleur!;
  const format = KLEUR_FORMAT[kleur];
  const grootte =
    (kaders && getTeamgrootteUitKaders(team, kaders)) ?? getTeamgrootte(format, false, overrides);
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
  } else if (aantalSpelers < grootte.ideaalMin || aantalSpelers > grootte.ideaalMax) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, ideaal is ${grootte.ideaalMin}-${grootte.ideaalMax}`,
      ernst: "aandacht",
    });
  }

  // Leeftijdsspreiding (precieze onafgeronde korfballeeftijd)
  if (team.spelers.length > 0) {
    const leeftijden = team.spelers.map((s) => spelerKorfbalLeeftijd(s, peildatum));
    const spreiding = Math.max(...leeftijden) - Math.min(...leeftijden);
    const maxSpreiding = format === "viertal" ? 2 : 3;

    if (spreiding > maxSpreiding) {
      meldingen.push({
        regel: "bandbreedte",
        bericht: `${team.naam}: leeftijdsspreiding ${formatKorfbalLeeftijd(spreiding)} jaar, max is ${maxSpreiding}`,
        ernst: "kritiek",
      });
    }
  }

  // Individuele leeftijdscheck: speler past bij deze kleur?
  if (team.kleur && KLEUR_LEEFTIJD[team.kleur] && team.spelers.length > 0) {
    const range = KLEUR_LEEFTIJD[team.kleur];
    for (const speler of team.spelers) {
      const leeftijd = spelerKorfbalLeeftijd(speler, peildatum);
      if (leeftijd < range.min || leeftijd > range.max) {
        meldingen.push({
          regel: "leeftijd_kleur",
          bericht: `${speler.roepnaam} ${speler.achternaam} (${formatKorfbalLeeftijd(leeftijd)} jr) valt buiten ${team.kleur.toLowerCase()} (${range.min}-${range.max} jr)`,
          ernst: "aandacht",
        });
      }
    }
  }

  // Gemiddelde leeftijd (8-tallen)
  if (format === "achttal" && team.spelers.length > 0) {
    const gemiddeldeLeeftijd =
      team.spelers.reduce((sum, s) => sum + spelerKorfbalLeeftijd(s, peildatum), 0) /
      team.spelers.length;

    if (gemiddeldeLeeftijd < MIN_GEMIDDELDE_LEEFTIJD_8TAL) {
      meldingen.push({
        regel: "gemiddelde_leeftijd",
        bericht: `${team.naam}: gemiddelde leeftijd ${formatKorfbalLeeftijd(gemiddeldeLeeftijd)}, minimum is ${MIN_GEMIDDELDE_LEEFTIJD_8TAL}`,
        ernst: "kritiek",
      });
    }
  }

  // Kleur-grens: risico op herindeling door de bond
  valideerKleurGrens(team, peildatum, meldingen);
}

// ============================================================
// Kleur-grens validatie (herindelingsrisico)
// ============================================================

export function valideerKleurGrens(team: TeamData, peildatum: Date, meldingen: ValidatieMelding[]) {
  if (!team.kleur || team.spelers.length === 0) return;

  const kleur = team.kleur;
  const range = KLEUR_VEILIGE_RANGE[kleur];
  if (!range) return;

  const gemLeeftijd =
    team.spelers.reduce((sum, s) => sum + spelerKorfbalLeeftijd(s, peildatum), 0) /
    team.spelers.length;

  const idx = KLEUR_VOLGORDE.indexOf(kleur as (typeof KLEUR_VOLGORDE)[number]);

  // Te oud voor huidige kleur?
  if (gemLeeftijd > range.max && idx < KLEUR_VOLGORDE.length - 1) {
    const volgende = KLEUR_VOLGORDE[idx + 1].toLowerCase();
    const over = formatKorfbalLeeftijd(gemLeeftijd - range.max);
    meldingen.push({
      regel: "kleur_grens",
      bericht: `${team.naam}: gem. ${formatKorfbalLeeftijd(gemLeeftijd)} jr — ${over} jr boven ${kleur.toLowerCase()}-grens (max ${range.max}), risico herindeling naar ${volgende}`,
      ernst: "aandacht",
    });
  }

  // Te jong voor huidige kleur?
  if (gemLeeftijd < range.min && idx > 0) {
    const vorige = KLEUR_VOLGORDE[idx - 1].toLowerCase();
    const onder = formatKorfbalLeeftijd(range.min - gemLeeftijd);
    meldingen.push({
      regel: "kleur_grens",
      bericht: `${team.naam}: gem. ${formatKorfbalLeeftijd(gemLeeftijd)} jr — ${onder} jr onder ${kleur.toLowerCase()}-grens (min ${range.min}), risico herindeling naar ${vorige}`,
      ernst: "aandacht",
    });
  }
}

// ============================================================
// A-categorie validatie
// ============================================================

export function valideerACategorie(
  team: TeamData,
  peildatum: Date,
  meldingen: ValidatieMelding[],
  overrides?: TeamgrootteOverrides,
  kaders?: BlauwdrukKaders
) {
  const aantalSpelers = team.spelers.length;
  const grootte =
    (kaders && getTeamgrootteUitKaders(team, kaders)) ?? getTeamgrootte("achttal", true, overrides);

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
  } else if (aantalSpelers < grootte.ideaalMin || aantalSpelers > grootte.ideaalMax) {
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
      const [minJaar, maxJaar] = aCategorieGeboortejaren(categorie, peildatum);

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
// Senioren validatie
// ============================================================

export function valideerSenioren(
  team: TeamData,
  meldingen: ValidatieMelding[],
  overrides?: TeamgrootteOverrides,
  kaders?: BlauwdrukKaders
) {
  const aantalSpelers = team.spelers.length;
  const grootte =
    (kaders && getTeamgrootteUitKaders(team, kaders)) ??
    getTeamgrootte("achttal", false, overrides);

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
  } else if (aantalSpelers < grootte.ideaalMin || aantalSpelers > grootte.ideaalMax) {
    meldingen.push({
      regel: "teamgrootte",
      bericht: `${team.naam}: ${aantalSpelers} spelers, ideaal is ${grootte.ideaalMin}-${grootte.ideaalMax}`,
      ernst: "aandacht",
    });
  }
}
