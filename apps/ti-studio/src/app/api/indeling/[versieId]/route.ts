// apps/ti-studio/src/app/api/indeling/[versieId]/route.ts
// Mutations voor het werkbord: speler verplaatsen + teamkaart positie opslaan.
// Na elke mutatie: pg_notify zodat alle verbonden SSE-clients het zien.
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody } from "@oranje-wit/types";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { z } from "zod";
import { haalValidatieUpdate } from "@/lib/teamindeling/validatie-update";
import type { ValidatieUpdate } from "@/components/werkbord/types";
import { logWerkbordMutatie } from "@/lib/teamindeling/audit/log-werkbord-mutatie";
import { huidigeUserId } from "@/lib/teamindeling/audit/huidige-user";
import {
  bepaalHuidigeLocatie,
  vergelijkLocatie,
  laatsteMutatieVoor,
} from "@/lib/teamindeling/audit/huidige-locatie";

const SpelerLocatieSchema = z.discriminatedUnion("soort", [
  z.object({ soort: z.literal("pool") }),
  z.object({ soort: z.literal("team"), teamId: z.string() }),
  z.object({ soort: z.literal("selectie"), selectieGroepId: z.string() }),
]);

const SpelerVerplaatst = z.object({
  type: z.literal("speler_verplaatst"),
  spelerId: z.string(),
  vanTeamId: z.string().nullable(),
  naarTeamId: z.string(),
  naarGeslacht: z.enum(["V", "M"]),
  sessionId: z.string(),
  verwachteLocatie: SpelerLocatieSchema.optional(),
});

const SpelerNaarPool = z.object({
  type: z.literal("speler_naar_pool"),
  spelerId: z.string(),
  vanTeamId: z.string(),
  sessionId: z.string(),
  verwachteLocatie: SpelerLocatieSchema.optional(),
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

  // Compare-and-swap: alleen voor speler-verplaatsing (niet voor team_positie)
  if (
    (event.type === "speler_verplaatst" || event.type === "speler_naar_pool") &&
    event.verwachteLocatie
  ) {
    const werkelijk = await bepaalHuidigeLocatie(versieId, event.spelerId);
    if (!vergelijkLocatie(event.verwachteLocatie, werkelijk)) {
      const laatste = await laatsteMutatieVoor(versieId, event.spelerId);
      return new Response(
        JSON.stringify({
          ok: false,
          conflict: {
            verwacht: event.verwachteLocatie,
            werkelijk,
            doorWie: laatste,
          },
        }),
        { status: 409, headers: { "content-type": "application/json" } }
      );
    }
  }

  const doorId = await huidigeUserId();

  try {
    if (event.type === "speler_verplaatst") {
      // Verwijder uit alle teams én selectiegroepen in deze versie (voorkomt duplicaten)
      await prisma.$transaction([
        prisma.teamSpeler.deleteMany({
          where: { spelerId: event.spelerId, team: { versieId } },
        }),
        prisma.selectieSpeler.deleteMany({
          where: { spelerId: event.spelerId, selectieGroep: { versieId } },
        }),
      ]);
      await prisma.teamSpeler.upsert({
        where: {
          teamId_spelerId: { teamId: event.naarTeamId, spelerId: event.spelerId },
        },
        create: { teamId: event.naarTeamId, spelerId: event.spelerId },
        update: {},
      });
      await logWerkbordMutatie({
        versieId,
        type: "speler_verplaatst",
        doorId: doorId,
        spelerId: event.spelerId,
        vanTeamId: event.vanTeamId,
        naarTeamId: event.naarTeamId,
        sessionId: event.sessionId,
        payload: { ...event },
        inverse: event.vanTeamId
          ? { type: "speler_verplaatst", spelerId: event.spelerId, naarTeamId: event.vanTeamId }
          : { type: "speler_naar_pool", spelerId: event.spelerId, vanTeamId: event.naarTeamId },
      });
    } else if (event.type === "speler_naar_pool") {
      // Verwijder uit alle teams én selectiegroepen in deze versie
      await prisma.$transaction([
        prisma.teamSpeler.deleteMany({
          where: { spelerId: event.spelerId, team: { versieId } },
        }),
        prisma.selectieSpeler.deleteMany({
          where: { spelerId: event.spelerId, selectieGroep: { versieId } },
        }),
      ]);
      await logWerkbordMutatie({
        versieId,
        type: "speler_naar_pool",
        doorId: doorId,
        spelerId: event.spelerId,
        vanTeamId: event.vanTeamId,
        sessionId: event.sessionId,
        payload: { ...event },
        inverse: {
          type: "speler_verplaatst",
          spelerId: event.spelerId,
          naarTeamId: event.vanTeamId,
        },
      });
    } else if (event.type === "team_positie") {
      const versie = await prisma.versie.findUniqueOrThrow({
        where: { id: versieId },
        select: { posities: true },
      });
      const posities = (versie.posities as Record<string, { x: number; y: number }>) ?? {};
      const oudePositie = posities[event.teamId] ?? null;
      posities[event.teamId] = { x: Math.round(event.x), y: Math.round(event.y) };
      await prisma.versie.update({ where: { id: versieId }, data: { posities } });
      await logWerkbordMutatie({
        versieId,
        type: "team_positie",
        doorId: doorId,
        sessionId: event.sessionId,
        payload: { ...event },
        inverse: oudePositie
          ? { type: "team_positie", teamId: event.teamId, ...oudePositie }
          : null,
      });
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
