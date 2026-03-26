import { prisma, PrismaFn } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api";
import { z } from "zod";

const ZelfEvaluatieSchema = z.object({
  token: z.string().min(1),
  plezierKorfbal: z.number().int().min(1).max(5).nullable(),
  plezierTeam: z.number().int().min(1).max(5).nullable(),
  plezierUitdaging: z.number().int().min(1).max(5).nullable(),
  plezierToelichting: z.string().optional(),
  trainingZin: z.number().int().min(1).max(5).nullable(),
  trainingKwaliteit: z.number().int().min(1).max(5).nullable(),
  wedstrijdBeleving: z.number().int().min(1).max(5).nullable(),
  trainingVerbetering: z.number().int().min(1).max(5).nullable(),
  trainingToelichting: z.string().optional(),
  toekomstIntentie: z.enum(["stop", "twijfel", "doorgaan"]).nullable(),
  toekomstAmbitie: z.enum(["hoger", "zelfde", "lager"]).nullable(),
  toekomstToelichting: z.string().optional(),
  algemeenOpmerking: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, ZelfEvaluatieSchema);
    if (!parsed.ok) return parsed.response;

    const { token, ...data } = parsed.data;

    // Valideer token
    // Prisma 7 type recursie workaround (TS2321)
    const uitnodiging = await (prisma.evaluatieUitnodiging.findUnique as PrismaFn)({
      where: { token },
      include: { ronde: true },
    });

    if (!uitnodiging || uitnodiging.type !== "speler") {
      return fail("Ongeldig token", 401, "INVALID_TOKEN");
    }
    if (uitnodiging.ronde.status !== "actief") {
      return fail("Ronde is niet actief", 400, "RONDE_NIET_ACTIEF");
    }
    if (!uitnodiging.spelerId) {
      return fail("Geen speler gekoppeld aan uitnodiging", 400, "NO_PLAYER");
    }

    // Prisma 7 type recursie workaround (TS2321)
    const evaluatie = await (prisma.spelerZelfEvaluatie.upsert as PrismaFn)({
      where: {
        spelerId_seizoen_ronde: {
          spelerId: uitnodiging.spelerId,
          seizoen: uitnodiging.ronde.seizoen,
          ronde: uitnodiging.ronde.ronde,
        },
      },
      update: {
        ...data,
        rondeId: uitnodiging.ronde.id,
        status: "ingediend",
        ingediendOp: new Date(),
      },
      create: {
        spelerId: uitnodiging.spelerId,
        seizoen: uitnodiging.ronde.seizoen,
        ronde: uitnodiging.ronde.ronde,
        rondeId: uitnodiging.ronde.id,
        ...data,
        status: "ingediend",
        ingediendOp: new Date(),
      },
    });

    return ok({ id: evaluatie.id });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
