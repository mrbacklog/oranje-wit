// apps/web/src/app/api/ti-studio/indeling/[versieId]/route.ts
// Mutations voor het werkbord: speler verplaatsen + teamkaart positie opslaan.
// Na elke mutatie: pg_notify zodat alle verbonden SSE-clients het zien.
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody } from "@/lib/api/response";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { z } from "zod";
import { haalValidatieUpdate } from "@/lib/teamindeling/validatie-update";
import type { ValidatieUpdate } from "@/components/ti-studio/werkbord/types";

const SpelerVerplaatst = z.object({
  type: z.literal("speler_verplaatst"),
  spelerId: z.string(),
  vanTeamId: z.string().nullable(),
  naarTeamId: z.string(),
  naarGeslacht: z.enum(["V", "M"]),
  sessionId: z.string(),
});

const SpelerNaarPool = z.object({
  type: z.literal("speler_naar_pool"),
  spelerId: z.string(),
  vanTeamId: z.string(),
  sessionId: z.string(),
});

const TeamPositie = z.object({
  type: z.literal("team_positie"),
  teamId: z.string(),
  x: z.number(),
  y: z.number(),
  sessionId: z.string(),
});

const BodySchema = z.discriminatedUnion("type", [SpelerVerplaatst, SpelerNaarPool, TeamPositie]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ versieId: string }> }
) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

  const { versieId } = await params;
  const kanaal = `ti_studio_${versieId}`.slice(0, 63);

  const parsed = await parseBody(request, BodySchema);
  if (!parsed.ok) return parsed.response;

  const event = parsed.data;

  try {
    if (event.type === "speler_verplaatst") {
      if (event.vanTeamId) {
        await prisma.teamSpeler.deleteMany({
          where: { teamId: event.vanTeamId, spelerId: event.spelerId },
        });
      }
      await prisma.teamSpeler.upsert({
        where: {
          teamId_spelerId: { teamId: event.naarTeamId, spelerId: event.spelerId },
        },
        create: { teamId: event.naarTeamId, spelerId: event.spelerId },
        update: {},
      });
    } else if (event.type === "speler_naar_pool") {
      await prisma.teamSpeler.deleteMany({
        where: { teamId: event.vanTeamId, spelerId: event.spelerId },
      });
    } else if (event.type === "team_positie") {
      const versie = await prisma.versie.findUniqueOrThrow({
        where: { id: versieId },
        select: { posities: true },
      });
      const posities = (versie.posities as Record<string, { x: number; y: number }>) ?? {};
      posities[event.teamId] = { x: Math.round(event.x), y: Math.round(event.y) };
      await prisma.versie.update({ where: { id: versieId }, data: { posities } });
    }

    const payload = JSON.stringify({
      ...event,
      door: auth.session.user?.email ?? "onbekend",
    });
    await prisma.$executeRaw`SELECT pg_notify(${kanaal}, ${payload})`;

    // Validatie herberekenen voor betrokken teams
    const validatieUpdates: ValidatieUpdate[] = [];
    if (event.type === "speler_verplaatst") {
      const updates = await Promise.all([
        haalValidatieUpdate(event.naarTeamId),
        ...(event.vanTeamId ? [haalValidatieUpdate(event.vanTeamId)] : []),
      ]);
      validatieUpdates.push(...updates);
    } else if (event.type === "speler_naar_pool") {
      if (event.vanTeamId) {
        validatieUpdates.push(await haalValidatieUpdate(event.vanTeamId));
      }
    }

    return ok({ opgeslagen: true, validatieUpdates });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
