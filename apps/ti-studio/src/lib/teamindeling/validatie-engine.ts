// apps/ti-studio/src/lib/teamindeling/validatie-engine.ts

import type { WerkbordTeam, WerkbordValidatieItem } from "@/components/werkbord/types";
import type { TcKader } from "@/app/(protected)/kader/kader-defaults";
import {
  berekenKorfbalLeeftijd,
  berekenKorfbalLeeftijdExact,
  formatKorfbalLeeftijd,
} from "@oranje-wit/types";

/**
 * @deprecated Gebruik `berekenKorfbalLeeftijd` / `berekenKorfbalLeeftijdExact` direct.
 * Deze wrapper blijft tijdelijk bestaan zodat importers van deze file nog werken.
 */
export function korfbalLeeftijd(
  geboortedatum: string | null,
  geboortejaar: number,
  peildatum: Date
): number {
  return berekenKorfbalLeeftijd(geboortedatum, geboortejaar, peildatum);
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
  peildatum: Date
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
  // Gecombineerde selecties: spelers zitten in selectieDames/selectieHeren, niet in dames/heren
  const effectieveDames = team.gebundeld ? team.selectieDames : team.dames;
  const effectieveHeren = team.gebundeld ? team.selectieHeren : team.heren;
  const alleSpelers = [...effectieveDames, ...effectieveHeren];
  const totaal = alleSpelers.length;
  const dames = effectieveDames.length;
  const heren = effectieveHeren.length;

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
  // Noot: bij gecombineerde selecties (gebundeld: true) is gemiddeldeLeeftijd altijd null
  // (berekend op directe team.spelers, niet op selectieDames/selectieHeren).
  // Leeftijdsvalidatie wordt daardoor overgeslagen — pre-existing beperking.
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

  // 5. Leeftijdsbandbreedte — exacte waarden om grens-afrondings-bugs te vermijden
  if (kader.bandbreedteMax !== undefined && alleSpelers.length >= 2) {
    const leeftijdenExact = alleSpelers.map((sit) =>
      berekenKorfbalLeeftijdExact(sit.speler.geboortedatum, sit.speler.geboortejaar, peildatum)
    );
    const spreidingExact = Math.max(...leeftijdenExact) - Math.min(...leeftijdenExact);
    if (spreidingExact > kader.bandbreedteMax) {
      items.push({
        teamId: team.id,
        type: "err",
        regel: "Leeftijdsbandbreedte overschreden",
        beschrijving: `Spreiding ${formatKorfbalLeeftijd(spreidingExact)} jaar, maximum is ${kader.bandbreedteMax} jaar`,
        laag: "KNKV",
      });
    }
  }

  // 6. Max leeftijd per speler — exacte vergelijking
  if (kader.maxLeeftijdPerSpeler !== undefined) {
    for (const sit of alleSpelers) {
      const leeftijdExact = berekenKorfbalLeeftijdExact(
        sit.speler.geboortedatum,
        sit.speler.geboortejaar,
        peildatum
      );
      if (leeftijdExact > kader.maxLeeftijdPerSpeler) {
        items.push({
          teamId: team.id,
          type: "err",
          regel: `${sit.speler.roepnaam} ${sit.speler.achternaam} te oud`,
          beschrijving: `${formatKorfbalLeeftijd(leeftijdExact)} jaar, maximum is ${formatKorfbalLeeftijd(kader.maxLeeftijdPerSpeler)} jaar`,
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
