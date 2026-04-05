"use server";

import { prisma } from "@/lib/db/prisma";
import { maakToegangsToken } from "@oranje-wit/auth/tokens";
import { logger, type ActionResult } from "@oranje-wit/types";

/**
 * Genereer smartlinks voor alle trainers van een evaluatieronde.
 *
 * Dit werkt NAAST het bestaande EvaluatieUitnodiging-systeem:
 * - EvaluatieUitnodiging.token → formulier-alleen toegang via /invullen?token=xxx
 * - ToegangsToken (smartlink) → volledige NextAuth sessie via /login/smartlink/{token}
 *
 * De smartlink geeft trainers toegang tot de persoonlijke hub waar ze
 * AL hun taken (evaluaties, scouting, etc.) kunnen zien.
 */
export async function genereerSmartlinksVoorRonde(
  rondeId: string
): Promise<ActionResult<{ aangemaakt: number; overgeslagen: number }>> {
  try {
    // 1. Haal de ronde op met trainer-uitnodigingen
    // @ts-expect-error TS2321 excessive stack depth (Prisma/Linux CI limitation)
    const ronde = await prisma.evaluatieRonde.findUnique({
      where: { id: rondeId },
      include: {
        uitnodigingen: {
          where: { type: "trainer" },
          select: { email: true, naam: true },
        },
      },
    });

    if (!ronde) {
      return { ok: false, error: "Ronde niet gevonden" };
    }

    // 2. Unieke trainer-emails (dedup op email)
    const trainers = new Map<string, string>();
    for (const u of ronde.uitnodigingen) {
      if (u.email && !trainers.has(u.email)) {
        trainers.set(u.email, u.naam || "");
      }
    }

    if (trainers.size === 0) {
      return {
        ok: true,
        data: { aangemaakt: 0, overgeslagen: 0 },
      };
    }

    let aangemaakt = 0;
    let overgeslagen = 0;

    // 3. Per trainer: check bestaand sessie-token, maak Gebruiker + smartlink aan
    for (const [email, naam] of trainers) {
      // Check of deze trainer al een actief, niet-verlopen sessie-token heeft
      const bestaand = await prisma.toegangsToken.findFirst({
        where: {
          email,
          type: "sessie",
          actief: true,
          verlooptOp: { gt: new Date() },
        },
      });

      if (bestaand) {
        overgeslagen++;
        continue;
      }

      // Zorg dat de trainer in de Gebruiker-tabel staat (nodig voor NextAuth signIn)
      let gebruiker = await prisma.gebruiker.findUnique({
        where: { email },
      });

      if (!gebruiker) {
        gebruiker = await prisma.gebruiker.create({
          data: {
            email,
            naam: naam || email.split("@")[0],
            clearance: 1, // trainer ziet relatieve positie
          },
        });
        logger.info(`Gebruiker auto-aangemaakt voor trainer: ${email}`);
      }

      // Genereer smartlink-token (type: "sessie", scope met evaluatieronde-context)
      await maakToegangsToken({
        email,
        naam: naam || gebruiker.naam,
        type: "sessie",
        scope: {
          bron: "evaluatieronde",
          rondeId,
          clearance: gebruiker.clearance,
          doelgroepen: gebruiker.doelgroepen,
        },
        verlooptOverDagen: 14,
      });

      aangemaakt++;
    }

    logger.info(
      `Smartlinks voor ronde ${rondeId}: ${aangemaakt} aangemaakt, ${overgeslagen} overgeslagen`
    );

    return {
      ok: true,
      data: { aangemaakt, overgeslagen },
    };
  } catch (error) {
    logger.warn("genereerSmartlinksVoorRonde mislukt:", error);
    return { ok: false, error: "Kon smartlinks niet genereren" };
  }
}
