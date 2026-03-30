// @ts-nocheck — Prisma 7.x + TS 5.9 excessive stack depth in Lid model
import { prisma } from "@/lib/db/prisma";
import type { TeamCsvRij } from "./csv-parser";
import { logger } from "@oranje-wit/types";

// -- Types -------------------------------------------------------------------

export type CompetitieType = "veld_najaar" | "zaal_8" | "zaal_4" | "veld_voorjaar";

export interface TeamsPreview {
  teams: { naam: string; spelers: number; staf: number }[];
  totaalSpelers: number;
  totaalStaf: number;
  onbekendeRelCodes: string[];
}

export interface TeamsSnapshotDiff {
  nieuw: { relCode: string; naam: string; team: string }[];
  gewisseld: {
    relCode: string;
    naam: string;
    vanTeam: string;
    naarTeam: string;
  }[];
  verdwenen: { relCode: string; naam: string; wasTeam: string }[];
}

export interface TeamsSnapshotResult {
  opgeslagen: number;
  stafOpgeslagen: number;
  signaleringen: string[];
}

// -- Preview -----------------------------------------------------------------

export async function berekenTeamsPreview(csvRijen: TeamCsvRij[]): Promise<TeamsPreview> {
  const teamMap = new Map<string, { spelers: number; staf: number }>();
  for (const rij of csvRijen) {
    const entry = teamMap.get(rij.team) ?? { spelers: 0, staf: 0 };
    if (rij.teamrol === "Teamspeler") entry.spelers++;
    else entry.staf++;
    teamMap.set(rij.team, entry);
  }

  // Check onbekende rel_codes
  const relCodes = [...new Set(csvRijen.map((r) => r.relCode))];
  const bekendeLeden = await prisma.lid.findMany({
    where: { relCode: { in: relCodes } },
    select: { relCode: true },
  });
  const bekendeSet = new Set(bekendeLeden.map((l) => l.relCode));
  const onbekendeRelCodes = relCodes.filter((rc) => !bekendeSet.has(rc));

  const teams = [...teamMap.entries()]
    .map(([naam, counts]) => ({ naam, ...counts }))
    .sort((a, b) => a.naam.localeCompare(b.naam));

  return {
    teams,
    totaalSpelers: teams.reduce((s, t) => s + t.spelers, 0),
    totaalStaf: teams.reduce((s, t) => s + t.staf, 0),
    onbekendeRelCodes,
  };
}

// -- Diff --------------------------------------------------------------------

export async function berekenTeamsSnapshotDiff(
  csvRijen: TeamCsvRij[],
  seizoen: string,
  competitie: CompetitieType
): Promise<TeamsSnapshotDiff> {
  const spelerRijen = csvRijen.filter((r) => r.teamrol === "Teamspeler");
  const csvMap = new Map(spelerRijen.map((r) => [r.relCode, r]));

  const vorige = await prisma.competitieSpeler.findMany({
    where: { seizoen, competitie },
    include: {
      lid: {
        select: {
          roepnaam: true,
          achternaam: true,
          tussenvoegsel: true,
        },
      },
    },
  });
  const vorigeMap = new Map(vorige.map((v) => [v.relCode, v]));

  const nieuw: TeamsSnapshotDiff["nieuw"] = [];
  const gewisseld: TeamsSnapshotDiff["gewisseld"] = [];

  for (const rij of spelerRijen) {
    const prev = vorigeMap.get(rij.relCode);
    if (!prev) {
      const lid = await prisma.lid.findUnique({
        where: { relCode: rij.relCode },
        select: { roepnaam: true, achternaam: true, tussenvoegsel: true },
      });
      const naam = lid
        ? [lid.roepnaam, lid.tussenvoegsel, lid.achternaam].filter(Boolean).join(" ")
        : rij.relCode;
      nieuw.push({ relCode: rij.relCode, naam, team: rij.team });
    } else if (prev.team !== rij.team) {
      const naam = [prev.lid.roepnaam, prev.lid.tussenvoegsel, prev.lid.achternaam]
        .filter(Boolean)
        .join(" ");
      gewisseld.push({
        relCode: rij.relCode,
        naam,
        vanTeam: prev.team,
        naarTeam: rij.team,
      });
    }
  }

  const verdwenen = vorige
    .filter((v) => !csvMap.has(v.relCode))
    .map((v) => ({
      relCode: v.relCode,
      naam: [v.lid.roepnaam, v.lid.tussenvoegsel, v.lid.achternaam].filter(Boolean).join(" "),
      wasTeam: v.team,
    }));

  return { nieuw, gewisseld, verdwenen };
}

// -- Opslaan -----------------------------------------------------------------

export async function verwerkTeamsSnapshot(
  csvRijen: TeamCsvRij[],
  seizoen: string,
  competitie: CompetitieType
): Promise<TeamsSnapshotResult> {
  const signaleringen: string[] = [];
  let opgeslagen = 0;
  let stafOpgeslagen = 0;

  // Verwijder bestaande records voor deze competitieperiode
  await prisma.competitieSpeler.deleteMany({
    where: { seizoen, competitie },
  });

  for (const rij of csvRijen) {
    if (rij.teamrol !== "Teamspeler") {
      const staf = await prisma.staf.findFirst({
        where: { relCode: rij.relCode },
      });
      if (staf) stafOpgeslagen++;
    }

    await prisma.competitieSpeler.create({
      data: {
        relCode: rij.relCode,
        seizoen,
        competitie,
        team: rij.team,
        geslacht: rij.geslacht,
        bron: "sportlink",
      },
    });
    opgeslagen++;
  }

  logger.info(
    `[teams-snapshot] ${seizoen}/${competitie}: ${opgeslagen} records, ${stafOpgeslagen} staf herkend`
  );
  signaleringen.push(`Snapshot opgeslagen: ${opgeslagen} records voor ${seizoen} ${competitie}`);

  return { opgeslagen, stafOpgeslagen, signaleringen };
}
