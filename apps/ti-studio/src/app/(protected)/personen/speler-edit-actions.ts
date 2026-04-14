"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";
import type { GezienStatus } from "@oranje-wit/database";

/**
 * Context nodig voor inline-bewerkingen op de spelers-pagina:
 * - kadersId: voor status/gezien mutaties
 * - versieId: voor indeling mutaties
 * - teams: dropdown-opties voor indeling
 */
export async function getSpelersPaginaContext(): Promise<{
  kadersId: string | null;
  versieId: string | null;
  teams: { id: string; naam: string; kleur: string | null }[];
}> {
  await requireTC();

  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });
  if (!kaders) return { kadersId: null, versieId: null, teams: [] };

  const werkindeling = await prisma.werkindeling.findFirst({
    where: { kadersId: kaders.id, status: "ACTIEF" },
    select: {
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: {
          id: true,
          teams: {
            select: { id: true, naam: true, kleur: true, volgorde: true },
            orderBy: { volgorde: "asc" },
          },
        },
      },
    },
  });
  const versie = werkindeling?.versies?.[0];
  const versieTeams = (versie?.teams ?? []) as Array<{
    id: string;
    naam: string;
    kleur: string | null;
    volgorde: number | null;
  }>;
  return {
    kadersId: kaders.id,
    versieId: versie?.id ?? null,
    teams: versieTeams.map((t) => ({
      id: t.id,
      naam: t.naam,
      kleur: t.kleur ?? null,
    })),
  };
}

export async function setGezienStatus(
  kadersId: string,
  spelerId: string,
  status: GezienStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    await prisma.kadersSpeler.upsert({
      where: { kadersId_spelerId: { kadersId, spelerId } },
      create: { kadersId, spelerId, gezienStatus: status },
      update: { gezienStatus: status },
    });
    revalidatePath("/personen/spelers");
    return { ok: true };
  } catch (err) {
    logger.warn("setGezienStatus mislukt:", err);
    return { ok: false, error: "Kon gezien-status niet bijwerken" };
  }
}

/**
 * Verplaatst een speler binnen de werkindeling-versie:
 * - nieuwTeamId = null  → speler uit alle teams van versie verwijderen
 * - anders              → speler uit andere teams verwijderen en aan nieuw team toevoegen
 */
export async function zetSpelerIndeling(
  versieId: string,
  spelerId: string,
  nieuwTeamId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    // Haal alle teams van de versie op zodat we bestaande koppelingen kunnen
    // verwijderen (en valideren dat het nieuwTeamId tot deze versie hoort).
    const versie = (await prisma.versie.findUniqueOrThrow({
      where: { id: versieId },
      select: { teams: { select: { id: true } } },
    })) as { teams: Array<{ id: string }> };
    const teamIds = versie.teams.map((t) => t.id);

    if (nieuwTeamId && !teamIds.includes(nieuwTeamId)) {
      return { ok: false, error: "Team hoort niet bij deze versie" };
    }

    await prisma.$transaction([
      prisma.teamSpeler.deleteMany({
        where: { spelerId, teamId: { in: teamIds } },
      }),
      ...(nieuwTeamId
        ? [
            prisma.teamSpeler.create({
              data: { spelerId, teamId: nieuwTeamId },
            }),
          ]
        : []),
    ]);

    revalidatePath("/personen/spelers");
    revalidatePath("/indeling");
    return { ok: true };
  } catch (err) {
    logger.warn("zetSpelerIndeling mislukt:", err);
    return { ok: false, error: "Kon indeling niet bijwerken" };
  }
}
