"use server";

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@oranje-wit/database";
import type { SpelerStatus } from "@oranje-wit/database";

const PEILJAAR = 2026;

// Kleur-configuratie (gespiegeld van teamstructuur.ts)
const KLEUREN_CONFIG = [
  { kleur: "BLAUW", label: "Blauw", minLeeftijd: 5, maxLeeftijd: 7, streefPerTeam: 6 },
  { kleur: "GROEN", label: "Groen", minLeeftijd: 8, maxLeeftijd: 9, streefPerTeam: 6 },
  { kleur: "GEEL", label: "Geel", minLeeftijd: 10, maxLeeftijd: 12, streefPerTeam: 10 },
  { kleur: "ORANJE", label: "Oranje", minLeeftijd: 13, maxLeeftijd: 15, streefPerTeam: 10 },
  { kleur: "ROOD", label: "Rood", minLeeftijd: 16, maxLeeftijd: 18, streefPerTeam: 10 },
] as const;

/**
 * Haal de blauwdruk voor een seizoen op, of maak een nieuwe aan.
 */
export async function getBlauwdruk(seizoen: string) {
  return prisma.blauwdruk.upsert({
    where: { seizoen },
    create: {
      seizoen,
      kaders: {},
      speerpunten: [],
      toelichting: "",
    },
    update: {},
  });
}

/**
 * Update kaders (JSON).
 */
export async function updateKaders(
  blauwdrukId: string,
  kaders: Prisma.InputJsonValue
) {
  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: { kaders },
  });
}

/**
 * Update speerpunten (string[]).
 */
export async function updateSpeerpunten(
  blauwdrukId: string,
  speerpunten: string[]
) {
  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: { speerpunten },
  });
}

/**
 * Update toelichting (string).
 */
export async function updateToelichting(
  blauwdrukId: string,
  toelichting: string
) {
  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: { toelichting },
  });
}

/**
 * Keuzes: strategische vragen die in scenario's worden uitgespeeld.
 */
export interface Keuze {
  id: string;
  vraag: string;       // "Hoeveel U15-teams?"
  opties: string[];    // ["1 team", "2 teams"]
}

export async function updateKeuzes(
  blauwdrukId: string,
  keuzes: Keuze[]
) {
  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: { keuzes: keuzes as unknown as Prisma.InputJsonValue },
  });
}

// Teamgrootte types/defaults/utility: zie ./teamgrootte.ts
import type { TeamgrootteTargets } from "./teamgrootte";

/**
 * Update teamgrootte-targets in blauwdruk.keuzes.
 * Bewaart bestaande keuzes-data en overschrijft alleen teamgrootte.
 */
