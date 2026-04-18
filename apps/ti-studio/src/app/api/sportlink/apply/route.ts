import { NextRequest } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody } from "@oranje-wit/types";
import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { SpelerStatus } from "@oranje-wit/database";

function lidTypeNaarStatus(lidType: string): SpelerStatus {
  switch (lidType) {
    case "recreant":
      return "RECREANT";
    case "algemeen-reserve":
      return "ALGEMEEN_RESERVE";
    case "niet-spelend":
      return "NIET_SPELEND";
    case "nieuw-lid":
      return "NIEUW_DEFINITIEF";
    default:
      return "BESCHIKBAAR";
  }
}

const ApplySchema = z.object({
  nieuwe: z.array(
    z.object({
      relCode: z.string(),
      roepnaam: z.string(),
      achternaam: z.string(),
      geboortejaar: z.number(),
      geboortedatum: z.string(),
      geslacht: z.enum(["M", "V"]),
      lidType: z
        .enum(["korfbalspeler", "recreant", "algemeen-reserve", "niet-spelend", "nieuw-lid"])
        .optional()
        .default("korfbalspeler"),
    })
  ),
  afgemeld: z.array(z.string()),
  koppelingen: z.array(
    z.object({
      oudSpelerId: z.string(),
      nieuweRelCode: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, ApplySchema);
  if (!body.ok) return body.response;

  try {
    const { nieuwe, afgemeld, koppelingen } = body.data;
    let aangemaakt = 0;
    let afgemeldCount = 0;
    let gekoppeld = 0;

    for (const speler of nieuwe) {
      await prisma.speler.create({
        data: {
          id: speler.relCode,
          roepnaam: speler.roepnaam,
          achternaam: speler.achternaam,
          geboortejaar: speler.geboortejaar,
          geboortedatum: new Date(speler.geboortedatum),
          geslacht: speler.geslacht === "M" ? "MAN" : "VROUW",
          status: lidTypeNaarStatus(speler.lidType ?? "korfbalspeler"),
        },
      });
      aangemaakt++;
    }

    for (const spelerId of afgemeld) {
      await prisma.speler.update({
        where: { id: spelerId },
        data: { status: "GAAT_STOPPEN" },
      });
      afgemeldCount++;
    }

    for (const { oudSpelerId, nieuweRelCode } of koppelingen) {
      const bestaand = await prisma.speler.findUnique({ where: { id: oudSpelerId } });
      if (!bestaand) continue;

      await prisma.speler.create({
        data: { ...bestaand, id: nieuweRelCode },
      });

      await prisma.teamSpeler.updateMany({
        where: { spelerId: oudSpelerId },
        data: { spelerId: nieuweRelCode },
      });
      await prisma.selectieSpeler.updateMany({
        where: { spelerId: oudSpelerId },
        data: { spelerId: nieuweRelCode },
      });
      await prisma.evaluatie.updateMany({
        where: { spelerId: oudSpelerId },
        data: { spelerId: nieuweRelCode },
      });

      await prisma.speler.delete({ where: { id: oudSpelerId } });
      gekoppeld++;
    }

    logger.info(
      `[sportlink] Apply: ${aangemaakt} aangemaakt, ${afgemeldCount} afgemeld, ${gekoppeld} gekoppeld`
    );
    return ok({ aangemaakt, afgemeld: afgemeldCount, gekoppeld });
  } catch (error) {
    logger.error("[sportlink] Apply fout:", error);
    const message = error instanceof Error ? error.message : "Doorvoeren mislukt";
    return fail(message);
  }
}
