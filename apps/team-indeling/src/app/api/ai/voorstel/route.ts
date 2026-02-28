import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { buildVoorstelPrompt } from "@/lib/ai/prompt";
import { PEILJAAR } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";

const anthropic = new Anthropic(); // leest ANTHROPIC_API_KEY uit env

interface VoorstelRequest {
  scenarioId: string;
  opties?: {
    teamgroottePrio?: string;
    prioriteiten?: string;
  };
}

interface TeamToewijzing {
  teamNaam: string;
  spelerIds: string[];
}

/**
 * POST /api/ai/voorstel — Genereer een AI-startvoorstel voor teamindeling.
 */
export async function POST(request: Request) {
  try {
    const body: VoorstelRequest = await request.json();
    const { scenarioId, opties } = body;

    if (!scenarioId) {
      return NextResponse.json({ error: "scenarioId is verplicht" }, { status: 400 });
    }

    // Haal scenario op met teams
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        versies: {
          include: {
            teams: {
              include: {
                spelers: true,
              },
              orderBy: { volgorde: "asc" },
            },
          },
          orderBy: { nummer: "desc" },
          take: 1,
        },
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: "Scenario niet gevonden" }, { status: 404 });
    }

    const laatsteVersie = scenario.versies[0];
    if (!laatsteVersie) {
      return NextResponse.json({ error: "Scenario heeft geen versie" }, { status: 400 });
    }

    const teams = laatsteVersie.teams;

    // Haal alle spelers op
    const alleSpelers = await prisma.speler.findMany({
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geslacht: true,
        status: true,
        huidig: true,
      },
      orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
    });

    // Bouw de prompt
    const teamInput = teams.map((t) => ({
      naam: t.naam,
      categorie: t.categorie,
      kleur: t.kleur,
    }));

    const spelerInput = alleSpelers.map((s) => {
      const huidig = s.huidig as { team?: string } | null;
      return {
        id: s.id,
        roepnaam: s.roepnaam,
        achternaam: s.achternaam,
        geboortejaar: s.geboortejaar,
        geslacht: s.geslacht,
        status: s.status,
        huidigTeam: huidig?.team ?? null,
      };
    });

    const prompt = buildVoorstelPrompt(teamInput, spelerInput, PEILJAAR, opties);

    // Roep Claude aan
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse het antwoord
    const antwoord = message.content[0];
    if (antwoord.type !== "text") {
      return NextResponse.json({ error: "Onverwacht antwoordtype van Claude" }, { status: 500 });
    }

    let toewijzingen: TeamToewijzing[];
    try {
      // Strip eventuele markdown code blocks
      let jsonText = antwoord.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      toewijzingen = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        {
          error: "Kon het AI-antwoord niet parsen als JSON",
          raw: antwoord.text,
        },
        { status: 500 }
      );
    }

    // Valideer dat het een array is
    if (!Array.isArray(toewijzingen)) {
      return NextResponse.json(
        { error: "AI-antwoord is geen array", raw: antwoord.text },
        { status: 500 }
      );
    }

    // Maak een mapping van teamnaam naar teamId
    const teamNaamNaarId = new Map<string, string>();
    for (const team of teams) {
      teamNaamNaarId.set(team.naam.toLowerCase(), team.id);
    }

    // Verzamel alle spelerIds die al in teams zitten
    const bestaandeSpelers = new Set<string>();
    for (const team of teams) {
      for (const ts of team.spelers) {
        bestaandeSpelers.add(ts.spelerId);
      }
    }

    // Maak TeamSpeler records aan
    const creates: { teamId: string; spelerId: string }[] = [];
    const nietGevondenTeams: string[] = [];

    for (const toewijzing of toewijzingen) {
      const teamId = teamNaamNaarId.get(toewijzing.teamNaam.toLowerCase());
      if (!teamId) {
        nietGevondenTeams.push(toewijzing.teamNaam);
        continue;
      }

      for (const spelerId of toewijzing.spelerIds) {
        // Sla over als speler al in een team zit
        if (bestaandeSpelers.has(spelerId)) continue;
        creates.push({ teamId, spelerId });
        bestaandeSpelers.add(spelerId); // voorkom dubbelen
      }
    }

    // Batch-insert in de database
    if (creates.length > 0) {
      await prisma.teamSpeler.createMany({
        data: creates,
        skipDuplicates: true,
      });
    }

    revalidatePath("/scenarios");

    return NextResponse.json({
      success: true,
      aantalIngedeeld: creates.length,
      nietGevondenTeams,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI voorstel fout:", message);
    return NextResponse.json({ error: `AI-voorstel mislukt: ${message}` }, { status: 500 });
  }
}
