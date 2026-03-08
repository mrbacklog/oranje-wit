/** Mutation + validatie handlers — geëxtraheerd uit tools.ts voor max-lines compliance */

import {
  getTeamSelectie,
  getAlleIngedeeldIds,
  plaatsSpeler,
  verwijderSpeler,
  verplaatsSpeler,
  batchPlaatsSpelers,
} from "./selectie-helpers";
import { getBlauwdrukKaders } from "./scenario-context";
import { prisma, anyTeam } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  valideerTeam,
  valideerDubbeleSpelersOverTeams,
  type TeamData as ValidatieTeamData,
  type BlauwdrukKaders,
} from "@/lib/validatie/regels";
import { PEILJAAR } from "@oranje-wit/types";
import type { ToolContext, MutatieEvent } from "./tools";

type HandlerResult = { result: string; mutatie?: MutatieEvent };

// Helpers: zoek speler/team

export async function zoekSpeler(
  id?: string,
  naam?: string
): Promise<{ id: string; roepnaam: string; achternaam: string } | null> {
  if (id) {
    const speler = await prisma.speler.findUnique({
      where: { id },
      select: { id: true, roepnaam: true, achternaam: true },
    });
    if (speler) return speler;
  }
  if (naam) {
    const lower = naam.toLowerCase();
    const spelers = await prisma.speler.findMany({
      select: { id: true, roepnaam: true, achternaam: true },
    });
    let match = spelers.find((s) => `${s.roepnaam} ${s.achternaam}`.toLowerCase() === lower);
    if (match) return match;
    match = spelers.find(
      (s) =>
        `${s.roepnaam} ${s.achternaam}`.toLowerCase().includes(lower) ||
        lower.includes(s.roepnaam.toLowerCase()) ||
        lower.includes(s.achternaam.toLowerCase())
    );
    return match ?? null;
  }
  return null;
}

export async function zoekTeam(
  versieId: string,
  naam: string
): Promise<{ id: string; naam: string } | null> {
  const lower = naam.toLowerCase();
  const teams = await anyTeam.findMany({ where: { versieId }, select: { id: true, naam: true } });
  let match = teams.find((t) => t.naam.toLowerCase() === lower);
  if (match) return match;
  match = teams.find(
    (t) => t.naam.toLowerCase().includes(lower) || lower.includes(t.naam.toLowerCase())
  );
  return match ?? null;
}

// Mutatie handlers

