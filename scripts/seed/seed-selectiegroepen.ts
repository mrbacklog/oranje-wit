import { prisma, teamId } from "./types";
import { logger } from "@oranje-wit/types";

/**
 * Sectie 1.7 — Selectiegroepen: gebundeld én ongebundeld.
 *
 * sg-senioren-a (gebundeld=true):
 *   Teams team-edge-01 (S1) + team-edge-02 (S2)
 *   Spelers verhuisd van TeamSpeler naar SelectieSpeler.
 *   De originele TeamSpeler-rijen worden verwijderd.
 *
 * sg-u17 (gebundeld=false):
 *   Teams team-edge-09 (U17-1) + team-edge-10 (U17-2)
 *   TeamSpeler ongemoeid, geen SelectieSpeler.
 */
export async function seedSelectiegroepen(): Promise<void> {
  logger.info("[seed-selectiegroepen] starten");

  const versieId = "versie-edge-actief";

  // 1. Maak selectiegroepen aan (idempotent via upsert)
  await prisma.selectieGroep.upsert({
    where: { id: "sg-senioren-a" },
    create: {
      id: "sg-senioren-a",
      versieId,
      naam: "Senioren A",
      gebundeld: true,
    },
    update: {
      naam: "Senioren A",
      gebundeld: true,
    },
  });

  await prisma.selectieGroep.upsert({
    where: { id: "sg-u19" },
    create: { id: "sg-u19", versieId, naam: "U19", gebundeld: false },
    update: { naam: "U19", gebundeld: false },
  });

  await prisma.selectieGroep.upsert({
    where: { id: "sg-u17" },
    create: { id: "sg-u17", versieId, naam: "U17", gebundeld: false },
    update: { naam: "U17", gebundeld: false },
  });

  await prisma.selectieGroep.upsert({
    where: { id: "sg-u15" },
    create: { id: "sg-u15", versieId, naam: "U15", gebundeld: false },
    update: { naam: "U15", gebundeld: false },
  });

  logger.info("[seed-selectiegroepen] 4 selectiegroepen aangemaakt");

  // 2. Koppel teams aan selectiegroepen via selectieGroepId
  await prisma.team.update({
    where: { id: teamId(1) },
    data: { selectieGroepId: "sg-senioren-a" },
  });
  await prisma.team.update({
    where: { id: teamId(2) },
    data: { selectieGroepId: "sg-senioren-a" },
  });
  await prisma.team.update({
    where: { id: teamId(7) },
    data: { selectieGroepId: "sg-u19" },
  });
  await prisma.team.update({
    where: { id: teamId(8) },
    data: { selectieGroepId: "sg-u19" },
  });
  await prisma.team.update({
    where: { id: teamId(9) },
    data: { selectieGroepId: "sg-u17" },
  });
  await prisma.team.update({
    where: { id: teamId(10) },
    data: { selectieGroepId: "sg-u17" },
  });
  await prisma.team.update({
    where: { id: teamId(11) },
    data: { selectieGroepId: "sg-u15" },
  });
  await prisma.team.update({
    where: { id: teamId(12) },
    data: { selectieGroepId: "sg-u15" },
  });

  logger.info("[seed-selectiegroepen] 8 teams gekoppeld aan 4 selectiegroepen");

  // 3. sg-senioren-a (gebundeld): verhuis TeamSpeler van S1+S2 naar SelectieSpeler
  //    Haal alle huidige TeamSpeler-rijen op voor team-edge-01 en team-edge-02
  const team1Id = teamId(1);
  const team2Id = teamId(2);

  const teamSpelersS1 = await prisma.teamSpeler.findMany({
    where: { teamId: team1Id },
    select: { spelerId: true },
  });
  const teamSpelersS2 = await prisma.teamSpeler.findMany({
    where: { teamId: team2Id },
    select: { spelerId: true },
  });

  const alleSpelers: string[] = [
    ...teamSpelersS1.map((ts: { spelerId: string }) => ts.spelerId),
    ...teamSpelersS2.map((ts: { spelerId: string }) => ts.spelerId),
  ];

  // Upsert SelectieSpeler voor alle spelers in sg-senioren-a
  let selectieAantal = 0;
  for (const spelerId of alleSpelers) {
    await prisma.selectieSpeler.upsert({
      where: {
        selectieGroepId_spelerId: {
          selectieGroepId: "sg-senioren-a",
          spelerId,
        },
      },
      create: {
        selectieGroepId: "sg-senioren-a",
        spelerId,
        statusOverride: null,
      },
      update: {
        statusOverride: null,
      },
    });
    selectieAantal++;
  }

  // Verwijder de originele TeamSpeler-rijen voor S1 en S2
  const { count: verwijderd } = await prisma.teamSpeler.deleteMany({
    where: {
      teamId: { in: [team1Id, team2Id] },
    },
  });

  logger.info(
    `[seed-selectiegroepen] sg-senioren-a: ${selectieAantal} spelers naar SelectieSpeler, ` +
      `${verwijderd} TeamSpeler-rijen verwijderd`
  );

  // 4. sg-u19/sg-u17/sg-u15 (ongebundeld): TeamSpeler ongemoeid, geen SelectieSpeler
  const teamSpelersOngeb = await prisma.teamSpeler.count({
    where: {
      teamId: { in: [teamId(7), teamId(8), teamId(9), teamId(10), teamId(11), teamId(12)] },
    },
  });
  logger.info(
    `[seed-selectiegroepen] sg-u19/u17/u15: ${teamSpelersOngeb} TeamSpeler-rijen intact (ongebundeld)`
  );

  logger.info("[seed-selectiegroepen] klaar");
}
