import type { PresentatieSpeler, PresentatieStaf, PresentatieTeam } from "./presentatie-types";

export interface PublicatieInstellingen {
  id: string | null;
  kadersId: string;
  titel: string;
  seizoenLabel: string;
  introTekst: string;
  waaromTekst: string;
  werkwijzeTekst: string;
  competitieTekst: string;
  tcTekst: string;
  kennismakingTekst: string;
  contactTekst: string;
  kangoeroesTekst: string;
  bedankTekst: string;
  sectieVolgorde: PublicatieSectieConfig[];
}

export interface PublicatieSectieConfig {
  key: string;
  titel: string;
}

export interface PreseasonPdfStaf {
  naam: string;
  rol: string;
  rolLabel?: string | null;
}

export interface PreseasonPdfTeam {
  id: string;
  naam: string;
  dames: string[];
  heren: string[];
  staf: PreseasonPdfStaf[];
  leden: {
    teamId: string;
    naam: string;
    dames: string[];
    heren: string[];
  }[];
}

export interface PublicatieSectie {
  key: string;
  titel: string;
  teams: PreseasonPdfTeam[];
}

export const DEFAULT_PUBLICATIE_SECTIES: PublicatieSectieConfig[] = [
  { key: "senioren", titel: "Senioren-teams" },
  { key: "rood", titel: "U-19 / Rood" },
  { key: "oranje", titel: "U-17 / U-15 / Oranje" },
  { key: "geel", titel: "Geel" },
  { key: "groen", titel: "Groen" },
  { key: "blauw", titel: "Blauw" },
];

export const DEFAULT_PUBLICATIE_TEKSTEN = {
  titel: "Pre-season Teamindeling",
  introTekst:
    "Hier is de pre-season teamindeling voor het nieuwe seizoen. Het samenstellen van teams is ieder jaar een uitdaging. Samen met trainers en coordinatoren werken we toe naar een zorgvuldig en evenwichtig overzicht.",
  waaromTekst:
    "De pre-season indeling is een voorlopige teamindeling, zodat teams en staf plannen kunnen maken voor het komende seizoen. Door aanmeldingen of opzeggingen kunnen nog wijzigingen volgen, maar de grote lijnen staan.",
  werkwijzeTekst:
    "Vanaf de seizoenstart werkt de Technische Commissie toe naar de teamindeling voor het nieuwe seizoen. We gebruiken evaluaties, gesprekken, kaders en praktische randvoorwaarden om tot passende keuzes te komen.",
  competitieTekst:
    "De indeling volgt de actuele KNKV-competitiestructuur. Daarbij kijken we naar plezier, uitdaging, ontwikkeling, reisafstand, teamleeftijd en de balans binnen teams.",
  tcTekst:
    "De Technische Commissie, coordinatoren, trainersbegeleiders en trainers zorgen samen voor doorstroming, passende teamindelingen en aandacht voor ontwikkeling en plezier op elk niveau.",
  kennismakingTekst:
    "Voor de zomervakantie kunnen teams waar mogelijk al kennismaken in de nieuwe samenstelling. Trainers delen praktische informatie over contactgegevens en planning.",
  contactTekst:
    "Heb je vragen over de indeling of wil je iets bespreken? Neem contact op via je trainer, coordinator of per mail met de Technische Commissie.",
  kangoeroesTekst:
    "Ook komend seizoen staat de Kangoeroe-training weer op het programma voor jonge kinderen die spelenderwijs willen kennismaken met korfbal.",
  bedankTekst:
    "Tot slot bedanken we alle coordinatoren, trainers en begeleiders voor hun inzet, betrokkenheid en samenwerking. Samen maken we het verschil. Op naar een mooi nieuw seizoen!",
} as const;

export function maakDefaultPublicatieInstellingen(
  kadersId: string,
  seizoenLabel: string
): PublicatieInstellingen {
  return {
    id: null,
    kadersId,
    seizoenLabel,
    sectieVolgorde: DEFAULT_PUBLICATIE_SECTIES,
    ...DEFAULT_PUBLICATIE_TEKSTEN,
  };
}

export function formatPubliekeSpelerNaam(speler: PresentatieSpeler): string {
  const initiaal = speler.roepnaam.trim().charAt(0).toUpperCase();
  const tussenvoegsel = speler.tussenvoegsel?.trim();
  const suffix = tussenvoegsel ? ` ${tussenvoegsel}` : "";
  return `${speler.achternaam}, ${initiaal}. (${speler.roepnaam})${suffix}`;
}

function mapStaf(staf: PresentatieStaf[]): PreseasonPdfStaf[] {
  return staf
    .filter((item) => item.naam.trim().length > 0)
    .map((item) => ({ naam: item.naam, rol: item.rol, rolLabel: item.rolLabel ?? null }));
}

function mapTeam(team: PresentatieTeam): PreseasonPdfTeam {
  return {
    id: team.id,
    naam: team.naam,
    dames: team.dames.map(formatPubliekeSpelerNaam),
    heren: team.heren.map(formatPubliekeSpelerNaam),
    staf: mapStaf(team.staf),
    leden: team.leden.map((lid) => ({
      teamId: lid.teamId,
      naam: lid.naam,
      dames: lid.dames.map(formatPubliekeSpelerNaam),
      heren: lid.heren.map(formatPubliekeSpelerNaam),
    })),
  };
}

function sectieKeyVoorTeam(team: PresentatieTeam): string | null {
  if (team.teamCategorie === "SENIOREN") return "senioren";
  if (team.kleur === "rood" || /\bU19\b/i.test(team.naam)) return "rood";
  if (team.kleur === "oranje" || /\bU(17|15)\b/i.test(team.naam)) return "oranje";
  if (team.kleur === "geel") return "geel";
  if (team.kleur === "groen") return "groen";
  if (team.kleur === "blauw") return "blauw";
  return null;
}

export function bouwPreseasonPdfSecties(
  teams: PresentatieTeam[],
  sectieVolgorde: PublicatieSectieConfig[] = DEFAULT_PUBLICATIE_SECTIES
): PublicatieSectie[] {
  const teamsOpVolgorde = [...teams].sort((a, b) => a.volgorde - b.volgorde);
  return sectieVolgorde
    .map((config) => ({
      key: config.key,
      titel: config.titel,
      teams: teamsOpVolgorde.filter((team) => sectieKeyVoorTeam(team) === config.key).map(mapTeam),
    }))
    .filter((sectie) => sectie.teams.length > 0);
}
