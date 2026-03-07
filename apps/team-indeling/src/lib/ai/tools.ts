/** Claude tool handlers — definities in ./tool-defs.ts, selectie-helpers in ./selectie-helpers.ts */

import {
  getTeamsContext,
  getSpelersPoolContext,
  getSpelerDetails,
  getVoorgaandeIndeling,
  getTeamsterktes,
  getEvaluaties,
  getBlauwdrukKaders,
  getPins,
  getRetentieOverzicht,
  getTeamgenoten,
} from "./scenario-context";
import {
  getTeamSelectie,
  getAlleIngedeeldIds,
  plaatsSpeler,
  verwijderSpeler,
  verplaatsSpeler,
  batchPlaatsSpelers,
} from "./selectie-helpers";
import { prisma, anyTeam } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  valideerTeam,
  valideerDubbeleSpelersOverTeams,
  type TeamData as ValidatieTeamData,
  type BlauwdrukKaders,
} from "@/lib/validatie/regels";
import { PEILJAAR } from "@oranje-wit/types";

export { TOOLS } from "./tool-defs";

// Helpers: zoek speler/team

async function zoekSpeler(
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

async function zoekTeam(
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

// ---------------------------------------------------------------------------
// Tool handler
// ---------------------------------------------------------------------------

export interface ToolContext {
  scenarioId: string;
  versieId: string;
}

export type MutatieEvent = {
  type: "verplaats" | "toevoeg" | "verwijder" | "wissel" | "batch";
  details: string;
};

export async function handleTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<{ result: string; mutatie?: MutatieEvent }> {
  switch (toolName) {
    // === READ-ONLY ===
    case "bekijk_huidige_indeling":
      return { result: JSON.stringify(await getTeamsContext(ctx.versieId), null, 2) };

    case "bekijk_spelerspool":
      return { result: JSON.stringify(await getSpelersPoolContext(ctx.versieId), null, 2) };

    case "bekijk_speler_details": {
      const speler = await zoekSpeler(
        input.speler_id as string,
        input.speler_naam as string | undefined
      );
      if (!speler)
        return { result: `Speler "${input.speler_id || input.speler_naam}" niet gevonden.` };
      return { result: JSON.stringify(await getSpelerDetails(speler.id), null, 2) };
    }

    case "bekijk_voorgaande_indeling": {
      const seizoen = (input.seizoen as string) || "2024-2025";
      const indeling = await getVoorgaandeIndeling(seizoen);
      if (indeling.length === 0) return { result: `Geen data gevonden voor seizoen ${seizoen}.` };
      return { result: JSON.stringify(indeling, null, 2) };
    }

    case "bekijk_teamsterktes": {
      const seizoen = (input.seizoen as string) || "2025-2026";
      const sterktes = await getTeamsterktes(seizoen);
      if (sterktes.length === 0)
        return { result: `Geen standen gevonden voor seizoen ${seizoen}.` };
      return { result: JSON.stringify(sterktes, null, 2) };
    }

    case "bekijk_evaluaties": {
      const ids = input.speler_ids as string[];
      const spelerIds: string[] = [];
      for (const id of ids) {
        const s = await zoekSpeler(id);
        if (s) spelerIds.push(s.id);
      }
      if (spelerIds.length === 0) return { result: "Geen van de genoemde spelers gevonden." };
      const evals = await getEvaluaties(
        spelerIds,
        input.seizoen as string | undefined,
        input.ronde as number | undefined
      );
      if (evals.length === 0) return { result: "Geen evaluaties beschikbaar voor deze spelers." };
      return { result: JSON.stringify(evals, null, 2) };
    }

    case "bekijk_blauwdruk_kaders":
      return { result: JSON.stringify(await getBlauwdrukKaders(ctx.scenarioId), null, 2) };

    case "bekijk_pins": {
      const pins = await getPins(ctx.scenarioId);
      if (pins.length === 0) return { result: "Er zijn geen pins vastgelegd." };
      return { result: JSON.stringify(pins, null, 2) };
    }

    case "bekijk_retentie_overzicht": {
      const retentie = await getRetentieOverzicht();
      if (retentie.length === 0) return { result: "Geen retentie-data beschikbaar." };
      return { result: JSON.stringify(retentie, null, 2) };
    }

    case "bekijk_teamgenoten": {
      const speler = await zoekSpeler(
        input.speler_id as string,
        input.speler_naam as string | undefined
      );
      if (!speler)
        return { result: `Speler "${input.speler_id || input.speler_naam}" niet gevonden.` };
      const teamgenoten = await getTeamgenoten(speler.id);
      if (teamgenoten.length === 0)
        return { result: `Geen teamgenoten-historie voor ${speler.roepnaam}.` };
      return { result: JSON.stringify(teamgenoten, null, 2) };
    }

    case "valideer_teams":
      return handleValideerTeams(ctx);

    // === MUTATIES ===
    case "verplaats_speler":
      return handleVerplaatsSpeler(input, ctx);
    case "voeg_speler_toe":
      return handleVoegSpelerToe(input, ctx);
    case "verwijder_speler_uit_team":
      return handleVerwijderSpeler(input, ctx);
    case "wissel_spelers":
      return handleWisselSpelers(input, ctx);
    case "maak_team_aan":
      return handleMaakTeamAan(input, ctx);
    case "batch_plaats_spelers":
      return handleBatchPlaats(input, ctx);

    default:
      return { result: `Onbekende tool: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// Mutatie handlers (selectie-aware)
// ---------------------------------------------------------------------------

async function handleVerplaatsSpeler(input: Record<string, unknown>, ctx: ToolContext) {
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

async function handleVoegSpelerToe(input: Record<string, unknown>, ctx: ToolContext) {
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

async function handleVerwijderSpeler(input: Record<string, unknown>, ctx: ToolContext) {
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

async function handleWisselSpelers(input: Record<string, unknown>, ctx: ToolContext) {
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
    // Verwijder beide
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
    // Voeg gewisseld toe
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

async function handleMaakTeamAan(input: Record<string, unknown>, ctx: ToolContext) {
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

async function handleBatchPlaats(input: Record<string, unknown>, ctx: ToolContext) {
  const team = await zoekTeam(ctx.versieId, input.team_naam as string);
  if (!team) return { result: `Team "${input.team_naam}" niet gevonden.` };

  const { selectieGroepId } = await getTeamSelectie(team.id);
  const ingedeeldIds = await getAlleIngedeeldIds(ctx.versieId);

  // Bouw speler-query
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

// ---------------------------------------------------------------------------
// Validatie handler
// ---------------------------------------------------------------------------

async function handleValideerTeams(ctx: ToolContext) {
  const teams = await anyTeam.findMany({
    where: { versieId: ctx.versieId },
    include: { spelers: { include: { speler: true } } },
    orderBy: { volgorde: "asc" },
  });

  // Haal selectie-spelers op
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
