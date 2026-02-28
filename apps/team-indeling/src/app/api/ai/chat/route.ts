import Anthropic from "@anthropic-ai/sdk";
import { TOOLS, handleTool, type ToolContext, type MutatieEvent } from "@/lib/ai/tools";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Je bent de AI-indelingsassistent van c.k.v. Oranje Wit, een korfbalvereniging uit Dordrecht. Je helpt bij de jaarlijkse teamindeling voor seizoen 2026-2027.

## De Oranje Draad
PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
Plezier staat voorop. Elke indeling wordt getoetst aan deze drie pijlers.

## Jouw rol
- Je bent een ervaren korfbal-expert die meedenkt over teamindelingen
- Je kunt data opzoeken (huidige indeling, spelerspool, evaluaties, standen, historie)
- Je kunt op verzoek wijzigingen doorvoeren (spelers verplaatsen, toevoegen, verwijderen, teams aanmaken)
- Bij mutaties: voer ze direct uit als de gebruiker er expliciet om vraagt. Vraag alleen bevestiging als het onduidelijk is.
- Na mutaties: gebruik altijd valideer_teams om te checken of de indeling nog klopt. Meld waarschuwingen of overtredingen aan de gebruiker.
- Gebruik bekijk_blauwdruk_kaders om de specifieke regels voor dit scenario op te halen als je die nodig hebt.

## Stijl
- Spreek Nederlands, informeel en direct
- Wees concreet: noem namen, teams, leeftijden
- Gebruik je tools om data op te halen — gok NIET over spelers of teams
- Houd antwoorden compact maar informatief

## KNKV-regels (verplicht)
- Viertallen (blauw, groen): 4-8 spelers, max 2 geboortejaren spreiding
- Achttallen (geel, oranje, rood): 8-13 spelers, max 3 geboortejaren spreiding
- A-categorie (U15/U17/U19): 8-13 spelers, 2 geboortejaren per categorie
- Senioren: 8-13 spelers, geen leeftijdsbeperking
- Genderbalans: streef naar min 2 jongens en 2 meisjes per team

## Korfballeeftijd
Peildatum: 31 december 2026. Leeftijd = peildatum - geboortedatum.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  scenarioId: string;
  versieId: string;
  berichten: ChatMessage[];
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { scenarioId, versieId, berichten } = body;

    if (!scenarioId || !versieId || !berichten?.length) {
      return new Response(
        JSON.stringify({ error: "scenarioId, versieId en berichten zijn verplicht" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const ctx: ToolContext = { scenarioId, versieId };
    const mutaties: MutatieEvent[] = [];

    // Bouw messages array voor Claude
    const messages: Anthropic.MessageParam[] = berichten.map((b) => ({
      role: b.role,
      content: b.content,
    }));

    // Streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let keepGoing = true;

          while (keepGoing) {
            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 4096,
              system: SYSTEM_PROMPT,
              tools: TOOLS,
              messages,
            });

            keepGoing = false;

            for (const block of response.content) {
              if (block.type === "text") {
                // Stream tekst
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", text: block.text })}\n\n`)
                );
              } else if (block.type === "tool_use") {
                // Tool aanroep — stuur indicator naar client
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "tool_start", tool: block.name })}\n\n`
                  )
                );

                // Voer tool uit
                const toolResult = await handleTool(
                  block.name,
                  block.input as Record<string, unknown>,
                  ctx
                );

                if (toolResult.mutatie) {
                  mutaties.push(toolResult.mutatie);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "mutatie", mutatie: toolResult.mutatie })}\n\n`
                    )
                  );
                }

                // Voeg assistant + tool_result toe aan messages voor vervolg
                messages.push({
                  role: "assistant",
                  content: response.content,
                });
                messages.push({
                  role: "user",
                  content: [
                    {
                      type: "tool_result",
                      tool_use_id: block.id,
                      content: toolResult.result,
                    },
                  ],
                });

                // Ga door met de loop voor het vervolgantwoord
                keepGoing = true;
                break; // Break uit de content loop, ga terug naar while
              }
            }
          }

          // Stuur mutatie-samenvatting als er wijzigingen waren
          if (mutaties.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "mutaties_klaar", aantal: mutaties.length })}\n\n`
              )
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: `Chat mislukt: ${msg}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
