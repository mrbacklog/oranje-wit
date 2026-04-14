"use server";

import { prisma, anyTeam } from "@/lib/teamindeling/db/prisma";
import type { Prisma, TeamCategorie, Kleur, SpelerStatus } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { assertBewerkbaar } from "@oranje-wit/teamindeling-shared/seizoen";
import { assertSpelerVrij } from "@/lib/teamindeling/db/speler-guard";
import { maakWerkindelingSnapshot } from "@/lib/teamindeling/db/werkindeling-snapshot";
import { requireTC } from "@oranje-wit/auth/checks";
import type { ActionResult } from "@oranje-wit/types";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

const NIET_VERWIJDERD = { verwijderdOp: null } as const;

async function assertTeamBewerkbaar(teamId: string) {
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      versie: {
        select: {
          werkindeling: { select: { kaders: { select: { seizoen: true } } } },
        },
      },
    },
  })) as { versie: { werkindeling: { kaders: { seizoen: string } } } };
  await assertBewerkbaar(team.versie.werkindeling.kaders.seizoen);
}

async function assertVersieBewerkbaar(versieId: string) {
  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: {
      werkindeling: { select: { kaders: { select: { seizoen: true } } } },
    },
  });
  await assertBewerkbaar(versie.werkindeling.kaders.seizoen);
}

async function assertWerkindelingBewerkbaar(werkindelingId: string) {
  const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
    where: { id: werkindelingId },
    select: { kaders: { select: { seizoen: true } } },
  });
  await assertBewerkbaar(werkindeling.kaders.seizoen);
}

export async function getWerkindelingVoorEditor(werkindelingId: string) {
  const volledig = await prisma.werkindeling.findUnique({
    where: { id: werkindelingId, ...NIET_VERWIJDERD },
    select: {
      id: true,
      naam: true,
      status: true,
      toelichting: true,
      kaders: { select: { id: true, seizoen: true } },
      versies: {
        orderBy: { nummer: "desc" },
        select: {
          id: true,
          nummer: true,
          naam: true,
          auteur: true,
          createdAt: true,
          posities: true,
          selectieGroepen: {
            include: {
              spelers: { include: { speler: true } },
              staf: { include: { staf: true } },
            },
          },
          teams: {
            orderBy: { volgorde: "asc" },
            include: {
              spelers: { include: { speler: true } },
              staf: { include: { staf: true } },
            },
          },
        },
      },
    },
  });

  if (!volledig) return null;

  type VersieRij = (typeof volledig.versies)[number];
  type TeamRij = VersieRij["teams"][number];

  return {
    ...volledig,
    versies: volledig.versies.map((v: VersieRij) => ({
      ...v,
      teams: v.teams.map((t: TeamRij) => ({ ...t, werkitems: [] })),
    })),
  };
}

export async function getAlleSpelers() {
  const spelers = await prisma.speler.findMany({
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geboortedatum: true,
      geslacht: true,
      status: true,
      huidig: true,
      spelerspad: true,
      seizoenenActief: true,
    },
  });

  // Haal tussenvoegsels en USS-scores parallel op
  const relCodes = spelers.map((s) => s.id);
  const [leden, ussScores, fotos] = await Promise.all([
    prisma.lid.findMany({
      where: { relCode: { in: relCodes } },
      select: { relCode: true, tussenvoegsel: true },
    }),
    prisma.spelerUSS.findMany({
      where: { spelerId: { in: relCodes }, seizoen: HUIDIG_SEIZOEN },
      select: { spelerId: true, ussOverall: true },
    }),
    prisma.lidFoto.findMany({
      where: { relCode: { in: relCodes } },
      select: { relCode: true },
    }),
  ]);

  const tussenvoegelMap = new Map<string, string | null>(
    leden.map((l: { relCode: string; tussenvoegsel: string | null }) => [
      l.relCode,
      l.tussenvoegsel,
    ])
  );
  const ussMap = new Map<string, number | null>(
    ussScores.map((u: { spelerId: string; ussOverall: number | null }) => [
      u.spelerId,
      u.ussOverall ?? null,
    ])
  );
  const fotoSet = new Set<string>(fotos.map((f: { relCode: string }) => f.relCode));

  return spelers.map((s) => ({
    ...s,
    tussenvoegsel: tussenvoegelMap.get(s.id) ?? null,
    ussScore: ussMap.get(s.id) ?? null,
    heeftFoto: fotoSet.has(s.id),
  }));
}

