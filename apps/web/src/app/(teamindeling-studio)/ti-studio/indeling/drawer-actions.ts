"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────

export interface DrawerWerkversie {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: Date;
  aantalIngedeeld: number;
}

export interface DrawerWhatIf {
  id: string;
  vraag: string;
  status: string;
  basisVersieNummer: number;
  aantalTeams: number;
  isStale: boolean;
  createdAt: Date;
}

export interface DrawerArchiefVersie {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: Date;
}

export interface DrawerData {
  werkversie: DrawerWerkversie;
  whatIfs: DrawerWhatIf[];
  archiefVersies: DrawerArchiefVersie[];
}

// ─── getVersiesVoorDrawer ─────────────────────────────────────

export async function getVersiesVoorDrawer(werkindelingId: string): Promise<DrawerData> {
  const versies = await prisma.versie.findMany({
    where: { werkindelingId },
    orderBy: { nummer: "desc" },
    select: { id: true, nummer: true, naam: true, auteur: true, createdAt: true },
  });

  if (versies.length === 0) {
    throw new Error("Werkindeling heeft geen versies");
  }

  const werkversieRaw = versies[0];
  const archiefRaw = versies.slice(1);

  const [whatIfs, aantalIngedeeld] = await Promise.all([
    prisma.whatIf.findMany({
      where: { werkindelingId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        vraag: true,
        status: true,
        basisVersieNummer: true,
        createdAt: true,
        _count: { select: { teams: true } },
      },
    }),
    prisma.teamSpeler.count({
      where: { team: { versie: { werkindelingId, nummer: werkversieRaw.nummer } } },
    }),
  ]);

  return {
    werkversie: {
      ...werkversieRaw,
      aantalIngedeeld,
    },
    whatIfs: whatIfs.map((wi) => ({
      id: wi.id,
      vraag: wi.vraag,
      status: wi.status,
      basisVersieNummer: wi.basisVersieNummer,
      aantalTeams: wi._count.teams,
      isStale: wi.basisVersieNummer < werkversieRaw.nummer,
      createdAt: wi.createdAt,
    })),
    archiefVersies: archiefRaw,
  };
}

// ─── createWhatIfVanHuidigeVersie ─────────────────────────────

export async function createWhatIfVanHuidigeVersie(
  werkindelingId: string,
  data: { vraag: string; toelichting?: string }
): Promise<{ id: string }> {
  await requireTC();

  const hoogsteVersie = await prisma.versie.findFirst({
    where: { werkindelingId },
    orderBy: { nummer: "desc" },
    include: {
      teams: {
        select: {
          id: true,
          naam: true,
          categorie: true,
          kleur: true,
          teamType: true,
          niveau: true,
          volgorde: true,
          spelers: { select: { spelerId: true, statusOverride: true, notitie: true } },
          staf: { select: { stafId: true, rol: true } },
        },
      },
    },
  });

  if (!hoogsteVersie) {
    throw new Error("Werkindeling heeft geen versie");
  }

  const whatIf = await prisma.whatIf.create({
    data: {
      werkindelingId,
      vraag: data.vraag,
      toelichting: data.toelichting ?? null,
      basisVersieNummer: hoogsteVersie.nummer,
      teams: {
        create: hoogsteVersie.teams.map((team) => ({
          bronTeamId: team.id,
          naam: team.naam,
          categorie: team.categorie,
          kleur: team.kleur,
          teamType: team.teamType,
          niveau: team.niveau,
          volgorde: team.volgorde,
          spelers: { create: team.spelers },
          staf: { create: team.staf },
        })),
      },
    },
    select: { id: true },
  });

  logger.info(`What-if "${data.vraag}" aangemaakt voor werkindeling ${werkindelingId}`);
  revalidatePath("/ti-studio/indeling");
  return whatIf;
}
