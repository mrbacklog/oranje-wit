"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { requireTC } from "@oranje-wit/auth/checks";
import { registreerLog } from "./log-actions";

// Return type voor een werkitem (gebruikt in werkbord state)
export type WerkitemData = {
  id: string;
  titel: string | null;
  beschrijving: string;
  type: string;
  status: string;
  prioriteit: string;
  volgorde: number;
  resolutie: string | null;
  createdAt: string; // ISO string (toISOString())
};

type CreateWerkitemInput = {
  kadersId: string;
  werkindelingId?: string;
  teamId?: string;
  spelerId?: string;
  stafId?: string;
  titel?: string;
  beschrijving: string;
  prioriteit?: string; // default 'MIDDEL'
  doelgroep?: string;
};

function leidEntiteitAf(input: CreateWerkitemInput): string {
  if (input.teamId) return "TEAM";
  if (input.spelerId) return "SPELER";
  if (input.stafId) return "STAF";
  return "TEAM";
}

function revalideerPaden() {
  revalidatePath("/ti-studio/indeling");
  revalidatePath("/ti-studio/memo");
}

export async function createWerkitem(
  input: CreateWerkitemInput
): Promise<ActionResult<WerkitemData>> {
  try {
    const session = await requireTC();
    const auteurId =
      ((session.user as Record<string, unknown>)?.id as string | undefined) ??
      session.user?.email ??
      "unknown";
    const auteurNaamCreate = (session.user?.name as string | undefined) ?? auteurId;
    const auteurEmailCreate = (session.user?.email as string | undefined) ?? auteurId;
    const entiteit = leidEntiteitAf(input);

    const werkitem = await prisma.werkitem.create({
      data: {
        kadersId: input.kadersId,
        werkindelingId: input.werkindelingId ?? null,
        teamId: input.teamId ?? null,
        spelerId: input.spelerId ?? null,
        stafId: input.stafId ?? null,
        titel: input.titel ?? null,
        beschrijving: input.beschrijving,
        type: "MEMO",
        prioriteit: (input.prioriteit ??
          "MIDDEL") as import("@oranje-wit/database").WerkitemPrioriteit,
        status: "OPEN",
        entiteit: entiteit as import("@oranje-wit/database").Entiteit,
        doelgroep: input.doelgroep
          ? (input.doelgroep as import("@oranje-wit/database").Doelgroep)
          : null,
        auteurId,
      },
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        type: true,
        status: true,
        prioriteit: true,
        volgorde: true,
        resolutie: true,
        createdAt: true,
      },
    });

    await registreerLog(werkitem.id, auteurNaamCreate, auteurEmailCreate, "AANGEMAAKT");
    revalideerPaden();
    return {
      ok: true,
      data: {
        ...werkitem,
        type: String(werkitem.type),
        status: String(werkitem.status),
        prioriteit: String(werkitem.prioriteit),
        createdAt: werkitem.createdAt.toISOString(),
      },
    };
  } catch (error) {
    logger.error("createWerkitem mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateWerkitemStatus(
  id: string,
  status: string
): Promise<ActionResult<void>> {
  try {
    const session2 = await requireTC().catch(() => null);
    const email2 = ((session2?.user as Record<string, unknown>)?.email as string) ?? "systeem";
    const naam2 = ((session2?.user as Record<string, unknown>)?.name as string) ?? email2;
    await prisma.werkitem.update({
      where: { id },
      data: { status: status as import("@oranje-wit/database").WerkitemStatus },
    });
    await registreerLog(id, naam2, email2, "STATUS_GEWIJZIGD", status);
    revalideerPaden();
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("updateWerkitemStatus mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateWerkitemPrioriteit(
  id: string,
  prioriteit: string
): Promise<ActionResult<void>> {
  try {
    await requireTC();
    await prisma.werkitem.update({
      where: { id },
      data: { prioriteit: prioriteit as import("@oranje-wit/database").WerkitemPrioriteit },
    });
    revalideerPaden();
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("updateWerkitemPrioriteit mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateWerkitemVolgorde(
  updates: { id: string; volgorde: number }[]
): Promise<ActionResult<void>> {
  try {
    await requireTC();
    await prisma.$transaction(
      updates.map(({ id, volgorde }) =>
        prisma.werkitem.update({ where: { id }, data: { volgorde } })
      )
    );
    revalideerPaden();
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("updateWerkitemVolgorde mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateWerkitemInhoud(
  id: string,
  data: { titel?: string | null; beschrijving: string; resolutie?: string | null }
): Promise<ActionResult<void>> {
  try {
    await requireTC();
    await prisma.werkitem.update({
      where: { id },
      data: {
        titel: data.titel ?? null,
        beschrijving: data.beschrijving,
        resolutie: data.resolutie ?? null,
      },
    });
    revalideerPaden();
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("updateWerkitemInhoud mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function verwijderWerkitem(id: string): Promise<ActionResult<void>> {
  try {
    const session3 = await requireTC().catch(() => null);
    const email3 = ((session3?.user as Record<string, unknown>)?.email as string) ?? "systeem";
    const naam3 = ((session3?.user as Record<string, unknown>)?.name as string) ?? email3;
    await registreerLog(id, naam3, email3, "VERWIJDERD");
    await prisma.werkitem.delete({ where: { id } });
    revalideerPaden();
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("verwijderWerkitem mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Systeem-werkitem (voor automatische processen zoals leden-sync)
export async function createSysteemWerkitem(data: {
  kadersId: string;
  titel: string;
  beschrijving: string;
  type: string;
  prioriteit?: string;
  entiteit?: string;
  spelerId?: string;
  stafId?: string;
  werkindelingId?: string;
}): Promise<void> {
  try {
    await prisma.werkitem.create({
      data: {
        kadersId: data.kadersId,
        titel: data.titel,
        beschrijving: data.beschrijving,
        type: data.type as import("@oranje-wit/database").WerkitemType,
        prioriteit: (data.prioriteit ??
          "MIDDEL") as import("@oranje-wit/database").WerkitemPrioriteit,
        status: "OPEN",
        entiteit: data.entiteit ? (data.entiteit as import("@oranje-wit/database").Entiteit) : null,
        spelerId: data.spelerId ?? null,
        stafId: data.stafId ?? null,
        werkindelingId: data.werkindelingId ?? null,
        auteurId: "systeem",
      },
    });
    revalideerPaden();
  } catch (error) {
    logger.warn("createWerkitem (systeem) mislukt:", error);
  }
}
