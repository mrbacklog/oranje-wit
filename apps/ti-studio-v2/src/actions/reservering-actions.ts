"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma as _prisma } from "@oranje-wit/database";
import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";

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
