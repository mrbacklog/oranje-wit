"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma as _prisma } from "@oranje-wit/database";
import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import type { TeamReservering } from "@/app/(app)/(studio)/indeling/_components/werkbord-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = _prisma as any;

const nieuweReserveringSchema = z.object({
  titel: z.string().min(1).max(200),
  geslacht: z.enum(["M", "V"]),
});

export async function maakNieuweReservering(
  formData: z.infer<typeof nieuweReserveringSchema>
): Promise<ActionResult<{ id: string }>> {
  await requireTC();

  const parsed = nieuweReserveringSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    const reservering = await db.reserveringsspeler.create({
      data: {
        titel: parsed.data.titel,
        geslacht: parsed.data.geslacht as "M" | "V",
      },
      select: { id: true },
    });
    revalidatePath("/personen/reserveringen");
    return { ok: true, data: { id: reservering.id } };
  } catch (error) {
    logger.warn("maakNieuweReservering mislukt:", error);
    return { ok: false, error: "Reservering aanmaken mislukt" };
  }
}

export async function maakReserveringInTeam(input: {
  teamId: string;
  geslacht: "M" | "V";
}): Promise<ActionResult<TeamReservering>> {
  await requireTC();

  try {
    // Tel bestaande reserveringen per geslacht voor dit team
    const bestaande = await db.reserveringsspeler.findMany({
      where: { teamId: input.teamId, geslacht: input.geslacht },
      select: { id: true },
    });
    const nummer = (bestaande as Array<{ id: string }>).length;
    const prefix = input.geslacht === "V" ? "D-" : "H-";
    const titel = `Plek ${prefix}${nummer + 1}`;

    const reservering = await db.reserveringsspeler.create({
      data: {
        titel,
        geslacht: input.geslacht,
        teamId: input.teamId,
      },
      select: { id: true, titel: true, geslacht: true },
    });

    revalidatePath("/indeling");
    return {
      ok: true,
      data: {
        id: reservering.id as string,
        titel: reservering.titel as string,
        geslacht: reservering.geslacht as "M" | "V",
      },
    };
  } catch (error) {
    logger.warn("maakReserveringInTeam mislukt:", error);
    return { ok: false, error: "Reservering aanmaken mislukt" };
  }
}

export async function verwijderReservering(id: string): Promise<ActionResult<{ id: string }>> {
  await requireTC();

  try {
    await db.reserveringsspeler.delete({ where: { id } });
    revalidatePath("/indeling");
    revalidatePath("/personen/reserveringen");
    return { ok: true, data: { id } };
  } catch (error) {
    logger.warn("verwijderReservering mislukt:", error);
    return { ok: false, error: "Reservering verwijderen mislukt" };
  }
}
