"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";
import type { GezienStatus } from "@oranje-wit/database";

/**
 * Indelingsdoel: team (zonder combinatie-pool) of selectie (mét combinatie-pool).
 * `id` is de primary key (team.id of selectieGroep.id), `type` bepaalt naar welke
 * tabel de koppeling gaat (TeamSpeler vs SelectieSpeler).
 */
export type IndelingsDoel = {
  id: string;
  naam: string;
  kleur: string | null;
  type: "team" | "selectie";
};

/**
 * Context nodig voor inline-bewerkingen op de spelers-pagina:
 * - kadersId: voor status/gezien mutaties
 * - versieId: voor indeling mutaties
 * - doelen: dropdown-opties voor indeling. Bevat ALLEEN teams zonder gebundelde selectie
 *           plus selecties mét gebundelde pool. Nooit beide voor hetzelfde team — dat
 *           voorkomt dat spelers in een "onzichtbare" team-pool verdwijnen.
 */
export async function getSpelersPaginaContext(): Promise<{
  kadersId: string | null;
  versieId: string | null;
  doelen: IndelingsDoel[];
}> {
  await requireTC();

  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });
  if (!kaders) return { kadersId: null, versieId: null, doelen: [] };

  const werkindeling = await prisma.werkindeling.findFirst({
    where: { kadersId: kaders.id, status: "ACTIEF" },
    select: {
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: {
          id: true,
          teams: {
            select: {
              id: true,
              naam: true,
              kleur: true,
              volgorde: true,
              selectieGroepId: true,
            },
            orderBy: { volgorde: "asc" },
          },
          selectieGroepen: {
            select: {
              id: true,
              naam: true,
              gebundeld: true,
              teams: {
                select: { id: true, naam: true, kleur: true, volgorde: true },
                orderBy: { volgorde: "asc" },
              },
            },
          },
        },
      },
    },
  });
  type VersieTeamRow = {
    id: string;
    naam: string;
    kleur: string | null;
    volgorde: number | null;
    selectieGroepId: string | null;
  };
  type VersieSelGroepRow = {
    id: string;
    naam: string | null;
    gebundeld: boolean;
    teams: { id: string; naam: string; kleur: string | null; volgorde: number | null }[];
  };
  const versie = werkindeling?.versies?.[0] as
    | { id: string; teams: VersieTeamRow[]; selectieGroepen: VersieSelGroepRow[] }
    | undefined;
  if (!versie) return { kadersId: kaders.id, versieId: null, doelen: [] };

  const gebundeldeGroepIds = new Set(
    versie.selectieGroepen
      .filter((sg: VersieSelGroepRow) => sg.gebundeld)
      .map((sg: VersieSelGroepRow) => sg.id)
  );

  const teamDoelen: IndelingsDoel[] = versie.teams
    .filter((t: VersieTeamRow) => !t.selectieGroepId || !gebundeldeGroepIds.has(t.selectieGroepId))
    .map((t: VersieTeamRow) => ({
      id: t.id,
      naam: t.naam,
      kleur: t.kleur ?? null,
      type: "team" as const,
    }));

  const selectieDoelen: IndelingsDoel[] = versie.selectieGroepen
    .filter((sg: VersieSelGroepRow) => sg.gebundeld && sg.teams.length > 0)
    .map((sg: VersieSelGroepRow) => ({
      id: sg.id,
      naam: sg.naam ?? sg.teams.map((t: { naam: string }) => t.naam).join(" + "),
      // Gebruik kleur van eerste team in de selectie als indicator
      kleur: sg.teams[0]?.kleur ?? null,
      type: "selectie" as const,
    }));

  return {
    kadersId: kaders.id,
    versieId: versie.id,
    doelen: [...teamDoelen, ...selectieDoelen],
  };
}

export async function setGezienStatus(
  kadersId: string,
  spelerId: string,
  status: GezienStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    await prisma.kadersSpeler.upsert({
      where: { kadersId_spelerId: { kadersId, spelerId } },
      create: { kadersId, spelerId, gezienStatus: status },
      update: { gezienStatus: status },
    });
    revalidatePath("/personen/spelers");
    return { ok: true };
  } catch (err) {
    logger.warn("setGezienStatus mislukt:", err);
    return { ok: false, error: "Kon gezien-status niet bijwerken" };
  }
}

/**
 * Verplaatst een speler binnen de werkindeling-versie naar een team OF een gebundelde selectie.
 * - doel = null        → speler uit alle teams én alle selecties van versie verwijderen
 * - doel.type="team"    → speler uit álles verwijderen en aan team koppelen
 * - doel.type="selectie" → speler uit álles verwijderen en aan SelectieGroep (gebundelde pool) koppelen
 *
 * Cruciaal: een speler kan NIET tegelijk in een TeamSpeler én een SelectieSpeler record zitten
 * voor dezelfde versie. Deze action forceert die invariant.
 */
export async function zetSpelerIndeling(
  versieId: string,
  spelerId: string,
  doel: { id: string; type: "team" | "selectie" } | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    // Haal alle teams en selectieGroepen van de versie op voor validatie + cleanup.
    type TeamRow = { id: string };
    type SelGroepRow = { id: string; gebundeld: boolean };
    const versie = (await prisma.versie.findUniqueOrThrow({
      where: { id: versieId },
      select: {
        teams: { select: { id: true } },
        selectieGroepen: { select: { id: true, gebundeld: true } },
      },
    })) as { teams: TeamRow[]; selectieGroepen: SelGroepRow[] };
    const teamIds = versie.teams.map((t: TeamRow) => t.id);
    const selectieGroepIds = versie.selectieGroepen.map((sg: SelGroepRow) => sg.id);

    if (doel) {
      if (doel.type === "team" && !teamIds.includes(doel.id)) {
        return { ok: false, error: "Team hoort niet bij deze versie" };
      }
      if (doel.type === "selectie") {
        const sg = versie.selectieGroepen.find((s: SelGroepRow) => s.id === doel.id);
        if (!sg) return { ok: false, error: "Selectie hoort niet bij deze versie" };
        if (!sg.gebundeld) {
          return {
            ok: false,
            error: "Selectie heeft geen gecombineerde pool — kies een specifiek team",
          };
        }
      }
    }

    // Atomair: verwijder álle bestaande koppelingen (team én selectie) + maak eventueel nieuwe.
    await prisma.$transaction([
      prisma.teamSpeler.deleteMany({
        where: { spelerId, teamId: { in: teamIds } },
      }),
      prisma.selectieSpeler.deleteMany({
        where: { spelerId, selectieGroepId: { in: selectieGroepIds } },
      }),
      ...(doel?.type === "team"
        ? [prisma.teamSpeler.create({ data: { spelerId, teamId: doel.id } })]
        : []),
      ...(doel?.type === "selectie"
        ? [prisma.selectieSpeler.create({ data: { spelerId, selectieGroepId: doel.id } })]
        : []),
    ]);

    revalidatePath("/personen/spelers");
    revalidatePath("/indeling");
    return { ok: true };
  } catch (err) {
    logger.warn("zetSpelerIndeling mislukt:", err);
    return { ok: false, error: "Kon indeling niet bijwerken" };
  }
}
