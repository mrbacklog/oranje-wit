/** Claude tool handlers — definities in ./tool-defs.ts, handlers in ./tool-handlers.ts */

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
  zoekSpeler,
  handleVerplaatsSpeler,
  handleVoegSpelerToe,
  handleVerwijderSpeler,
  handleWisselSpelers,
  handleMaakTeamAan,
  handleBatchPlaats,
  handleValideerTeams,
} from "./tool-handlers";

export { TOOLS } from "./tool-defs";

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
