// apps/web/src/app/api/ti-studio/indeling/[versieId]/route.ts
// Mutations voor het werkbord: speler verplaatsen + teamkaart positie opslaan.
// Na elke mutatie: pg_notify zodat alle verbonden SSE-clients het zien.
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody } from "@/lib/api/response";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { z } from "zod";
import { getTeamtypeKaders } from "@/app/(teamindeling-studio)/ti-studio/kader/actions";
import { mergeMetDefaults } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
import {
  berekenTeamValidatie,
  berekenValidatieStatus,
  korfbalLeeftijd,
} from "@/lib/teamindeling/validatie-engine";
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

const DB_KLEUR_MAP: Record<string, string> = {
  BLAUW: "blauw",
  GROEN: "groen",
  GEEL: "geel",
  ORANJE: "oranje",
  ROOD: "rood",
  PAARS: "blauw",
};

async function haalValidatieUpdate(teamId: string): Promise<ValidatieUpdate> {
  const teamData = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      id: true,
      categorie: true,
      kleur: true,
      teamType: true,
      niveau: true,
      versie: {
        select: {
          werkindeling: {
            select: { kaders: { select: { seizoen: true } } },
          },
        },
      },
      spelers: {
        select: {
          speler: {
            select: {
              id: true,
              geslacht: true,
              geboortejaar: true,
              geboortedatum: true,
              roepnaam: true,
              achternaam: true,
            },
          },
        },
      },
    },
  });

  const seizoen = teamData.versie.werkindeling.kaders.seizoen;
  const peiljaar = parseInt(seizoen.split("-")[1], 10);
  const opgeslagenKaders = await getTeamtypeKaders(seizoen);
  const tcKaders = mergeMetDefaults(opgeslagenKaders);

  type TeamSpelerRow = (typeof teamData.spelers)[number];

  const dames = teamData.spelers
    .filter((ts: TeamSpelerRow) => ts.speler.geslacht === "V")
    .map((ts: TeamSpelerRow) => ({
      id: ts.speler.id,
      spelerId: ts.speler.id,
      speler: {
        ...ts.speler,
        geboortedatum: ts.speler.geboortedatum
          ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
          : null,
        geslacht: "V" as const,
        status: "BESCHIKBAAR" as const,
        rating: null,
        notitie: null,
        afmelddatum: null,
        teamId: teamId,
        gepind: false,
        isNieuw: false,
        huidigTeam: null,
        ingedeeldTeamNaam: null,
        selectieGroepId: null,
      },
      notitie: null,
    }));

  const heren = teamData.spelers
    .filter((ts: TeamSpelerRow) => ts.speler.geslacht === "M")
    .map((ts: TeamSpelerRow) => ({
      id: ts.speler.id,
      spelerId: ts.speler.id,
      speler: {
        ...ts.speler,
        geboortedatum: ts.speler.geboortedatum
          ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
          : null,
        geslacht: "M" as const,
        status: "BESCHIKBAAR" as const,
        rating: null,
        notitie: null,
        afmelddatum: null,
        teamId: teamId,
        gepind: false,
        isNieuw: false,
        huidigTeam: null,
        ingedeeldTeamNaam: null,
        selectieGroepId: null,
      },
      notitie: null,
    }));

  const totaalSpelers = teamData.spelers.length;
  const gemLeeftijd =
    totaalSpelers > 0
      ? teamData.spelers.reduce((acc: number, ts: TeamSpelerRow) => {
          const gbd = ts.speler.geboortedatum
            ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
            : null;
          return acc + korfbalLeeftijd(gbd, ts.speler.geboortejaar ?? peiljaar - 15, peiljaar);
        }, 0) / totaalSpelers
      : null;

  const teamVoorValidatie = {
    id: teamId,
    naam: "",
    categorie: String(teamData.categorie),
    kleur: (DB_KLEUR_MAP[teamData.kleur ?? ""] ?? "senior") as
      | "blauw"
      | "groen"
      | "geel"
      | "oranje"
      | "rood"
      | "senior",
    formaat: (teamData.teamType === "VIERTAL" ? "viertal" : "achtal") as
      | "viertal"
      | "achtal"
      | "selectie",
    volgorde: 0,
    canvasX: 0,
    canvasY: 0,
    dames,
    heren,
    staf: [],
    ussScore: null,
    gemiddeldeLeeftijd: gemLeeftijd !== null ? Math.round(gemLeeftijd * 10) / 10 : null,
    validatieStatus: "ok" as const,
    validatieCount: 0,
    teamCategorie: (teamData.categorie ?? "SENIOREN") as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
    niveau: (teamData.niveau ?? null) as "A" | "B" | "U15" | "U17" | "U19" | null,
    selectieGroepId: null,
    selectieNaam: null,
    selectieDames: [],
    selectieHeren: [],
    gebundeld: false,
    werkitems: [],
  };

  const items = berekenTeamValidatie(teamVoorValidatie, tcKaders, peiljaar);
  return {
    teamId,
    items,
    status: berekenValidatieStatus(items),
    count: items.filter((i) => i.type !== "ok").length,
  };
}

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
      validatieUpdates.push(await haalValidatieUpdate(event.naarTeamId as string));
      if (event.vanTeamId) {
        validatieUpdates.push(await haalValidatieUpdate(event.vanTeamId as string));
      }
    } else if (event.type === "speler_naar_pool") {
      validatieUpdates.push(await haalValidatieUpdate(event.vanTeamId as string));
    }

    return ok({ opgeslagen: true, validatieUpdates });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