export async function getPosities(versieId: string) {
  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: { posities: true },
  });
  return versie.posities as Record<string, { x: number; y: number }> | null;
}

export async function slaPositiesOp(versieId: string, posities: Record<string, unknown>) {
  await requireTC();
  await assertVersieBewerkbaar(versieId);
  await prisma.versie.update({ where: { id: versieId }, data: { posities } });
}

export async function hernoem(werkindelingId: string, naam: string) {
  await requireTC();
  await assertWerkindelingBewerkbaar(werkindelingId);
  if (!naam.trim()) throw new Error("Naam mag niet leeg zijn");
  await prisma.werkindeling.update({
    where: { id: werkindelingId },
    data: { naam: naam.trim() },
  });
  revalidatePath("/indeling");
}

export async function voegSpelerToeAanTeam(
  teamId: string,
  spelerId: string,
  statusOverride?: string
) {
  await requireTC();
  await assertTeamBewerkbaar(teamId);
  await assertSpelerVrij(spelerId, teamId);
  await anyTeam.update({
    where: { id: teamId },
    data: {
      spelers: { create: { spelerId, statusOverride: statusOverride ?? null } },
    },
  });
  revalidatePath("/indeling");
}

export async function verwijderSpelerUitTeam(teamId: string, spelerId: string) {
  await requireTC();
  await assertTeamBewerkbaar(teamId);
  await prisma.teamSpeler.deleteMany({ where: { teamId, spelerId } });
  revalidatePath("/indeling");
}

export async function verwijderWerkindeling(werkindelingId: string, auteur: string) {
  await requireTC();
  await assertWerkindelingBewerkbaar(werkindelingId);
  await maakWerkindelingSnapshot(werkindelingId, "VERWIJDERD", auteur);
  await prisma.werkindeling.update({
    where: { id: werkindelingId },
    data: { verwijderdOp: new Date() },
  });
  revalidatePath("/indeling");
}

export async function getSpelerProfiel(spelerId: string, kadersId?: string) {
  await requireTC();
  const [speler, competitieHistorie, kadersSpeler, ussRecord] = await Promise.all([
    prisma.speler.findUnique({
      where: { id: spelerId },
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geboortedatum: true,
        geslacht: true,
        status: true,
        huidig: true,
        spelerspad: true,
        volgendSeizoen: true,
        rating: true,
        lidSinds: true,
        seizoenenActief: true,
      },
    }),
    prisma.competitieSpeler.findMany({
      where: { relCode: spelerId },
      select: { seizoen: true, team: true },
      orderBy: { seizoen: "desc" },
      distinct: ["seizoen"],
    }),
    kadersId
      ? prisma.kadersSpeler.findUnique({
          where: { kadersId_spelerId: { kadersId, spelerId } },
          select: { statusOverride: true },
        })
      : Promise.resolve(null),
    prisma.spelerUSS.findFirst({
      where: { spelerId, seizoen: HUIDIG_SEIZOEN },
      select: { ussOverall: true },
    }),
  ]);
  if (!speler) return null;
  return {
    ...speler,
    competitieHistorie,
    statusOverride: kadersSpeler?.statusOverride ?? null,
    ussScore: ussRecord?.ussOverall ?? null,
  };
}

export async function getKadersStatusOverrides(kadersId: string): Promise<Record<string, string>> {
  try {
    const overrides = await prisma.kadersSpeler.findMany({
      where: { kadersId, statusOverride: { not: null } },
      select: { spelerId: true, statusOverride: true },
    });
    const result: Record<string, string> = {};
    for (const o of overrides) {
      if (o.statusOverride) result[o.spelerId] = o.statusOverride;
    }
    return result;
  } catch (error) {
    // Defensief: kolom bestaat mogelijk nog niet als migratie nog niet is uitgevoerd
    logger.warn("getKadersStatusOverrides fout (migratie pending?):", error);
    return {};
  }
}

