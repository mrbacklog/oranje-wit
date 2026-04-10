"use server";

import { prisma, anyTeam } from "@/lib/teamindeling/db/prisma";
import type { Prisma, TeamCategorie, Kleur, SpelerStatus } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { assertBewerkbaar } from "@/lib/teamindeling/seizoen";
import { assertSpelerVrij } from "@/lib/teamindeling/db/speler-guard";
import { maakWerkindelingSnapshot } from "@/lib/teamindeling/db/werkindeling-snapshot";
import { requireTC } from "@oranje-wit/auth/checks";
import type { ActionResult } from "@oranje-wit/types";

// Tijdelijk inline type — wordt verwijderd zodra SpelerProfielDialog naar werkitem-actions migreert
type MemoData = { tekst?: string; memoStatus?: string; besluit?: string | null };

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
  return prisma.werkindeling.findUnique({
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
}

export async function getAlleSpelers() {
  return prisma.speler.findMany({
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
    },
  });
}

export async function getPosities(versieId: string) {
  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: { posities: true },
  });
  return versie.posities as Record<string, { x: number; y: number }> | null;
}

export async function slaPositiesOp(versieId: string, posities: Record<string, unknown>) {
  await assertVersieBewerkbaar(versieId);
  await prisma.versie.update({ where: { id: versieId }, data: { posities } });
}

export async function hernoem(werkindelingId: string, naam: string) {
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
  await assertTeamBewerkbaar(teamId);
  await prisma.teamSpeler.deleteMany({ where: { teamId, spelerId } });
  revalidatePath("/ti-studio/indeling");
}

export async function verwijderWerkindeling(werkindelingId: string, auteur: string) {
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
        notitie: true,
        memoStatus: true,
        besluit: true,
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

export async function updateSpelerNotitie(spelerId: string, notitie: string): Promise<void> {
  await requireTC();
  await prisma.speler.update({
    where: { id: spelerId },
    data: { notitie },
  });
  revalidatePath("/ti-studio/indeling");
}

export async function updateSpelerMemo(
  spelerId: string,
  memo: MemoData
): Promise<ActionResult<void>> {
  try {
    await requireTC();
    await prisma.speler.update({
      where: { id: spelerId },
      data: {
        notitie: memo.tekst || null,
        memoStatus: memo.memoStatus,
        besluit: memo.besluit ?? null,
      },
    });
    revalidatePath("/ti-studio/indeling");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("updateSpelerMemo mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
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
