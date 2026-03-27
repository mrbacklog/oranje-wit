import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/scouting/api";
import { prisma } from "@/lib/scouting/db/prisma";
import { requireTC } from "@/lib/scouting/auth/requireTC";

// Prisma 7 type recursion workaround
const db = prisma as any;

// ── GET /api/verzoeken ──────────────────────────────────────────
// Query params: status, seizoen
// Retourneert verzoeken met toewijzingen-count en rapport-count

export async function GET(request: Request) {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const seizoen = searchParams.get("seizoen");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (seizoen) where.seizoen = seizoen;

    const verzoeken = await db.scoutingVerzoek.findMany({
      where,
      include: {
        maker: { select: { naam: true, email: true } },
        _count: {
          select: {
            toewijzingen: true,
            rapporten: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = verzoeken.map(
      (v: {
        id: string;
        type: string;
        doel: string;
        status: string;
        toelichting: string | null;
        deadline: Date | null;
        anoniem: boolean;
        teamId: string | null;
        spelerIds: string[];
        seizoen: string;
        aangemaakt_door: string;
        maker: { naam: string; email: string };
        _count: { toewijzingen: number; rapporten: number };
        createdAt: Date;
        updatedAt: Date;
      }) => ({
        id: v.id,
        type: v.type,
        doel: v.doel,
        status: v.status,
        toelichting: v.toelichting,
        deadline: v.deadline?.toISOString() ?? null,
        anoniem: v.anoniem,
        teamId: v.teamId,
        spelerIds: v.spelerIds,
        seizoen: v.seizoen,
        maker: v.maker,
        aantalToewijzingen: v._count.toewijzingen,
        aantalRapporten: v._count.rapporten,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })
    );

    return ok(result);
  } catch (error) {
    logger.error("Fout bij ophalen verzoeken:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

// ── POST /api/verzoeken ─────────────────────────────────────────
// Maak een nieuw scouting-verzoek aan

const CreateVerzoekSchema = z
  .object({
    type: z.enum(["GENERIEK", "SPECIFIEK", "VERGELIJKING"]),
    doel: z.enum(["DOORSTROOM", "SELECTIE", "NIVEAUBEPALING", "OVERIG"]),
    toelichting: z.string().optional(),
    deadline: z.string().datetime({ offset: true }).optional(),
    anoniem: z.boolean().optional().default(false),
    teamId: z.string().optional(),
    spelerIds: z.array(z.string().min(1)).optional(),
    seizoen: z.string().regex(/^\d{4}-\d{4}$/, "Gebruik formaat '2025-2026'"),
    scoutIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "GENERIEK" && !data.teamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "teamId is verplicht bij type GENERIEK",
        path: ["teamId"],
      });
    }
    if (
      (data.type === "SPECIFIEK" || data.type === "VERGELIJKING") &&
      (!data.spelerIds || data.spelerIds.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "spelerIds is verplicht bij type SPECIFIEK of VERGELIJKING",
        path: ["spelerIds"],
      });
    }
    if (data.type === "VERGELIJKING" && data.spelerIds && data.spelerIds.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimaal 2 spelers nodig voor een vergelijking",
        path: ["spelerIds"],
      });
    }
  });

export async function POST(request: Request) {
  try {
    // 1. Auth: alleen TC
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    // 2. Valideer body
    const parsed = await parseBody(request, CreateVerzoekSchema);
    if (!parsed.ok) return parsed.response;

    const { type, doel, toelichting, deadline, anoniem, teamId, spelerIds, seizoen, scoutIds } =
      parsed.data;

    // 3. Valideer dat teamId bestaat bij GENERIEK
    if (type === "GENERIEK" && teamId) {
      const team = await db.oWTeam.findUnique({ where: { id: parseInt(teamId, 10) } });
      if (!team) {
        return fail(`Team met id '${teamId}' niet gevonden`, 404, "NOT_FOUND");
      }
    }

    // 4. Valideer dat spelerIds bestaan bij SPECIFIEK/VERGELIJKING
    if ((type === "SPECIFIEK" || type === "VERGELIJKING") && spelerIds && spelerIds.length > 0) {
      const gevondenSpelers = await db.speler.findMany({
        where: { id: { in: spelerIds } },
        select: { id: true },
      });
      const gevondenIds = new Set(gevondenSpelers.map((s: { id: string }) => s.id));
      const ontbrekendeIds = spelerIds.filter((id) => !gevondenIds.has(id));
      if (ontbrekendeIds.length > 0) {
        return fail(
          `Spelers niet gevonden: ${ontbrekendeIds.join(", ")}`,
          404,
          "SPELERS_NOT_FOUND"
        );
      }
    }

    // 5. Valideer scoutIds als meegegeven
    if (scoutIds && scoutIds.length > 0) {
      const gevondenScouts = await db.scout.findMany({
        where: { id: { in: scoutIds } },
        select: { id: true },
      });
      const gevondenScoutIds = new Set(gevondenScouts.map((s: { id: string }) => s.id));
      const ontbrekendeScoutIds = scoutIds.filter((id) => !gevondenScoutIds.has(id));
      if (ontbrekendeScoutIds.length > 0) {
        return fail(
          `Scouts niet gevonden: ${ontbrekendeScoutIds.join(", ")}`,
          404,
          "SCOUTS_NOT_FOUND"
        );
      }
    }

    // 6. Zoek User record voor aangemaakt_door
    const user = await db.user.findUnique({
      where: { email: authResult.scout.email },
      select: { id: true },
    });
    if (!user) {
      return fail("Gebruikersprofiel niet gevonden", 404, "USER_NOT_FOUND");
    }

    // 7. Maak verzoek aan (met optionele toewijzingen)
    const verzoek = await db.scoutingVerzoek.create({
      data: {
        type,
        doel,
        toelichting: toelichting ?? null,
        deadline: deadline ? new Date(deadline) : null,
        anoniem: anoniem ?? false,
        teamId: teamId ?? null,
        spelerIds: spelerIds ?? [],
        seizoen,
        aangemaakt_door: user.id,
        ...(scoutIds && scoutIds.length > 0
          ? {
              toewijzingen: {
                create: scoutIds.map((scoutId) => ({
                  scoutId,
                })),
              },
            }
          : {}),
      },
      include: {
        maker: { select: { naam: true, email: true } },
        toewijzingen: {
          include: { scout: { select: { id: true, naam: true } } },
        },
      },
    });

    logger.info(
      `Verzoek ${verzoek.id} aangemaakt: type=${type}, doel=${doel}, seizoen=${seizoen}, scouts=${scoutIds?.length ?? 0}`
    );

    return ok({
      id: verzoek.id,
      type: verzoek.type,
      doel: verzoek.doel,
      status: verzoek.status,
      toelichting: verzoek.toelichting,
      deadline: verzoek.deadline?.toISOString() ?? null,
      anoniem: verzoek.anoniem,
      teamId: verzoek.teamId,
      spelerIds: verzoek.spelerIds,
      seizoen: verzoek.seizoen,
      maker: verzoek.maker,
      toewijzingen: verzoek.toewijzingen.map(
        (t: {
          id: string;
          scoutId: string;
          scout: { id: string; naam: string };
          status: string;
        }) => ({
          id: t.id,
          scoutId: t.scoutId,
          scoutNaam: t.scout.naam,
          status: t.status,
        })
      ),
      createdAt: verzoek.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("Fout bij aanmaken verzoek:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