export async function updateSpelerStatus(
  kadersId: string,
  spelerId: string,
  status: string | null // null = reset naar Sportlink-status
): Promise<void> {
  await requireTC();
  await prisma.kadersSpeler.upsert({
    where: { kadersId_spelerId: { kadersId, spelerId } },
    update: { statusOverride: status as SpelerStatus | null },
    create: { kadersId, spelerId, statusOverride: status as SpelerStatus | null },
  });
  revalidatePath("/indeling");
  revalidatePath("/personen");
  revalidatePath("/personen/spelers");
}

// ─── Selectie-bundeling actions ──────────────────────────────────────────────

export async function voegSelectieSpelerToe(
  selectieGroepId: string,
  spelerId: string
): Promise<import("@oranje-wit/types").ActionResult<{ id: string }>> {
  await requireTC();
  try {
    const selectieGroep = await prisma.selectieGroep.findUniqueOrThrow({
      where: { id: selectieGroepId },
      select: {
        versieId: true,
        teams: { select: { id: true } },
      },
    });
    const teamIds = selectieGroep.teams.map((t: { id: string }) => t.id);
    await prisma.teamSpeler.deleteMany({
      where: { spelerId, teamId: { in: teamIds } },
    });
    const selectieSpeler = await prisma.selectieSpeler.upsert({
      where: { selectieGroepId_spelerId: { selectieGroepId, spelerId } },
      create: { selectieGroepId, spelerId },
      update: {},
      select: { id: true },
    });
    revalidatePath("/indeling");
    return { ok: true, data: { id: selectieSpeler.id } };
  } catch (error) {
    logger.warn("voegSelectieSpelerToe fout:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function verwijderSelectieSpeler(
  selectieGroepId: string,
  spelerId: string
): Promise<import("@oranje-wit/types").ActionResult<void>> {
  await requireTC();
  try {
    await prisma.selectieSpeler.deleteMany({ where: { selectieGroepId, spelerId } });
    revalidatePath("/indeling");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("verwijderSelectieSpeler fout:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function toggleSelectieBundeling(
  selectieGroepId: string,
  gebundeld: boolean,
  primaryTeamId?: string
): Promise<
  import("@oranje-wit/types").ActionResult<{
    spelersVerplaatst: number;
    stafVerplaatst: number;
    doelTeamNaam?: string;
  }>
> {
  await requireTC();
  try {
    const selectieGroep = await prisma.selectieGroep.findUniqueOrThrow({
      where: { id: selectieGroepId },
      select: {
        teams: {
          select: { id: true, naam: true },
          orderBy: { volgorde: "asc" },
        },
        spelers: { select: { spelerId: true, statusOverride: true, notitie: true } },
        staf: { select: { stafId: true, rol: true } },
      },
    });
    type GroepTeam = { id: string; naam: string };
    type GroepSpeler = { spelerId: string; statusOverride: string | null; notitie: string | null };
    type GroepStaf = { stafId: string; rol: string };
    const groepTeams = selectieGroep.teams as GroepTeam[];
    const groepSpelers = selectieGroep.spelers as GroepSpeler[];
    const groepStaf = selectieGroep.staf as GroepStaf[];
    const teamIds = groepTeams.map((t: GroepTeam) => t.id);
    const primaryTeam = primaryTeamId
      ? groepTeams.find((t: GroepTeam) => t.id === primaryTeamId)
      : groepTeams[0];
    const primaryId = primaryTeam?.id;

    let spelersVerplaatst = 0;
    let stafVerplaatst = 0;

    if (gebundeld) {
      // BUNDELEN: verhuis TeamSpeler + TeamStaf → SelectieSpeler + SelectieStaf
      const [teamSpelers, teamStaf] = await Promise.all([
        prisma.teamSpeler.findMany({
          where: { teamId: { in: teamIds } },
          select: { spelerId: true, statusOverride: true, notitie: true },
        }),
        prisma.teamStaf.findMany({
          where: { teamId: { in: teamIds } },
          select: { stafId: true, rol: true },
        }),
      ]);

      // Dedupe — een speler kan in meerdere teams van de selectie zitten
      const uniekeSpelers = new Map<string, (typeof teamSpelers)[number]>();
      for (const ts of teamSpelers) {
        if (!uniekeSpelers.has(ts.spelerId)) uniekeSpelers.set(ts.spelerId, ts);
      }
      const uniekeStaf = new Map<string, (typeof teamStaf)[number]>();
      for (const ts of teamStaf) {
        if (!uniekeStaf.has(ts.stafId)) uniekeStaf.set(ts.stafId, ts);
      }

      await prisma.$transaction([
        ...[...uniekeSpelers.values()].map((ts) =>
          prisma.selectieSpeler.upsert({
            where: { selectieGroepId_spelerId: { selectieGroepId, spelerId: ts.spelerId } },
            create: {
              selectieGroepId,
              spelerId: ts.spelerId,
              statusOverride: ts.statusOverride,
              notitie: ts.notitie,
            },
            update: {},
          })
        ),
        ...[...uniekeStaf.values()].map((ts) =>
          prisma.selectieStaf.upsert({
            where: { selectieGroepId_stafId: { selectieGroepId, stafId: ts.stafId } },
            create: { selectieGroepId, stafId: ts.stafId, rol: ts.rol },
            update: { rol: ts.rol },
          })
        ),
        prisma.teamSpeler.deleteMany({ where: { teamId: { in: teamIds } } }),
        prisma.teamStaf.deleteMany({ where: { teamId: { in: teamIds } } }),
        prisma.selectieGroep.update({
          where: { id: selectieGroepId },
          data: { gebundeld: true },
        }),
      ]);

      spelersVerplaatst = uniekeSpelers.size;
      stafVerplaatst = uniekeStaf.size;
    } else {
      // ONTBUNDELEN: verhuis SelectieSpeler + SelectieStaf → TeamSpeler + TeamStaf op primary team
      if (!primaryId) throw new Error("Geen primary team gevonden voor ontbundelen");

      await prisma.$transaction([
        ...groepSpelers.map((ss: GroepSpeler) =>
          prisma.teamSpeler.upsert({
            where: { teamId_spelerId: { teamId: primaryId, spelerId: ss.spelerId } },
            create: {
              teamId: primaryId,
              spelerId: ss.spelerId,
              statusOverride: ss.statusOverride,
              notitie: ss.notitie,
            },
            update: {},
          })
        ),
        ...groepStaf.map((ss: GroepStaf) =>
          prisma.teamStaf.upsert({
            where: { teamId_stafId: { teamId: primaryId, stafId: ss.stafId } },
            create: { teamId: primaryId, stafId: ss.stafId, rol: ss.rol },
            update: { rol: ss.rol },
          })
        ),
        prisma.selectieSpeler.deleteMany({ where: { selectieGroepId } }),
        prisma.selectieStaf.deleteMany({ where: { selectieGroepId } }),
        prisma.selectieGroep.update({
          where: { id: selectieGroepId },
          data: { gebundeld: false },
        }),
      ]);

      spelersVerplaatst = groepSpelers.length;
      stafVerplaatst = groepStaf.length;
    }

    revalidatePath("/indeling");
    return {
      ok: true,
      data: {
        spelersVerplaatst,
        stafVerplaatst,
        doelTeamNaam: gebundeld ? undefined : primaryTeam?.naam,
      },
    };
  } catch (error) {
    logger.warn("toggleSelectieBundeling fout:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function maakTeamAan(
  versieId: string,
  naam: string,
  categorie: string
): Promise<ActionResult<{ id: string; naam: string; categorie: string; volgorde: number }>> {
  await requireTC();
  try {
    const versie = await prisma.versie.findUniqueOrThrow({
      where: { id: versieId },
      select: { werkindeling: { select: { kaders: { select: { seizoen: true } } } } },
    });
    await assertBewerkbaar(versie.werkindeling.kaders.seizoen);

    const aantalBestaand = await prisma.team.count({ where: { versieId } });
    const team = await prisma.team.create({
      data: { versieId, naam: naam.trim(), categorie, volgorde: aantalBestaand + 1 },
      select: { id: true, naam: true, categorie: true, volgorde: true },
    });

    return { ok: true, data: team };
  } catch (error) {
    logger.warn("maakTeamAan fout:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
