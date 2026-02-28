/**
 * Claude tool definities + handlers voor de AI indelingsassistent.
 */

import type Anthropic from "@anthropic-ai/sdk";
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
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  valideerTeam,
  valideerDubbeleSpelersOverTeams,
  type TeamData as ValidatieTeamData,
  type BlauwdrukKaders,
} from "@/lib/validatie/regels";

// ---------------------------------------------------------------------------
// Tool definities (JSON Schema voor Claude)
// ---------------------------------------------------------------------------

export const TOOLS: Anthropic.Tool[] = [
  // === READ-ONLY TOOLS ===
  {
    name: "bekijk_huidige_indeling",
    description: "Toon alle teams met hun spelers, leeftijden, geslacht en stats. Gebruik dit als je wilt weten hoe de indeling er nu uitziet.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "bekijk_spelerspool",
    description: "Toon alle spelers die nog NIET in een team zijn ingedeeld. Inclusief leeftijd, geslacht en huidig team van vorig seizoen.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "bekijk_speler_details",
    description: "Uitgebreide informatie over 1 speler: spelerspad (voorgaande teams), evaluaties, retentierisico, teamgenoten-historie, notities.",
    input_schema: {
      type: "object" as const,
      properties: {
        speler_naam: { type: "string", description: "Naam (of deel van naam) van de speler" },
      },
      required: ["speler_naam"],
    },
  },
  {
    name: "bekijk_voorgaande_indeling",
    description: "Toon de teamindeling van een vorig seizoen. Handig om te zien wie bij welk team speelde.",
    input_schema: {
      type: "object" as const,
      properties: {
        seizoen: { type: "string", description: "Seizoen, bijv. '2024-2025' of '2023-2024'" },
      },
      required: ["seizoen"],
    },
  },
  {
    name: "bekijk_teamsterktes",
    description: "Toon de actuele competitiestanden van alle OW-teams. Laat zien hoe sterk teams presteren (punten, gewonnen, verloren, doelsaldo).",
    input_schema: {
      type: "object" as const,
      properties: {
        seizoen: { type: "string", description: "Seizoen voor standen, default '2025-2026'" },
      },
      required: [],
    },
  },
  {
    name: "bekijk_evaluaties",
    description: "Toon spelerevaluaties (scores en coach-opmerkingen). Kan voor specifieke spelers of voor alle spelers in een team.",
    input_schema: {
      type: "object" as const,
      properties: {
        speler_namen: {
          type: "array",
          items: { type: "string" },
          description: "Namen van spelers om evaluaties voor op te halen",
        },
      },
      required: ["speler_namen"],
    },
  },
  {
    name: "bekijk_blauwdruk_kaders",
    description: "Toon de blauwdruk-kaders: regels per categorie (min/max spelers, leeftijdsgrenzen, genderbalans), speerpunten en toelichting.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "bekijk_pins",
    description: "Toon vastgepinde spelers/staf: harde constraints die gerespecteerd moeten worden.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "bekijk_retentie_overzicht",
    description: "Toon retentierisico per speler, gesorteerd van hoogste risico naar laagste. Laat zien wie mogelijk gaat stoppen.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "bekijk_teamgenoten",
    description: "Toon met wie een speler eerder in een team heeft gespeeld en hoeveel seizoenen samen.",
    input_schema: {
      type: "object" as const,
      properties: {
        speler_naam: { type: "string", description: "Naam van de speler" },
      },
      required: ["speler_naam"],
    },
  },
  {
    name: "valideer_teams",
    description: "Valideer alle teams tegen de blauwdruk-kaders en KNKV-regels. Toont per team een stoplicht (GROEN/ORANJE/ROOD) met meldingen over teamgrootte, leeftijd, genderbalans etc. Gebruik dit na mutaties of om de huidige staat te checken.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },

  // === MUTATIE TOOLS ===
  {
    name: "verplaats_speler",
    description: "Verplaats een speler van het ene team naar het andere team.",
    input_schema: {
      type: "object" as const,
      properties: {
        speler_naam: { type: "string", description: "Naam van de speler" },
        van_team: { type: "string", description: "Naam van het huidige team" },
        naar_team: { type: "string", description: "Naam van het nieuwe team" },
      },
      required: ["speler_naam", "van_team", "naar_team"],
    },
  },
  {
    name: "voeg_speler_toe",
    description: "Voeg een speler uit de pool toe aan een team.",
    input_schema: {
      type: "object" as const,
      properties: {
        speler_naam: { type: "string", description: "Naam van de speler" },
        team_naam: { type: "string", description: "Naam van het team" },
      },
      required: ["speler_naam", "team_naam"],
    },
  },
  {
    name: "verwijder_speler_uit_team",
    description: "Verwijder een speler uit een team (terug naar de pool).",
    input_schema: {
      type: "object" as const,
      properties: {
        speler_naam: { type: "string", description: "Naam van de speler" },
        team_naam: { type: "string", description: "Naam van het team" },
      },
      required: ["speler_naam", "team_naam"],
    },
  },
  {
    name: "wissel_spelers",
    description: "Wissel twee spelers tussen twee teams.",
    input_schema: {
      type: "object" as const,
      properties: {
        speler_a: { type: "string", description: "Naam van speler A" },
        team_a: { type: "string", description: "Team van speler A" },
        speler_b: { type: "string", description: "Naam van speler B" },
        team_b: { type: "string", description: "Team van speler B" },
      },
      required: ["speler_a", "team_a", "speler_b", "team_b"],
    },
  },
  {
    name: "maak_team_aan",
    description: "Maak een nieuw team aan. Vraag de gebruiker om de teamnaam, categorie en kleur als je die niet weet.",
    input_schema: {
      type: "object" as const,
      properties: {
        naam: { type: "string", description: "Naam van het team, bijv. 'Oranje 3' of 'Blauw 1'" },
        categorie: {
          type: "string",
          enum: ["SENIOREN", "A_CATEGORIE", "B_CATEGORIE"],
          description: "Categorie: SENIOREN (18+), A_CATEGORIE (U15/U17/U19), B_CATEGORIE (U7-U13)",
        },
        kleur: {
          type: "string",
          enum: ["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"],
          description: "Kleur/niveau: BLAUW (jongste jeugd), GROEN (oudere jeugd), GEEL (A-categorie), ORANJE (A-cat/senioren), ROOD (senioren). Leidt af uit de teamnaam als mogelijk.",
        },
      },
      required: ["naam", "categorie", "kleur"],
    },
  },
];

// ---------------------------------------------------------------------------
// Helper: zoek speler op naam (fuzzy)
// ---------------------------------------------------------------------------

async function zoekSpeler(naam: string): Promise<{ id: string; roepnaam: string; achternaam: string } | null> {
  const lower = naam.toLowerCase();
  const spelers = await prisma.speler.findMany({
    select: { id: true, roepnaam: true, achternaam: true },
  });

  // Exacte match op volledige naam
  let match = spelers.find(
    (s) => `${s.roepnaam} ${s.achternaam}`.toLowerCase() === lower
  );
  if (match) return match;

  // Bevat-match
  match = spelers.find(
    (s) =>
      `${s.roepnaam} ${s.achternaam}`.toLowerCase().includes(lower) ||
      lower.includes(s.roepnaam.toLowerCase()) ||
      lower.includes(s.achternaam.toLowerCase())
  );
  return match ?? null;
}

async function zoekTeam(versieId: string, naam: string): Promise<{ id: string; naam: string } | null> {
  const lower = naam.toLowerCase();
  const teams = await prisma.team.findMany({
    where: { versieId },
    select: { id: true, naam: true },
  });

  let match = teams.find((t) => t.naam.toLowerCase() === lower);
  if (match) return match;

  match = teams.find((t) => t.naam.toLowerCase().includes(lower) || lower.includes(t.naam.toLowerCase()));
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
  type: "verplaats" | "toevoeg" | "verwijder" | "wissel";
  details: string;
};

export async function handleTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<{ result: string; mutatie?: MutatieEvent }> {
  switch (toolName) {
    // === READ-ONLY ===
    case "bekijk_huidige_indeling": {
      const teams = await getTeamsContext(ctx.versieId);
      return { result: JSON.stringify(teams, null, 2) };
    }

    case "bekijk_spelerspool": {
      const pool = await getSpelersPoolContext(ctx.versieId);
      return { result: JSON.stringify(pool, null, 2) };
    }

    case "bekijk_speler_details": {
      const speler = await zoekSpeler(input.speler_naam as string);
      if (!speler) return { result: `Speler "${input.speler_naam}" niet gevonden.` };
      const details = await getSpelerDetails(speler.id);
      return { result: JSON.stringify(details, null, 2) };
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
      if (sterktes.length === 0) return { result: `Geen standen gevonden voor seizoen ${seizoen}.` };
      return { result: JSON.stringify(sterktes, null, 2) };
    }

    case "bekijk_evaluaties": {
      const namen = input.speler_namen as string[];
      const spelerIds: string[] = [];
      for (const naam of namen) {
        const s = await zoekSpeler(naam);
        if (s) spelerIds.push(s.id);
      }
      if (spelerIds.length === 0) return { result: "Geen van de genoemde spelers gevonden." };
      const evals = await getEvaluaties(spelerIds);
      if (evals.length === 0) return { result: "Geen evaluaties beschikbaar voor deze spelers." };
      return { result: JSON.stringify(evals, null, 2) };
    }

    case "bekijk_blauwdruk_kaders": {
      const kaders = await getBlauwdrukKaders(ctx.scenarioId);
      return { result: JSON.stringify(kaders, null, 2) };
    }

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
      const speler = await zoekSpeler(input.speler_naam as string);
      if (!speler) return { result: `Speler "${input.speler_naam}" niet gevonden.` };
      const teamgenoten = await getTeamgenoten(speler.id);
      if (teamgenoten.length === 0) return { result: `Geen teamgenoten-historie voor ${speler.roepnaam}.` };
      return { result: JSON.stringify(teamgenoten, null, 2) };
    }

    case "valideer_teams": {
      const PEILJAAR = 2026;
      // Haal teams op
      const teams = await prisma.team.findMany({
        where: { versieId: ctx.versieId },
        include: { spelers: { include: { speler: true } } },
        orderBy: { volgorde: "asc" },
      });

      // Haal blauwdruk-kaders op
      const blauwdrukData = await getBlauwdrukKaders(ctx.scenarioId);
      const kaders = (blauwdrukData.kaders ?? {}) as BlauwdrukKaders;

      // Map naar validatie-formaat en valideer
      const validatieTeams: ValidatieTeamData[] = teams.map((t) => ({
        naam: t.naam,
        categorie: t.categorie,
        kleur: t.kleur,
        niveau: t.niveau,
        spelers: t.spelers.map((ts) => ({
          id: ts.speler.id,
          roepnaam: ts.speler.roepnaam,
          achternaam: ts.speler.achternaam,
          geboortejaar: ts.speler.geboortejaar,
          geslacht: ts.speler.geslacht as "M" | "V",
        })),
      }));

      const resultaten = validatieTeams.map((vTeam) => {
        const validatie = valideerTeam(vTeam, PEILJAAR, undefined, kaders);
        return {
          team: vTeam.naam,
          status: validatie.status,
          aantalSpelers: vTeam.spelers.length,
          meldingen: validatie.meldingen.map((m) => ({
            ernst: m.ernst,
            bericht: m.bericht,
          })),
        };
      });

      const dubbeleMeldingen = valideerDubbeleSpelersOverTeams(validatieTeams);

      const totaal = {
        groen: resultaten.filter((r) => r.status === "GROEN").length,
        oranje: resultaten.filter((r) => r.status === "ORANJE").length,
        rood: resultaten.filter((r) => r.status === "ROOD").length,
      };

      return {
        result: JSON.stringify({
          samenvatting: `${totaal.groen} GROEN, ${totaal.oranje} ORANJE, ${totaal.rood} ROOD`,
          teams: resultaten,
          dubbeleSpelers: dubbeleMeldingen.map((m) => m.bericht),
        }, null, 2),
      };
    }

    // === MUTATIES ===
    case "verplaats_speler": {
      const speler = await zoekSpeler(input.speler_naam as string);
      if (!speler) return { result: `Speler "${input.speler_naam}" niet gevonden.` };
      const vanTeam = await zoekTeam(ctx.versieId, input.van_team as string);
      if (!vanTeam) return { result: `Team "${input.van_team}" niet gevonden.` };
      const naarTeam = await zoekTeam(ctx.versieId, input.naar_team as string);
      if (!naarTeam) return { result: `Team "${input.naar_team}" niet gevonden.` };

      await prisma.$transaction([
        prisma.teamSpeler.deleteMany({ where: { teamId: vanTeam.id, spelerId: speler.id } }),
        prisma.teamSpeler.create({ data: { teamId: naarTeam.id, spelerId: speler.id } }),
      ]);
      revalidatePath("/scenarios");

      const msg = `${speler.roepnaam} ${speler.achternaam} verplaatst van ${vanTeam.naam} naar ${naarTeam.naam}.`;
      return { result: msg, mutatie: { type: "verplaats", details: msg } };
    }

    case "voeg_speler_toe": {
      const speler = await zoekSpeler(input.speler_naam as string);
      if (!speler) return { result: `Speler "${input.speler_naam}" niet gevonden.` };
      const team = await zoekTeam(ctx.versieId, input.team_naam as string);
      if (!team) return { result: `Team "${input.team_naam}" niet gevonden.` };

      await prisma.teamSpeler.create({ data: { teamId: team.id, spelerId: speler.id } });
      revalidatePath("/scenarios");

      const msg = `${speler.roepnaam} ${speler.achternaam} toegevoegd aan ${team.naam}.`;
      return { result: msg, mutatie: { type: "toevoeg", details: msg } };
    }

    case "verwijder_speler_uit_team": {
      const speler = await zoekSpeler(input.speler_naam as string);
      if (!speler) return { result: `Speler "${input.speler_naam}" niet gevonden.` };
      const team = await zoekTeam(ctx.versieId, input.team_naam as string);
      if (!team) return { result: `Team "${input.team_naam}" niet gevonden.` };

      await prisma.teamSpeler.deleteMany({ where: { teamId: team.id, spelerId: speler.id } });
      revalidatePath("/scenarios");

      const msg = `${speler.roepnaam} ${speler.achternaam} verwijderd uit ${team.naam}.`;
      return { result: msg, mutatie: { type: "verwijder", details: msg } };
    }

    case "wissel_spelers": {
      const spelerA = await zoekSpeler(input.speler_a as string);
      if (!spelerA) return { result: `Speler "${input.speler_a}" niet gevonden.` };
      const teamA = await zoekTeam(ctx.versieId, input.team_a as string);
      if (!teamA) return { result: `Team "${input.team_a}" niet gevonden.` };
      const spelerB = await zoekSpeler(input.speler_b as string);
      if (!spelerB) return { result: `Speler "${input.speler_b}" niet gevonden.` };
      const teamB = await zoekTeam(ctx.versieId, input.team_b as string);
      if (!teamB) return { result: `Team "${input.team_b}" niet gevonden.` };

      await prisma.$transaction([
        prisma.teamSpeler.deleteMany({ where: { teamId: teamA.id, spelerId: spelerA.id } }),
        prisma.teamSpeler.deleteMany({ where: { teamId: teamB.id, spelerId: spelerB.id } }),
        prisma.teamSpeler.create({ data: { teamId: teamB.id, spelerId: spelerA.id } }),
        prisma.teamSpeler.create({ data: { teamId: teamA.id, spelerId: spelerB.id } }),
      ]);
      revalidatePath("/scenarios");

      const msg = `${spelerA.roepnaam} en ${spelerB.roepnaam} gewisseld (${teamA.naam} ↔ ${teamB.naam}).`;
      return { result: msg, mutatie: { type: "wissel", details: msg } };
    }

    case "maak_team_aan": {
      const naam = input.naam as string;
      const categorie = input.categorie as string;
      const kleur = input.kleur as string;

      // Valideer enum-waarden
      const CATEGORIEN = ["SENIOREN", "A_CATEGORIE", "B_CATEGORIE"];
      const KLEUREN = ["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"];
      if (!CATEGORIEN.includes(categorie)) {
        return { result: `Ongeldige categorie "${categorie}". Kies uit: ${CATEGORIEN.join(", ")}` };
      }
      if (!KLEUREN.includes(kleur)) {
        return { result: `Ongeldige kleur "${kleur}". Kies uit: ${KLEUREN.join(", ")}` };
      }

      // Check of team al bestaat
      const bestaand = await zoekTeam(ctx.versieId, naam);
      if (bestaand) {
        return { result: `Team "${bestaand.naam}" bestaat al in dit scenario.` };
      }

      // Bepaal volgorde (achteraan)
      const aantalTeams = await prisma.team.count({ where: { versieId: ctx.versieId } });

      await prisma.team.create({
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
      return { result: msg, mutatie: { type: "toevoeg", details: msg } };
    }

    default:
      return { result: `Onbekende tool: ${toolName}` };
  }
}
