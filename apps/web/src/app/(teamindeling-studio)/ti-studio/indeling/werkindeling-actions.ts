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
  revalidatePath("/ti-studio/indeling");
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
  revalidatePath("/ti-studio/indeling");
}

export async function verwijderSpelerUitTeam(teamId: string, spelerId: string) {
  await requireTC();
  await assertTeamBewerkbaar(teamId);
  await prisma.teamSpeler.deleteMany({ where: { teamId, spelerId } });
  revalidatePath("/ti-studio/indeling");
}

export async function verwijderWerkindeling(werkindelingId: string, auteur: string) {
  await requireTC();
  await assertWerkindelingBewerkbaar(werkindelingId);
  await maakWerkindelingSnapshot(werkindelingId, "VERWIJDERD", auteur);
  await prisma.werkindeling.update({
    where: { id: werkindelingId },
    data: { verwijderdOp: new Date() },
  });
  revalidatePath("/ti-studio/indeling");
}

export async function getSpelerProfiel(spelerId: string) {
  await requireTC();
  const [speler, competitieHistorie] = await Promise.all([
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
  ]);
  return speler ? { ...speler, competitieHistorie } : null;
}

export async function updateSpelerStatus(spelerId: string, status: string): Promise<void> {
  await requireTC();
  await prisma.speler.update({
    where: { id: spelerId },
    data: { status: status as SpelerStatus },
  });
  revalidatePath("/ti-studio/indeling");
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
    revalidatePath("/ti-studio/indeling");
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
    revalidatePath("/ti-studio/indeling");
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
): Promise<import("@oranje-wit/types").ActionResult<void>> {
  await requireTC();
  try {
    const selectieGroep = await prisma.selectieGroep.findUniqueOrThrow({
      where: { id: selectieGroepId },
      select: {
        teams: {
          select: { id: true },
          orderBy: { volgorde: "asc" },
        },
        spelers: { select: { spelerId: true, statusOverride: true, notitie: true } },
      },
    });
    const teamIds = selectieGroep.teams.map((t: { id: string }) => t.id);
    const primaryId = primaryTeamId ?? selectieGroep.teams[0]?.id;

    if (gebundeld) {
      const teamSpelers = await prisma.teamSpeler.findMany({
        where: { teamId: { in: teamIds } },
        select: { spelerId: true, statusOverride: true, notitie: true },
      });
      await prisma.$transaction([
        ...teamSpelers.map(
          (ts: { spelerId: string; statusOverride: string | null; notitie: string | null }) =>
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
        prisma.teamSpeler.deleteMany({ where: { teamId: { in: teamIds } } }),
      ]);
    } else {
      if (!primaryId) throw new Error("Geen primary team gevonden voor ontbundelen");
      const selectieSpelers = selectieGroep.spelers;
      await prisma.$transaction([
        ...selectieSpelers.map(
          (ss: { spelerId: string; statusOverride: string | null; notitie: string | null }) =>
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
        prisma.selectieSpeler.deleteMany({ where: { selectieGroepId } }),
      ]);
    }

    revalidatePath("/ti-studio/indeling");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("toggleSelectieBundeling fout:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
