import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type { SportlinkTeamLid, TeamSyncDryRun, TeamSyncWijziging, TeamSyncTeam } from "../types";

type Periode = "veld_najaar" | "veld_voorjaar" | "zaal" | "zaal_deel1" | "zaal_deel2";

export async function teamSyncDryRun(
  teamleden: SportlinkTeamLid[],
  seizoen: string,
  periode: Periode,
  spelvorm: "Veld" | "Zaal"
): Promise<TeamSyncDryRun> {
  const huidigeRecords = await prisma.competitieSpeler.findMany({
    where: { seizoen, competitie: periode },
    include: { lid: { select: { roepnaam: true, achternaam: true } } },
  });

  const huidigeMap = new Map(
    huidigeRecords.map((r) => [r.relCode, { team: r.team, bron: r.bron }])
  );

  const sportlinkSpelers = teamleden.filter((t) => t.IsPlayer);
  const sportlinkStaf = teamleden.filter((t) => !t.IsPlayer);

  const sportlinkMap = new Map<string, SportlinkTeamLid>();
  for (const lid of sportlinkSpelers) {
    sportlinkMap.set(lid.PublicPersonId, lid);
  }

  const nieuwInTeam: TeamSyncWijziging[] = [];
  const uitTeam: TeamSyncWijziging[] = [];
  const teamWissels: TeamSyncWijziging[] = [];

  for (const [relCode, slLid] of sportlinkMap) {
    const huidig = huidigeMap.get(relCode);
    if (!huidig) {
      nieuwInTeam.push({
        relCode,
        naam: slLid.FullName,
        vanTeam: null,
        naarTeam: slLid.TeamName,
        rol: slLid.TeamRoleDescription,
        functie: slLid.TeamFunctionDescription,
      });
    } else if (huidig.team !== slLid.TeamName) {
      teamWissels.push({
        relCode,
        naam: slLid.FullName,
        vanTeam: huidig.team,
        naarTeam: slLid.TeamName,
        rol: slLid.TeamRoleDescription,
        functie: slLid.TeamFunctionDescription,
      });
    }
  }

  for (const [relCode, huidig] of huidigeMap) {
    if (!sportlinkMap.has(relCode)) {
      const record = huidigeRecords.find((r) => r.relCode === relCode);
      uitTeam.push({
        relCode,
        naam: record ? `${record.lid.roepnaam} ${record.lid.achternaam}` : relCode,
        vanTeam: huidig.team,
        naarTeam: null,
        rol: "Teamspeler",
        functie: null,
      });
    }
  }

  const stafWijzigingen: TeamSyncWijziging[] = sportlinkStaf.map((s) => ({
    relCode: s.PublicPersonId,
    naam: s.FullName,
    vanTeam: null,
    naarTeam: s.TeamName,
    rol: s.TeamRoleDescription,
    functie: s.TeamFunctionDescription,
  }));

  const teamsMap = new Map<string, { spelers: number; staf: number }>();
  for (const lid of teamleden) {
    const key = lid.TeamName;
    const entry = teamsMap.get(key) ?? { spelers: 0, staf: 0 };
    if (lid.IsPlayer) entry.spelers++;
    else entry.staf++;
    teamsMap.set(key, entry);
  }

  const teams: TeamSyncTeam[] = [...teamsMap.entries()].map(([naam, counts]) => ({
    teamCode: naam,
    teamNaam: naam,
    aantalSpelers: counts.spelers,
    aantalStaf: counts.staf,
  }));

  return { spelvorm, periode, teams, nieuwInTeam, uitTeam, teamWissels, stafWijzigingen };
}

export async function syncTeams(
  teamleden: SportlinkTeamLid[],
  seizoen: string,
  periode: Periode
): Promise<{ aangemaakt: number; verwijderd: number }> {
  const spelers = teamleden.filter((t) => t.IsPlayer);

  const { count: verwijderd } = await prisma.competitieSpeler.deleteMany({
    where: { seizoen, competitie: periode, bron: "sportlink" },
  });

  const bestaandeLeden = new Set(
    (await prisma.lid.findMany({ select: { relCode: true } })).map((l) => l.relCode)
  );

  let aangemaakt = 0;
  for (const speler of spelers) {
    const relCode = speler.PublicPersonId;
    if (!relCode.match(/^[A-Z]{1,3}\w+$/)) continue;

    if (!bestaandeLeden.has(relCode)) continue;

    // Prisma 7 TS2321 workaround — type-recursie op CompetitieSpeler
    await (prisma.competitieSpeler as any).create({
      data: {
        relCode,
        seizoen,
        competitie: periode,
        team: speler.TeamName,
        geslacht: speler.GenderCode === "Male" ? "M" : "V",
        bron: "sportlink",
        betrouwbaar: true,
      },
    });
    aangemaakt++;
  }

  logger.info(
    `[sportlink] Team-sync ${seizoen} ${periode}: ${aangemaakt} aangemaakt, ${verwijderd} verwijderd`
  );

  return { aangemaakt, verwijderd };
}
