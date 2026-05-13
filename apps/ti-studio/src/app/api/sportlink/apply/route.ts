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
      const data = {
        roepnaam: speler.roepnaam,
        achternaam: speler.achternaam,
        geboortejaar: speler.geboortejaar,
        geboortedatum: new Date(speler.geboortedatum),
        geslacht: speler.geslacht === "M" ? "MAN" : "VROUW",
        status: lidTypeNaarStatus(speler.lidType ?? "korfbalspeler"),
      } as const;
      await prisma.speler.upsert({
        where: { id: speler.relCode },
        create: { id: speler.relCode, ...data },
        update: data,
      });
      aangemaakt++;
    }

    // Afmelddatum bepaalt: in verleden of geen actief lid → GESTOPT (echt weg).
    // In toekomst → GAAT_STOPPEN (speelt nog dit seizoen uit).
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);

    for (const spelerId of afgemeld) {
      const lid = await prisma.lid.findUnique({
        where: { relCode: spelerId },
        select: { afmelddatum: true, lidStatus: true },
      });
      const isGestopt =
        !lid ||
        lid.lidStatus !== "ACTIVE" ||
        (lid.afmelddatum !== null && lid.afmelddatum <= vandaag);
      const nieuweStatus: SpelerStatus = isGestopt ? "GESTOPT" : "GAAT_STOPPEN";

      await prisma.speler.update({
        where: { id: spelerId },
        data: { status: nieuweStatus },
      });
      // TC-statusOverrides voor alle seizoenen leegmaken — een bondsafmelding
      // mag niet door een legacy override gemaskeerd worden in de indeling.
      await prisma.kadersSpeler.updateMany({
        where: { spelerId, statusOverride: { not: null } },
        data: { statusOverride: null },
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
