/**
 * Zachte regels en generieke checks: gender, duplicaten.
 * Schending = ORANJE of ROOD stoplicht afhankelijk van de ernst.
 */

import type { TeamData, ValidatieMelding, BlauwdrukKaders } from "./types";
import { teamNaarCategorieSleutel } from "./helpers";

// ============================================================
// Gender validatie
// ============================================================

export function valideerGender(
  team: TeamData,
  isACat: boolean,
  meldingen: ValidatieMelding[],
  kaders?: BlauwdrukKaders
) {
  if (team.spelers.length === 0) return;

  const aantalM = team.spelers.filter((s) => s.geslacht === "M").length;
  const aantalV = team.spelers.filter((s) => s.geslacht === "V").length;

  // Haal blauwdruk gender-kaders op als beschikbaar
  const sleutel = teamNaarCategorieSleutel(team);
  const catSettings = kaders?.[sleutel];

  if (catSettings?.verplichtMinV || catSettings?.verplichtMinM) {
    // Verplichte minimale aantallen (harde eis uit blauwdruk)
    const minV = catSettings.verplichtMinV ?? 0;
    const minM = catSettings.verplichtMinM ?? 0;
    if (minV > 0 && aantalV < minV) {
      meldingen.push({
        regel: "gender_verplicht",
        bericht: `${team.naam}: ${aantalV} meisjes, verplicht minimum is ${minV}`,
        ernst: "kritiek",
      });
    }
    if (minM > 0 && aantalM < minM) {
      meldingen.push({
        regel: "gender_verplicht",
        bericht: `${team.naam}: ${aantalM} jongens, verplicht minimum is ${minM}`,
        ernst: "kritiek",
      });
    }
  }

  if (catSettings?.gewenstMinV || catSettings?.gewenstMinM) {
    // Gewenste minimale aantallen (zachte eis uit blauwdruk)
    const gewV = catSettings.gewenstMinV ?? 0;
    const gewM = catSettings.gewenstMinM ?? 0;
    if (gewV > 0 && aantalV < gewV && aantalV >= (catSettings.verplichtMinV ?? 0)) {
      meldingen.push({
        regel: "gender_gewenst",
        bericht: `${team.naam}: ${aantalV} meisjes, gewenst is minimaal ${gewV}`,
        ernst: "aandacht",
      });
    }
    if (gewM > 0 && aantalM < gewM && aantalM >= (catSettings.verplichtMinM ?? 0)) {
      meldingen.push({
        regel: "gender_gewenst",
        bericht: `${team.naam}: ${aantalM} jongens, gewenst is minimaal ${gewM}`,
        ernst: "aandacht",
      });
    }
  } else {
    // Fallback: als geen blauwdruk-kaders, gebruik oude logica

    // Blauw: geen genderonderscheid volgens KNKV
    if (team.kleur === "BLAUW") return;

    // OW-regel: nooit 1 kind alleen van een geslacht
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
}

// ============================================================
// Duplicaten validatie
// ============================================================

export function valideerDuplicaten(team: TeamData, meldingen: ValidatieMelding[]) {
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
// Cross-team duplicaten validatie
// ============================================================

/**
 * Valideer alle teams in een scenario op dubbele plaatsingen.
 */
export function valideerDubbeleSpelersOverTeams(teams: TeamData[]): ValidatieMelding[] {
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
      const speler = teams.flatMap((t) => t.spelers).find((s) => s.id === spelerId)!;
      meldingen.push({
        regel: "dubbele_plaatsing",
        bericht: `${speler.roepnaam} ${speler.achternaam} staat in ${teamNamen.length} teams: ${teamNamen.join(", ")}`,
        ernst: "kritiek",
      });
    }
  }

  return meldingen;
}
