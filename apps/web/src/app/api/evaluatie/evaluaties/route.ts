import { prisma } from "@/lib/db/prisma";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;
import { ok, fail, parseBody } from "@/lib/api/response";
import { verstuurTemplateEmail } from "@/lib/evaluatie/mail";
import { logger } from "@oranje-wit/types";
import { z } from "zod";

const SpelerScoreSchema = z.object({
  relCode: z.string().min(1),
  naam: z.string().min(1),
  niveau: z.number().int().min(1).max(5).nullable(),
  inzet: z.number().int().min(1).max(3).nullable(),
  groei: z.number().int().min(1).max(4).nullable(),
  opmerking: z.string().optional(),
});

const TeamScoreSchema = z.object({
  plezier: z.number().int().min(1).max(5).nullable(),
  plezierToelichting: z.string().optional(),
  ontwikkeling: z.number().int().min(1).max(5).nullable(),
  ontwikkelingToelichting: z.string().optional(),
  prestatie: z.number().int().min(1).max(5).nullable(),
  prestatieToelichting: z.string().optional(),
});

const SubmitSchema = z.object({
  token: z.string().min(1),
  teamScore: TeamScoreSchema,
  spelerScores: z.array(SpelerScoreSchema),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, SubmitSchema);
    if (!parsed.ok) return parsed.response;

    const { token, teamScore, spelerScores } = parsed.data;

    // Valideer token
    // Prisma 7 type recursie workaround (TS2321)
    const uitnodiging = await (prisma.evaluatieUitnodiging.findUnique as PrismaFn)({
      where: { token },
      include: {
        ronde: true,
        owTeam: { select: { id: true, naam: true } },
      },
    });

    if (!uitnodiging) return fail("Ongeldig token", 401, "INVALID_TOKEN");
    if (uitnodiging.ronde.status !== "actief")
      return fail("Ronde is niet actief", 400, "RONDE_NIET_ACTIEF");

    const { ronde, owTeam } = uitnodiging;

    // Sla evaluaties op per speler
    const evaluaties = [];
    for (const score of spelerScores) {
      const scoreData = {
        niveau: score.niveau,
        inzet: score.inzet,
        groei: score.groei,
        team_plezier: teamScore.plezier,
        team_plezier_toelichting: teamScore.plezierToelichting,
        team_ontwikkeling: teamScore.ontwikkeling,
        team_ontwikkeling_toelichting: teamScore.ontwikkelingToelichting,
        team_prestatie: teamScore.prestatie,
        team_prestatie_toelichting: teamScore.prestatieToelichting,
      };

      // Prisma 7 type recursie workaround (TS2321)

      const evaluatie = await (prisma.evaluatie.upsert as PrismaFn)({
        where: {
          spelerId_seizoen_ronde_type: {
            spelerId: score.relCode,
            seizoen: ronde.seizoen,
            ronde: ronde.ronde,
            type: "trainer",
          },
        },
        update: {
          scores: scoreData,
          opmerking: score.opmerking ?? null,
          coach: uitnodiging.naam,
          teamNaam: owTeam?.naam ?? null,
          rondeId: ronde.id,
          status: "ingediend",
          ingediendOp: new Date(),
        },
        create: {
          spelerId: score.relCode,
          seizoen: ronde.seizoen,
          ronde: ronde.ronde,
          type: "trainer",
          rondeId: ronde.id,
          coach: uitnodiging.naam,
          teamNaam: owTeam?.naam ?? null,
          scores: scoreData,
          opmerking: score.opmerking ?? null,
          status: "ingediend",
          ingediendOp: new Date(),
        },
      });
      evaluaties.push(evaluatie);
    }

    // Bevestigingsmail naar trainer
    try {
      await verstuurTemplateEmail({
        aan: uitnodiging.email,
        templateSleutel: "trainer_bevestiging",
        variabelen: {
          trainer_naam: uitnodiging.naam,
          team_naam: owTeam?.naam ?? "Onbekend",
        },
      });
    } catch (emailError) {
      logger.warn("Bevestigingsmail mislukt:", emailError);
    }

    // Notificatie naar coordinatoren van dit team
    if (owTeam) {
      try {
        await notificeerCoordinatoren(ronde, owTeam, uitnodiging);
      } catch (notifError) {
        logger.warn("Coordinator notificatie mislukt:", notifError);
      }
    }

    return ok({ evaluaties: evaluaties.length });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

async function notificeerCoordinatoren(
  ronde: { id: string; seizoen: string },
  owTeam: { id: number; naam: string | null },
  uitnodiging: { naam: string }
) {
  // Prisma 7 type recursie workaround (TS2321)
  const coordTeams = await (prisma.coordinatorTeam.findMany as PrismaFn)({
    where: { owTeamId: owTeam.id, seizoen: ronde.seizoen },
    include: { coordinator: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  for (const ct of coordTeams) {
    // Prisma 7 type recursie workaround (TS2321)
    const coordUitnodiging = await (prisma.evaluatieUitnodiging.findFirst as PrismaFn)({
      where: {
        rondeId: ronde.id,
        email: ct.coordinator.email,
        type: "coordinator",
      },
    });
    const link = coordUitnodiging
      ? `${baseUrl}/coordinator?token=${coordUitnodiging.token}`
      : `${baseUrl}/admin`;

    try {
      await verstuurTemplateEmail({
        aan: ct.coordinator.email,
        templateSleutel: "coordinator_notificatie",
        variabelen: {
          coordinator_naam: ct.coordinator.naam,
          trainer_naam: uitnodiging.naam,
          team_naam: owTeam.naam ?? "",
          link,
        },
      });
    } catch (emailError) {
      logger.warn(`Notificatie naar ${ct.coordinator.email} mislukt:`, emailError);
    }
  }
}
