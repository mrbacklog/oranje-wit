import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface WhatIfTeam {
  naam: string;
  categorie: string;
  spelers: {
    naam: string;
    geboortejaar: number;
    geslacht: string;
  }[];
}

interface WhatIfRequest {
  vraag: string;
  teams: WhatIfTeam[];
}

/**
 * POST /api/ai/whatif — What-if analyse over teamindelingen.
 */
export async function POST(request: Request) {
  try {
    const body: WhatIfRequest = await request.json();
    const { vraag, teams } = body;

    if (!vraag || !teams) {
      return NextResponse.json({ error: "vraag en teams zijn verplicht" }, { status: 400 });
    }

    const teamOverzicht = teams
      .map((t) => {
        const spelerLijst = t.spelers
          .map(
            (s) =>
              `    - ${s.naam} (${s.geboortejaar}, ${s.geslacht === "M" ? "jongen" : "meisje"})`
          )
          .join("\n");
        return `- ${t.naam} (${t.categorie}):\n${spelerLijst}`;
      })
      .join("\n\n");

    const prompt = `Je bent een korfbal-expert voor c.k.v. Oranje Wit. Analyseer de impact van een hypothetische wijziging.

## Huidige teamindeling

${teamOverzicht}

## Vraag / What-if scenario

"${vraag}"

## Opdracht

Analyseer de impact van dit scenario op alle teams. Antwoord in JSON-formaat:

{
  "analyse": "Een korte analyse van de impact (2-4 zinnen, Nederlands)",
  "getrofenTeams": ["Team1", "Team2"],
  "suggesties": ["Suggestie 1", "Suggestie 2"]
}

Geef ALLEEN de JSON terug, geen andere tekst.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const antwoord = message.content[0];
    if (antwoord.type !== "text") {
      return NextResponse.json({ error: "Onverwacht antwoordtype" }, { status: 500 });
    }

    let result: { analyse: string; getrofenTeams: string[]; suggesties: string[] };
    try {
      let jsonText = antwoord.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      result = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "Kon het AI-antwoord niet parsen", raw: antwoord.text },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("AI what-if fout:", msg);
    return NextResponse.json({ error: `What-if analyse mislukt: ${msg}` }, { status: 500 });
  }
}
