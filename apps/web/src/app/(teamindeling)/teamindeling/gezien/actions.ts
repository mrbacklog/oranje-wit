"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { revalidatePath } from "next/cache";
import type { GezienStatus } from "@oranje-wit/database";
import type { ActionResult } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";

// ============================================================
// LEZEN — teams en spelers voor een coördinator
// ============================================================

/**
 * Haal alle teams op voor de ingelogde coördinator (via coordinator_teams).
 * Geeft ook de BlauwdrukSpeler-records terug voor spelers in die teams.
 */
export async function getCoordinatorTeamsMetSpelers(blauwdrukId: string) {
  const session = await requireTC();
  const email = session.user!.email!;

  // Zoek coördinator op e-mail
  const coordinator = await prisma.coordinator.findUnique({
    where: { email },
    include: {
      teams: {
        include: {
          owTeam: true,
        },
      },
    },
  });

  if (!coordinator) {
    return { coordinator: null, teams: [] };
  }

  // Haal per gekoppeld team de spelers op via OWTeam → huidig.team mapping
  const owTeamNamen = coordinator.teams.map((ct) => ct.owTeam.naam ?? ct.owTeam.owCode);

  const blauwdrukSpelers = await prisma.blauwdrukSpeler.findMany({
    where: { blauwdrukId },
    include: {
      speler: {
        select: {
          id: true,
          roepnaam: true,
          achternaam: true,
          geboortejaar: true,
          geslacht: true,
          huidig: true,
          status: true,
        },
      },
      actiepunt: {
        select: {
          id: true,
          beschrijving: true,
          status: true,
          deadline: true,
          toegewezenAan: { select: { naam: true } },
        },
      },
      gezienDoor: { select: { naam: true } },
    },
    orderBy: [{ gezienStatus: "asc" }, { speler: { achternaam: "asc" } }],
  });

  // Filter spelers op basis van team-naam in huidig
  const spelersPerTeam: Record<string, Array<(typeof blauwdrukSpelers)[number]>> = {};

  for (const teamNaam of owTeamNamen) {
    spelersPerTeam[teamNaam] = blauwdrukSpelers.filter((bs) => {
      const huidig = bs.speler.huidig as { team?: string } | null;
      return huidig?.team === teamNaam;
    });
  }

  return {
    coordinator: { id: coordinator.id, naam: coordinator.naam },
    teams: coordinator.teams.map((ct) => ({
      id: ct.id,
      owTeamId: ct.owTeamId,
      naam: ct.owTeam.naam ?? ct.owTeam.owCode,
      kleur: ct.owTeam.kleur,
      seizoen: ct.seizoen,
      spelers: spelersPerTeam[ct.owTeam.naam ?? ct.owTeam.owCode] ?? [],
    })),
  };
}

// ============================================================
// MUTATIE — gezien-status voorstel
// ============================================================

/**
 * Coördinator stelt een gezien-status voor.
 * Schrijft naar gezienStatusVoorgesteld — TC bevestigt definitief.
 */
export async function stelGezienStatusVoor(
  spelerId: string,
  blauwdrukId: string,
  status: GezienStatus,
  notitie?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTC();
    const email = session.user!.email!;
    const naam = session.user!.name ?? email;

    const record = await prisma.blauwdrukSpeler.findUnique({
      where: { blauwdrukId_spelerId: { blauwdrukId, spelerId } },
      select: { id: true },
    });

    if (!record) {
      return { ok: false, error: `Geen BlauwdrukSpeler record gevonden voor speler ${spelerId}` };
    }

    await prisma.blauwdrukSpeler.update({
      where: { id: record.id },
      data: {
        gezienStatusVoorgesteld: status,
        gezienVoorgesteldDoor: naam,
        gezienVoorgesteldNotitie: notitie ?? null,
        gezienVoorgesteldOp: new Date(),
      },
    });

    revalidatePath("/teamindeling/gezien");
    revalidatePath("/teamindeling/blauwdruk");

    logger.info(`Gezien-voorstel: ${naam} stelde ${status} voor speler ${spelerId}`);
    return { ok: true, data: { id: record.id } };
  } catch (error) {
    logger.error("stelGezienStatusVoor mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
