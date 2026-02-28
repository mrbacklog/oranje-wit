import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface AdviesRequest {
  actie: string;
  scenarioState: {
    teams: {
      naam: string;
      spelers: string[];
    }[];
  };
}

/**
 * POST /api/ai/advies — Korte Claude-feedback op een actie in de teamindeling.
 */
export async function POST(request: Request) {
  try {
    const body: AdviesRequest = await request.json();
    const { actie, scenarioState } = body;

    if (!actie || !scenarioState) {
      return NextResponse.json({ error: "actie en scenarioState zijn verplicht" }, { status: 400 });
    }

    const teamOverzicht = scenarioState.teams
      .map((t) => `- ${t.naam}: ${t.spelers.length} spelers (${t.spelers.join(", ")})`)
      .join("\n");

    const prompt = `Je bent een korfbal-expert voor c.k.v. Oranje Wit. Je geeft kort advies over teamindelingen.

Huidige teamindeling:
${teamOverzicht}

De gebruiker heeft net de volgende actie uitgevoerd:
"${actie}"

Geef in 1-3 zinnen kort feedback over deze actie. Focus op:
- Klopt de genderbalans nog?
- Past de leeftijdsspreiding?
- Zijn er aandachtspunten?

Wees beknopt en concreet. Antwoord in het Nederlands.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const antwoord = message.content[0];
    if (antwoord.type !== "text") {
      return NextResponse.json({ error: "Onverwacht antwoordtype" }, { status: 500 });
    }

    return NextResponse.json({ advies: antwoord.text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("AI advies fout:", msg);
    return NextResponse.json({ error: `Advies mislukt: ${msg}` }, { status: 500 });
  }
}
