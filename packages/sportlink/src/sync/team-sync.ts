import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type {
  SportlinkTeamLid,
  TeamSyncDryRun,
  TeamSyncWijziging,
  TeamSyncTeam,
  TeamSyncSelectie,
} from "../types";

type Periode = "veld_najaar" | "veld_voorjaar" | "zaal" | "zaal_deel1" | "zaal_deel2";

export async function teamSyncDryRun(
  teamleden: SportlinkTeamLid[],
  seizoen: string,
  periode: Periode,
  spelvorm: "Veld" | "Zaal"
): Promise<TeamSyncDryRun> {
  // Alleen records met bron='sportlink' meenemen — records uit andere bronnen
  // (import, handmatig) mogen niet als "Uit" verschijnen in de dry-run, omdat
  // syncTeams() ze ook niet aanraakt.
  const huidigeRecords = await prisma.competitieSpeler.findMany({
    where: { seizoen, competitie: periode, bron: "sportlink" },
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

/**
 * Selectieve apply op basis van TC-keuzes uit de dry-run.
 * Voert alleen de items door die expliciet aangevinkt zijn — niet-geselecteerde
 * records blijven ongemoeid.
 */
export async function syncTeams(
  teamleden: SportlinkTeamLid[],
  seizoen: string,
  periode: Periode,
  selectie: TeamSyncSelectie
): Promise<{ aangemaakt: number; verwijderd: number; bijgewerkt: number }> {
  const spelerByRelCode = new Map<string, SportlinkTeamLid>();
  for (const t of teamleden.filter((x) => x.IsPlayer)) {
    spelerByRelCode.set(t.PublicPersonId, t);
  }

  const bestaandeLeden = new Set(
    (await prisma.lid.findMany({ select: { relCode: true } })).map((l) => l.relCode)
  );

  const nieuwSet = new Set(selectie.nieuwRelCodes);
  const uitSet = new Set(selectie.uitRelCodes);
  const wisselSet = new Set(selectie.wisselRelCodes);

  // 1. Verwijderen — alleen bron='sportlink' records voor geselecteerde relCodes
  const verwijderd = uitSet.size
    ? await prisma.competitieSpeler.deleteMany({
        where: {
          seizoen,
          competitie: periode,
          bron: "sportlink",
          relCode: { in: [...uitSet] },
        },
      })
    : { count: 0 };

  // 2. Aanmaken — nieuwe records uit Sportlink
  let aangemaakt = 0;
  for (const relCode of nieuwSet) {
    const speler = spelerByRelCode.get(relCode);
    if (!speler) continue;
    if (!relCode.match(/^[A-Z]{1,3}\w+$/)) continue;
    if (!bestaandeLeden.has(relCode)) continue;

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

  // 3. Teamwissels — update team op bestaande sportlink-records
  let bijgewerkt = 0;
  for (const relCode of wisselSet) {
    const speler = spelerByRelCode.get(relCode);
    if (!speler) continue;

    const res = await prisma.competitieSpeler.updateMany({
      where: { seizoen, competitie: periode, bron: "sportlink", relCode },
      data: { team: speler.TeamName },
    });
    if (res.count > 0) bijgewerkt++;
  }

  logger.info(
    `[sportlink] Team-sync ${seizoen} ${periode}: ${aangemaakt} aangemaakt, ${verwijderd.count} verwijderd, ${bijgewerkt} bijgewerkt`
  );

  return { aangemaakt, verwijderd: verwijderd.count, bijgewerkt };
}