export async function updateTeamgrootte(
  blauwdrukId: string,
  teamgrootte: TeamgrootteTargets
) {
  const blauwdruk = await prisma.blauwdruk.findUniqueOrThrow({
    where: { id: blauwdrukId },
    select: { keuzes: true },
  });

  const bestaand = (blauwdruk.keuzes ?? {}) as Record<string, unknown>;

  return prisma.blauwdruk.update({
    where: { id: blauwdrukId },
    data: {
      keuzes: { ...bestaand, teamgrootte } as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Update de status van een speler (beschikbaar/twijfelt/stopt/nieuw).
 */
export async function updateSpelerStatus(
  spelerId: string,
  status: SpelerStatus
) {
  await prisma.speler.update({
    where: { id: spelerId },
    data: { status },
  });
}

/**
 * Haal alle spelers op met uitgebreide velden voor het LedenDashboard.
 */
export async function getSpelersUitgebreid() {
  const spelers = await prisma.speler.findMany({
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geslacht: true,
      status: true,
      huidig: true,
      volgendSeizoen: true,
      retentie: true,
      seizoenenActief: true,
      instroomLeeftijd: true,
      lidSinds: true,
      spelerspad: true,
      notitie: true,
    },
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
  });

  return spelers.map((s) => ({
    ...s,
    leeftijdVolgendSeizoen: PEILJAAR - s.geboortejaar,
    huidig: s.huidig as { team?: string; categorie?: string; kleur?: string; a_categorie?: string } | null,
    volgendSeizoen: s.volgendSeizoen as { leeftijd?: number; a_categorie?: string; a_jaars?: number; band_b?: string; opmerking?: string } | null,
    retentie: s.retentie as { risico?: string; kans_behoud?: number; factoren?: string[] } | null,
  }));
}

export type SpelerUitgebreid = Awaited<ReturnType<typeof getSpelersUitgebreid>>[number];

/**
 * Bereken geaggregeerde ledenstatistieken server-side.
 */
export interface CategorieStats {
  kleur: string;
  label: string;
  beschikbaar: number;
  twijfelt: number;
  gaatStoppen: number;
  nieuw: number;
  totaal: number;
  mannen: number;
  vrouwen: number;
  streefPerTeam: number;
  minTeams: number;
  maxTeams: number;
}

export interface RetentieOverzicht {
  hoog: number;
  gemiddeld: number;
  laag: number;
  onbekend: number;
}

export interface LedenStatistieken {
  totaal: number;
  perStatus: Record<string, number>;
  perCategorie: CategorieStats[];
  senioren: { beschikbaar: number; twijfelt: number; gaatStoppen: number; nieuw: number; totaal: number; mannen: number; vrouwen: number };
  retentie: RetentieOverzicht;
}

export async function getLedenStatistieken(): Promise<LedenStatistieken> {
  const spelers = await prisma.speler.findMany({
    select: {
      geboortejaar: true,
      geslacht: true,
      status: true,
      retentie: true,
    },
  });

  // Per status
  const perStatus: Record<string, number> = {
    BESCHIKBAAR: 0,
    TWIJFELT: 0,
    GAAT_STOPPEN: 0,
    NIEUW: 0,
  };
  for (const s of spelers) perStatus[s.status] = (perStatus[s.status] ?? 0) + 1;

  // Per kleur-categorie
  const perCategorie: CategorieStats[] = KLEUREN_CONFIG.map((cfg) => {
    const groep = spelers.filter((s) => {
      const leeftijd = PEILJAAR - s.geboortejaar;
      return leeftijd >= cfg.minLeeftijd && leeftijd <= cfg.maxLeeftijd;
    });

    const beschikbaar = groep.filter((s) => s.status === "BESCHIKBAAR").length;
    const twijfelt = groep.filter((s) => s.status === "TWIJFELT").length;
    const gaatStoppen = groep.filter((s) => s.status === "GAAT_STOPPEN").length;
    const nieuw = groep.filter((s) => s.status === "NIEUW").length;
    const effectief = beschikbaar + nieuw + Math.round(twijfelt * 0.5);
    const minTeams = effectief > 0 ? Math.max(1, Math.floor(effectief / (cfg.streefPerTeam + 2))) : 0;
    const maxTeams = effectief > 0 ? Math.ceil(effectief / Math.max(cfg.streefPerTeam - 2, 4)) : 0;

    return {
      kleur: cfg.kleur,
      label: cfg.label,
      beschikbaar,
      twijfelt,
      gaatStoppen,
      nieuw,
      totaal: groep.length,
      mannen: groep.filter((s) => s.geslacht === "M").length,
      vrouwen: groep.filter((s) => s.geslacht === "V").length,
      streefPerTeam: cfg.streefPerTeam,
      minTeams,
      maxTeams,
    };
  });

  // Senioren (19+)
  const seniorenGroep = spelers.filter((s) => PEILJAAR - s.geboortejaar >= 19);
  const senioren = {
    beschikbaar: seniorenGroep.filter((s) => s.status === "BESCHIKBAAR").length,
    twijfelt: seniorenGroep.filter((s) => s.status === "TWIJFELT").length,
    gaatStoppen: seniorenGroep.filter((s) => s.status === "GAAT_STOPPEN").length,
    nieuw: seniorenGroep.filter((s) => s.status === "NIEUW").length,
    totaal: seniorenGroep.length,
    mannen: seniorenGroep.filter((s) => s.geslacht === "M").length,
    vrouwen: seniorenGroep.filter((s) => s.geslacht === "V").length,
  };

  // Retentie
  const retentie: RetentieOverzicht = { hoog: 0, gemiddeld: 0, laag: 0, onbekend: 0 };
  for (const s of spelers) {
    const r = s.retentie as { risico?: string } | null;
    const risico = r?.risico?.toLowerCase();
    if (risico === "hoog") retentie.hoog++;
    else if (risico === "gemiddeld") retentie.gemiddeld++;
    else if (risico === "laag") retentie.laag++;
    else retentie.onbekend++;
  }

  return {
    totaal: spelers.length,
    perStatus,
    perCategorie,
    senioren,
    retentie,
  };
}