export async function handleVerplaatsSpeler(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<HandlerResult> {
  const speler = await zoekSpeler(
    input.speler_id as string,
    input.speler_naam as string | undefined
  );
  if (!speler) return { result: `Speler "${input.speler_id || input.speler_naam}" niet gevonden.` };
  const vanTeam = await zoekTeam(ctx.versieId, input.van_team as string);
  if (!vanTeam) return { result: `Team "${input.van_team}" niet gevonden.` };
  const naarTeam = await zoekTeam(ctx.versieId, input.naar_team as string);
  if (!naarTeam) return { result: `Team "${input.naar_team}" niet gevonden.` };

  const [vanData, naarData] = await Promise.all([
    getTeamSelectie(vanTeam.id),
    getTeamSelectie(naarTeam.id),
  ]);

  await verplaatsSpeler(
    vanTeam.id,
    naarTeam.id,
    speler.id,
    vanData.selectieGroepId,
    naarData.selectieGroepId
  );
  revalidatePath("/scenarios");

  const msg = `${speler.roepnaam} ${speler.achternaam} verplaatst van ${vanTeam.naam} naar ${naarTeam.naam}.`;
  return { result: msg, mutatie: { type: "verplaats" as const, details: msg } };
}

export async function handleVoegSpelerToe(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<HandlerResult> {
  const speler = await zoekSpeler(
    input.speler_id as string,
    input.speler_naam as string | undefined
  );
  if (!speler) return { result: `Speler "${input.speler_id || input.speler_naam}" niet gevonden.` };
  const team = await zoekTeam(ctx.versieId, input.team_naam as string);
  if (!team) return { result: `Team "${input.team_naam}" niet gevonden.` };

  const { selectieGroepId } = await getTeamSelectie(team.id);
  await plaatsSpeler(team.id, speler.id, selectieGroepId);
  revalidatePath("/scenarios");

  const msg = `${speler.roepnaam} ${speler.achternaam} toegevoegd aan ${team.naam}.`;
  return { result: msg, mutatie: { type: "toevoeg" as const, details: msg } };
}

export async function handleVerwijderSpeler(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<HandlerResult> {
  const speler = await zoekSpeler(
    input.speler_id as string,
    input.speler_naam as string | undefined
  );
  if (!speler) return { result: `Speler "${input.speler_id || input.speler_naam}" niet gevonden.` };
  const team = await zoekTeam(ctx.versieId, input.team_naam as string);
  if (!team) return { result: `Team "${input.team_naam}" niet gevonden.` };

  const { selectieGroepId } = await getTeamSelectie(team.id);
  await verwijderSpeler(team.id, speler.id, selectieGroepId);
  revalidatePath("/scenarios");

  const msg = `${speler.roepnaam} ${speler.achternaam} verwijderd uit ${team.naam}.`;
  return { result: msg, mutatie: { type: "verwijder" as const, details: msg } };
}

export async function handleWisselSpelers(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<HandlerResult> {
  const spelerA = await zoekSpeler(
    input.speler_a_id as string | undefined,
    input.speler_a_naam as string | undefined
  );
  if (!spelerA)
    return { result: `Speler A "${input.speler_a_id || input.speler_a_naam}" niet gevonden.` };
  const teamA = await zoekTeam(ctx.versieId, input.team_a as string);
  if (!teamA) return { result: `Team "${input.team_a}" niet gevonden.` };
  const spelerB = await zoekSpeler(
    input.speler_b_id as string | undefined,
    input.speler_b_naam as string | undefined
  );
  if (!spelerB)
    return { result: `Speler B "${input.speler_b_id || input.speler_b_naam}" niet gevonden.` };
  const teamB = await zoekTeam(ctx.versieId, input.team_b as string);
  if (!teamB) return { result: `Team "${input.team_b}" niet gevonden.` };

  const [dataA, dataB] = await Promise.all([getTeamSelectie(teamA.id), getTeamSelectie(teamB.id)]);

  await prisma.$transaction(async (tx: any) => {
    if (dataA.selectieGroepId) {
      await tx.selectieSpeler.deleteMany({
        where: { selectieGroepId: dataA.selectieGroepId, spelerId: spelerA.id },
      });
    } else {
      await tx.teamSpeler.deleteMany({ where: { teamId: teamA.id, spelerId: spelerA.id } });
    }
    if (dataB.selectieGroepId) {
      await tx.selectieSpeler.deleteMany({
        where: { selectieGroepId: dataB.selectieGroepId, spelerId: spelerB.id },
      });
    } else {
      await tx.teamSpeler.deleteMany({ where: { teamId: teamB.id, spelerId: spelerB.id } });
    }
    if (dataB.selectieGroepId) {
      await tx.selectieSpeler.create({
        data: { selectieGroepId: dataB.selectieGroepId, spelerId: spelerA.id },
      });
    } else {
      await tx.teamSpeler.create({ data: { teamId: teamB.id, spelerId: spelerA.id } });
    }
    if (dataA.selectieGroepId) {
      await tx.selectieSpeler.create({
        data: { selectieGroepId: dataA.selectieGroepId, spelerId: spelerB.id },
      });
    } else {
      await tx.teamSpeler.create({ data: { teamId: teamA.id, spelerId: spelerB.id } });
    }
  });
  revalidatePath("/scenarios");

  const msg = `${spelerA.roepnaam} en ${spelerB.roepnaam} gewisseld (${teamA.naam} \u2194 ${teamB.naam}).`;
  return { result: msg, mutatie: { type: "wissel" as const, details: msg } };
}

export async function handleMaakTeamAan(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<HandlerResult> {
  const naam = input.naam as string;
  const categorie = input.categorie as string;
  const kleur = input.kleur as string;

  const CATEGORIEN = ["SENIOREN", "A_CATEGORIE", "B_CATEGORIE"];
  const KLEUREN = ["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"];
  if (!CATEGORIEN.includes(categorie))
    return { result: `Ongeldige categorie "${categorie}". Kies uit: ${CATEGORIEN.join(", ")}` };
  if (!KLEUREN.includes(kleur))
    return { result: `Ongeldige kleur "${kleur}". Kies uit: ${KLEUREN.join(", ")}` };

  const bestaand = await zoekTeam(ctx.versieId, naam);
  if (bestaand) return { result: `Team "${bestaand.naam}" bestaat al in dit scenario.` };

  const aantalTeams = await anyTeam.count({ where: { versieId: ctx.versieId } });
  await anyTeam.create({
    data: {
      versieId: ctx.versieId,
      naam,
      categorie: categorie as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
      kleur: kleur as "BLAUW" | "GROEN" | "GEEL" | "ORANJE" | "ROOD",
      volgorde: aantalTeams,
    },
  });
  revalidatePath("/scenarios");

  const msg = `Team "${naam}" aangemaakt (${categorie}, ${kleur}).`;
  return { result: msg, mutatie: { type: "toevoeg" as const, details: msg } };
}

export async function handleBatchPlaats(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<HandlerResult> {
  const team = await zoekTeam(ctx.versieId, input.team_naam as string);
  if (!team) return { result: `Team "${input.team_naam}" niet gevonden.` };

  const { selectieGroepId } = await getTeamSelectie(team.id);
  const ingedeeldIds = await getAlleIngedeeldIds(ctx.versieId);

  const where: Record<string, unknown> = { status: { not: "GAAT_STOPPEN" } };
  if (input.geslacht) where.geslacht = input.geslacht;
  if (input.geboortejaar_van || input.geboortejaar_tot) {
    where.geboortejaar = {
      ...(input.geboortejaar_van ? { gte: input.geboortejaar_van as number } : {}),
      ...(input.geboortejaar_tot ? { lte: input.geboortejaar_tot as number } : {}),
    };
  }
  if (input.speler_ids) where.id = { in: input.speler_ids as string[] };

  const spelers = await prisma.speler.findMany({
    where,
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geslacht: true,
      huidig: true,
    },
    orderBy: [{ geboortejaar: "asc" }, { achternaam: "asc" }],
  });

  type SpelerRij = {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    geslacht: string;
    huidig: { team?: string; kleur?: string } | null;
  };
  let gefilterd = spelers as SpelerRij[];
  if (input.huidig_team) {
    const zoek = (input.huidig_team as string).toLowerCase();
    gefilterd = gefilterd.filter((s) => s.huidig?.team?.toLowerCase().includes(zoek));
  }
  if (input.huidig_kleur) {
    const zoek = (input.huidig_kleur as string).toUpperCase();
    gefilterd = gefilterd.filter((s) => s.huidig?.kleur?.toUpperCase() === zoek);
  }

  const tePlaatsen = gefilterd.filter((s) => !ingedeeldIds.has(s.id));
  if (tePlaatsen.length === 0)
    return {
      result: "Geen spelers gevonden die aan de filters voldoen en nog niet ingedeeld zijn.",
    };

  await batchPlaatsSpelers(
    team.id,
    tePlaatsen.map((s) => s.id),
    selectieGroepId
  );
  revalidatePath("/scenarios");

  const namen = tePlaatsen.map(
    (s) => `${s.roepnaam} ${s.achternaam} (${s.geslacht}, ${s.geboortejaar})`
  );
  const msg = `${tePlaatsen.length} spelers geplaatst in ${team.naam}:\n${namen.join("\n")}`;
  return { result: msg, mutatie: { type: "batch" as const, details: msg } };
}

export async function handleValideerTeams(ctx: ToolContext): Promise<HandlerResult> {
  const teams = await anyTeam.findMany({
    where: { versieId: ctx.versieId },
    include: { spelers: { include: { speler: true } } },
    orderBy: { volgorde: "asc" },
  });

  const selectieGroepen = await prisma.selectieGroep.findMany({
    where: { versieId: ctx.versieId },
    include: { spelers: { include: { speler: true } }, teams: { select: { id: true } } },
  });
  const selectieSpelerMap = new Map<string, any[]>();
  for (const sg of selectieGroepen) {
    for (const t of sg.teams) selectieSpelerMap.set(t.id, sg.spelers);
  }

  const blauwdrukData = await getBlauwdrukKaders(ctx.scenarioId);
  const kaders = (blauwdrukData.kaders ?? {}) as BlauwdrukKaders;

  const validatieTeams: ValidatieTeamData[] = teams.map((t) => {
    const spelerData = selectieSpelerMap.get(t.id) ?? t.spelers;
    return {
      naam: t.naam,
      categorie: t.categorie,
      kleur: t.kleur,
      niveau: t.niveau,
      spelers: spelerData.map((ts: any) => ({
        id: ts.speler.id,
        roepnaam: ts.speler.roepnaam,
        achternaam: ts.speler.achternaam,
        geboortejaar: ts.speler.geboortejaar,
        geslacht: ts.speler.geslacht as "M" | "V",
      })),
    };
  });

  const resultaten = validatieTeams.map((vTeam) => {
    const validatie = valideerTeam(vTeam, PEILJAAR, undefined, kaders);
    return {
      team: vTeam.naam,
      status: validatie.status,
      aantalSpelers: vTeam.spelers.length,
      meldingen: validatie.meldingen.map((m) => ({ ernst: m.ernst, bericht: m.bericht })),
    };
  });

  const dubbeleMeldingen = valideerDubbeleSpelersOverTeams(validatieTeams);
  const totaal = {
    groen: resultaten.filter((r) => r.status === "GROEN").length,
    oranje: resultaten.filter((r) => r.status === "ORANJE").length,
    rood: resultaten.filter((r) => r.status === "ROOD").length,
  };

  return {
    result: JSON.stringify(
      {
        samenvatting: `${totaal.groen} GROEN, ${totaal.oranje} ORANJE, ${totaal.rood} ROOD`,
        teams: resultaten,
        dubbeleSpelers: dubbeleMeldingen.map((m) => m.bericht),
      },
      null,
      2
    ),
  };
}
