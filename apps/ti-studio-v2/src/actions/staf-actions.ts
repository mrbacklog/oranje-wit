"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma as _prisma } from "@oranje-wit/database";
import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = _prisma as any;

const nieuweStafSchema = z.object({
  naam: z.string().min(1).max(200),
  rollen: z.array(z.string()).default([]),
  email: z.string().email().optional(),
  geboortejaar: z.number().int().min(1940).max(2010).optional(),
});

export async function maakNieuweStaf(
  formData: z.infer<typeof nieuweStafSchema>
): Promise<ActionResult<{ stafId: string }>> {
  await requireTC();

  const parsed = nieuweStafSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    const count = await db.staf.count();
    const stafId = `STAF-${String(count + 1).padStart(3, "0")}`;

    await db.staf.create({
      data: {
        id: stafId,
        naam: parsed.data.naam,
        rollen: parsed.data.rollen,
        email: parsed.data.email ?? null,
        geboortejaar: parsed.data.geboortejaar ?? null,
      },
    });
    revalidatePath("/personen/staf");
    return { ok: true, data: { stafId } };
  } catch (error) {
    logger.warn("maakNieuweStaf mislukt:", error);
    return { ok: false, error: "Staf aanmaken mislukt" };
  }
}
