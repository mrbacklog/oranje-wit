// apps/web/src/lib/teamindeling/validatie-engine.ts

import type { WerkbordTeam, WerkbordValidatieItem } from "@/components/werkbord/types";
import type { TcKader } from "@/app/(protected)/kader/kader-defaults";

const MS_PER_JAAR = 365.25 * 24 * 60 * 60 * 1000;

export function korfbalLeeftijd(
  geboortedatum: string | null,
  geboortejaar: number,
  peiljaar: number
): number {
  if (geboortedatum) {
    const peil = new Date(peiljaar - 1, 11, 31); // 31 dec van het eerste seizoensjaar (KNKV peildatum)
    const geb = new Date(geboortedatum);
    return Math.round(((peil.getTime() - geb.getTime()) / MS_PER_JAAR) * 100) / 100;
  }
  return peiljaar - geboortejaar;
}

export function bepaalKaderSleutel(
  team: Pick<WerkbordTeam, "teamCategorie" | "niveau" | "kleur" | "formaat">
): string | null {
  const { teamCategorie, niveau, kleur, formaat } = team;
  if (teamCategorie === "SENIOREN") {
    if (niveau === "A") return "SEN_A";
    if (niveau === "B") return "SEN_B";
    return null;
  }
  if (teamCategorie === "A_CATEGORIE") {
    if (niveau === "U19") return "U19";
    if (niveau === "U17") return "U17";
    if (niveau === "U15") return "U15";
    return null;
  }
  if (teamCategorie === "B_CATEGORIE") {
    if (kleur === "rood") return "ROOD";
    if (kleur === "oranje") return "ORANJE";
    if (kleur === "geel") return formaat === "viertal" ? "GEEL4" : "GEEL8";
    if (kleur === "groen") return "GROEN";
    if (kleur === "blauw") return "BLAUW";
    return null;
  }
  return null;
}

export function berekenTeamValidatie(
  team: WerkbordTeam,
  kaders: Record<string, TcKader>,
  peiljaar: number
): WerkbordValidatieItem[] {
  const sleutel = bepaalKaderSleutel(team);

  if (!sleutel || !kaders[sleutel]) {
    return [
      {
        teamId: team.id,
        type: "warn",
        regel: "Teamtype niet ingesteld",
        beschrijving: "Stel categorie en niveau/kleur in voor kadervereisten",
      },
    ];
  }

  const kader = kaders[sleutel];
  const items: WerkbordValidatieItem[] = [];
  const alleSpelers = [...team.dames, ...team.heren];
  const totaal = alleSpelers.length;
  const dames = team.dames.length;
  const heren = team.heren.length;

  // 1. Teamgrootte
  if (totaal < kader.teamMin) {
    items.push({
      teamId: team.id,
      type: "err",
      regel: "Te weinig spelers",
      beschrijving: `${totaal} spelers, minimum is ${kader.teamMin}`,
      laag: "TC",
    });
  } else if (totaal < kader.teamIdeaal) {
    items.push({
      teamId: team.id,
      type: "warn",
      regel: "Onder ideaalgrootte",
      beschrijving: `${totaal} spelers, ideaal is ${kader.teamIdeaal}`,
      laag: "TC",
    });
  }
  if (totaal > kader.teamMax) {
    items.push({
      teamId: team.id,
      type: "warn",
      regel: "Te veel spelers",
      beschrijving: `${totaal} spelers, maximum is ${kader.teamMax}`,
      laag: "TC",
    });
  }

  // 2. Dames
  if (dames < kader.damesMin) {
    items.push({
      teamId: team.id,
      type: "err",
      regel: "Te weinig dames",
      beschrijving: `${dames} dames, minimum is ${kader.damesMin}`,
      laag: "TC",
    });
  } else if (dames > kader.damesMax) {
    items.push({
      teamId: team.id,
      type: "warn",
      regel: "Te veel dames",
      beschrijving: `${dames} dames, maximum is ${kader.damesMax}`,
      laag: "TC",
    });
  }

  // 3. Heren
  if (heren < kader.herenMin) {
    items.push({
      teamId: team.id,
      type: "err",
      regel: "Te weinig heren",
      beschrijving: `${heren} heren, minimum is ${kader.herenMin}`,
      laag: "TC",
    });
  } else if (heren > kader.herenMax) {
    items.push({
      teamId: team.id,
      type: "warn",
      regel: "Te veel heren",
      beschrijving: `${heren} heren, maximum is ${kader.herenMax}`,
      laag: "TC",
    });
  }

  // 4. Gemiddelde leeftijd
  if (
    kader.gemLeeftijdMin !== undefined &&
    kader.gemLeeftijdMax !== undefined &&
    team.gemiddeldeLeeftijd !== null
  ) {
    if (team.gemiddeldeLeeftijd < kader.gemLeeftijdMin) {
      items.push({
        teamId: team.id,
        type: "warn",
        regel: "Gem. leeftijd te laag",
        beschrijving: `${team.gemiddeldeLeeftijd.toFixed(2)} jaar, minimum is ${kader.gemLeeftijdMin}`,
        laag: "TC",
      });
    } else if (team.gemiddeldeLeeftijd > kader.gemLeeftijdMax) {
      items.push({
        teamId: team.id,
        type: "warn",
        regel: "Gem. leeftijd te hoog",
        beschrijving: `${team.gemiddeldeLeeftijd.toFixed(2)} jaar, maximum is ${kader.gemLeeftijdMax}`,
        laag: "TC",
      });
    }
  }

  // 5. Leeftijdsbandbreedte
  if (kader.bandbreedteMax !== undefined && alleSpelers.length >= 2) {
    const leeftijden = alleSpelers.map((sit) =>
      korfbalLeeftijd(sit.speler.geboortedatum, sit.speler.geboortejaar, peiljaar)
    );
    const minL = Math.min(...leeftijden);
    const maxL = Math.max(...leeftijden);
    const spreiding = Math.round((maxL - minL) * 100) / 100;
    if (spreiding > kader.bandbreedteMax) {
      items.push({
        teamId: team.id,
        type: "err",
        regel: "Leeftijdsbandbreedte overschreden",
        beschrijving: `Spreiding ${spreiding.toFixed(2)} jaar, maximum is ${kader.bandbreedteMax} jaar`,
        laag: "KNKV",
      });
    }
  }

  // 6. Max leeftijd per speler
  if (kader.maxLeeftijdPerSpeler !== undefined) {
    for (const sit of alleSpelers) {
      const leeftijd = korfbalLeeftijd(sit.speler.geboortedatum, sit.speler.geboortejaar, peiljaar);
      if (leeftijd > kader.maxLeeftijdPerSpeler) {
        items.push({
          teamId: team.id,
          type: "err",
          regel: `${sit.speler.roepnaam} ${sit.speler.achternaam} te oud`,
          beschrijving: `${leeftijd.toFixed(2)} jaar, maximum is ${kader.maxLeeftijdPerSpeler.toFixed(2)} jaar`,
          laag: "KNKV",
        });
      }
    }
  }

  return items;
}

export function berekenValidatieStatus(items: WerkbordValidatieItem[]): "ok" | "warn" | "err" {
  if (items.some((i) => i.type === "err")) return "err";
  if (items.some((i) => i.type === "warn")) return "warn";
  return "ok";
}
