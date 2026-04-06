"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import type { Prisma, SpelerStatus } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import { assertBewerkbaar, getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { cookies } from "next/headers";

/**
 * Stel een seizoen in als werkseizoen (★).
 * Alle andere seizoenen worden op isWerkseizoen=false gezet.
 */
export async function setWerkseizoen(seizoen: string) {
  if (!/^\d{4}-\d{4}$/.test(seizoen)) {
    throw new Error("Ongeldig seizoensformaat");
  }
  await prisma.kaders.updateMany({ data: { isWerkseizoen: false } });
  await prisma.kaders.update({ where: { seizoen }, data: { isWerkseizoen: true } });

  const cookieStore = await cookies();
  cookieStore.set("actief-seizoen", seizoen, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

/**
 * Haal alle pins voor een blauwdruk op, inclusief gekoppelde speler/staf.
 */
export async function getPinsVoorKaders(kadersId: string) {
  return prisma.pin.findMany({
    where: { kadersId },
    include: {
      speler: { select: { id: true, roepnaam: true, achternaam: true } },
      staf: { select: { id: true, naam: true } },
      gepindDoor: { select: { id: true, naam: true } },
    },
    orderBy: { gepindOp: "desc" },
  });
}

export type PinMetNamen = Awaited<ReturnType<typeof getPinsVoorKaders>>[number];

/**
 * Guard: controleer of de blauwdruk bij het huidige (bewerkbare) seizoen hoort.
 */
async function assertBlauwdrukBewerkbaar(kadersId: string) {
  const blauwdruk = await prisma.kaders.findUniqueOrThrow({
    where: { id: kadersId },
    select: { seizoen: true },
  });
  await assertBewerkbaar(blauwdruk.seizoen);
}

// Kleur-configuratie (gespiegeld van teamstructuur.ts)
const KLEUREN_CONFIG = [
  { kleur: "BLAUW", label: "Blauw", minLeeftijd: 5, maxLeeftijd: 7, streefPerTeam: 6 },
  { kleur: "GROEN", label: "Groen", minLeeftijd: 8, maxLeeftijd: 9, streefPerTeam: 6 },
  { kleur: "GEEL", label: "Geel", minLeeftijd: 10, maxLeeftijd: 12, streefPerTeam: 10 },
  { kleur: "ORANJE", label: "Oranje", minLeeftijd: 13, maxLeeftijd: 15, streefPerTeam: 10 },
  { kleur: "ROOD", label: "Rood", minLeeftijd: 16, maxLeeftijd: 18, streefPerTeam: 10 },
] as const;

// A-categorie U-niveaus (harde bovengrens, 2 geboortejaren per niveau)
const U_CONFIG = [
  { sleutel: "U15", label: "U15", geboortejaarMin: -14, geboortejaarMax: -13, streefPerTeam: 10 },
  { sleutel: "U17", label: "U17", geboortejaarMin: -16, geboortejaarMax: -15, streefPerTeam: 10 },
  { sleutel: "U19", label: "U19", geboortejaarMin: -18, geboortejaarMax: -17, streefPerTeam: 10 },
] as const;

/**
 * Haal de blauwdruk voor een seizoen op, of maak een nieuwe aan.
 */
export async function getBlauwdruk(seizoen: string) {
  return prisma.kaders.upsert({
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
export async function updateKaders(kadersId: string, kaders: Prisma.InputJsonValue) {
  await assertBlauwdrukBewerkbaar(kadersId);
  return prisma.kaders.update({
    where: { id: kadersId },
    data: { kaders },
  });
}

/**
 * Update speerpunten (string[]).
 */
export async function updateSpeerpunten(kadersId: string, speerpunten: string[]) {
  await assertBlauwdrukBewerkbaar(kadersId);
  return prisma.kaders.update({
    where: { id: kadersId },
    data: { speerpunten },
  });
}

/**
 * Update toelichting (string).
 */
export async function updateToelichting(kadersId: string, toelichting: string) {
  await assertBlauwdrukBewerkbaar(kadersId);
  return prisma.kaders.update({
    where: { id: kadersId },
    data: { toelichting },
  });
}

import type { CategorieSettings, CategorieKaders } from "./categorie-kaders";

/**
 * Update de kaders voor één categorie.
 * Merged met bestaande kaders zodat andere categorieën behouden blijven.
 */
export async function updateCategorieKaders(
  kadersId: string,
  categorie: string,
  settings: Partial<CategorieSettings>
) {
  await assertBlauwdrukBewerkbaar(kadersId);
  const blauwdruk = await prisma.kaders.findUniqueOrThrow({
    where: { id: kadersId },
    select: { kaders: true },
  });

  const bestaand = (blauwdruk.kaders ?? {}) as CategorieKaders;

  return prisma.kaders.update({
    where: { id: kadersId },
    data: {
      kaders: {
        ...bestaand,
        [categorie]: { ...bestaand[categorie], ...settings },
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Update de status van een speler.
 */
export async function updateSpelerStatus(spelerId: string, status: SpelerStatus) {
  const seizoen = await getActiefSeizoen();
  await assertBewerkbaar(seizoen);
  await prisma.speler.update({
    where: { id: spelerId },
    data: { status },
  });
}

/**
 * Haal alle spelers op met uitgebreide velden voor het LedenDashboard.
 */
export async function getSpelersUitgebreid() {
  const [spelers, afmeldingen] = await Promise.all([
    prisma.speler.findMany({
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
    }),
    prisma.lid.findMany({
      where: { afmelddatum: { not: null } },
      select: { relCode: true, afmelddatum: true },
    }),
  ]);

  const afmeldMap = new Map(afmeldingen.map((l) => [l.relCode, l.afmelddatum]));

  return spelers.map((s) => ({
    ...s,
    afmelddatum: afmeldMap.get(s.id)?.toISOString() ?? null,
    leeftijdVolgendSeizoen: PEILJAAR - s.geboortejaar,
    huidig: s.huidig as {
      team?: string;
      categorie?: string;
      kleur?: string;
      a_categorie?: string;
    } | null,
    volgendSeizoen: s.volgendSeizoen as {
      leeftijd?: number;
      a_categorie?: string;
      a_jaars?: number;
      band_b?: string;
      opmerking?: string;
    } | null,
    retentie: s.retentie as { risico?: string; kans_behoud?: number; factoren?: string[] } | null,
  }));
}

export type SpelerUitgebreid = Awaited<ReturnType<typeof getSpelersUitgebreid>>[number];

export interface Keuze {
  id: string;
  vraag: string;
  opties: string[];
}

/**
 * Bereken geaggregeerde ledenstatistieken server-side.
 */
export interface CategorieStats {
  kleur: string;
  label: string;
  beschikbaar: number;
  twijfelt: number;
  gaatStoppen: number;
  nieuwPotentieel: number;
  nieuwDefinitief: number;
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
  senioren: {
    beschikbaar: number;
    twijfelt: number;
    gaatStoppen: number;
    nieuwPotentieel: number;
    nieuwDefinitief: number;
    totaal: number;
    mannen: number;
    vrouwen: number;
  };
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
    NIEUW_POTENTIEEL: 0,
    NIEUW_DEFINITIEF: 0,
  };
  for (const s of spelers) perStatus[s.status] = (perStatus[s.status] ?? 0) + 1;

  // Helpers voor groep-statistieken
  function groepStats(groep: typeof spelers) {
    const beschikbaar = groep.filter((s) => s.status === "BESCHIKBAAR").length;
    const twijfelt = groep.filter((s) => s.status === "TWIJFELT").length;
    const gaatStoppen = groep.filter((s) => s.status === "GAAT_STOPPEN").length;
    const nieuwPotentieel = groep.filter((s) => s.status === "NIEUW_POTENTIEEL").length;
    const nieuwDefinitief = groep.filter((s) => s.status === "NIEUW_DEFINITIEF").length;
    return { beschikbaar, twijfelt, gaatStoppen, nieuwPotentieel, nieuwDefinitief };
  }

  // Per kleur-categorie
  const perCategorie: CategorieStats[] = KLEUREN_CONFIG.map((cfg) => {
    const groep = spelers.filter((s) => {
      const leeftijd = PEILJAAR - s.geboortejaar;
      return leeftijd >= cfg.minLeeftijd && leeftijd <= cfg.maxLeeftijd;
    });

    const stats = groepStats(groep);
    const effectief =
      stats.beschikbaar +
      stats.nieuwPotentieel +
      stats.nieuwDefinitief +
      Math.round(stats.twijfelt * 0.5);
    const minTeams =
      effectief > 0 ? Math.max(1, Math.floor(effectief / (cfg.streefPerTeam + 2))) : 0;
    const maxTeams = effectief > 0 ? Math.ceil(effectief / Math.max(cfg.streefPerTeam - 2, 4)) : 0;

    return {
      kleur: cfg.kleur,
      label: cfg.label,
      ...stats,
      totaal: groep.length,
      mannen: groep.filter((s) => s.geslacht === "M").length,
      vrouwen: groep.filter((s) => s.geslacht === "V").length,
      streefPerTeam: cfg.streefPerTeam,
      minTeams,
      maxTeams,
    };
  });

  // Per U-niveau (A-categorie)
  const seizoenJaar = PEILJAAR;
  for (const cfg of U_CONFIG) {
    const minJaar = seizoenJaar + cfg.geboortejaarMin;
    const maxJaar = seizoenJaar + cfg.geboortejaarMax;
    const groep = spelers.filter((s) => s.geboortejaar >= minJaar && s.geboortejaar <= maxJaar);

    const stats = groepStats(groep);
    const effectief =
      stats.beschikbaar +
      stats.nieuwPotentieel +
      stats.nieuwDefinitief +
      Math.round(stats.twijfelt * 0.5);
    const minTeams =
      effectief > 0 ? Math.max(1, Math.floor(effectief / (cfg.streefPerTeam + 2))) : 0;
    const maxTeams = effectief > 0 ? Math.ceil(effectief / Math.max(cfg.streefPerTeam - 2, 4)) : 0;

    perCategorie.push({
      kleur: cfg.sleutel,
      label: cfg.label,
      ...stats,
      totaal: groep.length,
      mannen: groep.filter((s) => s.geslacht === "M").length,
      vrouwen: groep.filter((s) => s.geslacht === "V").length,
      streefPerTeam: cfg.streefPerTeam,
      minTeams,
      maxTeams,
    });
  }

  // Senioren (19+)
  const seniorenGroep = spelers.filter((s) => PEILJAAR - s.geboortejaar >= 19);
  const senioren = {
    ...groepStats(seniorenGroep),
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
