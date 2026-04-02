/**
 * POST /api/ai/chat — Streaming chat endpoint voor Daisy
 *
 * Gebruikt Vercel AI SDK v6 met provider-agnostische abstractielaag (Claude/Gemini/Auto).
 * Auth via guardAuth(), minimaal clearance 1 vereist.
 */

import { streamText, type UIMessage, type ToolSet, convertToModelMessages, stepCountIs } from "ai";
import { guardAuth } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import { fail } from "@/lib/api/response";
import { buildDaisyPrompt } from "@/lib/ai/daisy";
import { getDaisyTools } from "@/lib/ai/plugins/registry";
import { getOfMaakGesprek, slaBerichtOp } from "@/lib/ai/gesprekken";
import { getAiInstellingen } from "@/lib/ai/api-key";
import { getDaisyModel, bepaalActieveProvider } from "@/lib/ai/provider";

export const maxDuration = 30;

export async function POST(request: Request) {
  // --- Auth ---
  const auth = await guardAuth();
  if (!auth.ok) return auth.response;
  const { session } = auth;

  if (session.user.clearance < 1) {
    return fail(
      "Daisy is beschikbaar voor TC-leden en coördinatoren.",
      403,
      "INSUFFICIENT_CLEARANCE"
    );
  }

  // --- Request body ---
  const body = (await request.json()) as {
    messages?: UIMessage[];
    gesprekId?: string;
  };

  const { messages, gesprekId } = body;

  if (!messages || messages.length === 0) {
    return fail("Geen berichten meegegeven.", 400, "BAD_REQUEST");
  }

  // --- Gesprek ophalen of aanmaken ---
  const gesprek = await getOfMaakGesprek(session.user.email, gesprekId);

  // --- Laatste gebruiker-bericht opslaan ---
  const laatsteBericht = messages[messages.length - 1];
  if (laatsteBericht?.role === "user") {
    // Extract text content from the last user message parts
    const tekstInhoud = laatsteBericht.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    if (tekstInhoud) {
      await slaBerichtOp(gesprek.id, "GEBRUIKER", tekstInhoud);
    }
  }

  // --- AI instellingen ophalen ---
  const aiInstellingen = await getAiInstellingen();
  let model;
  let actieveProvider: string;
  try {
    model = getDaisyModel(aiInstellingen);
    actieveProvider = bepaalActieveProvider(aiInstellingen);
  } catch (error) {
    logger.error("Geen AI-provider beschikbaar:", error);
    return fail(
      error instanceof Error ? error.message : "Geen AI-provider beschikbaar.",
      503,
      "NO_AI_PROVIDER"
    );
  }

  // --- Convert UI messages to model messages (max 10 beurten) ---
  const beperkteBerichten = messages.slice(-10);
  const modelMessages = await convertToModelMessages(beperkteBerichten);

  // --- Streaming response ---
  const tools = getDaisyTools(session.user.clearance) as unknown as ToolSet;
  const result = streamText({
    model,
    system: buildDaisyPrompt(session),
    messages: modelMessages,
    tools,
    maxOutputTokens: aiInstellingen.maxTokens,
    stopWhen: stepCountIs(3),
    onFinish: async ({ text }) => {
      if (text) {
        try {
          await slaBerichtOp(gesprek.id, "ASSISTENT", text);
        } catch (error) {
          logger.error("Fout bij opslaan assistent-bericht:", error);
        }
      }
    },
  });

  return result.toTextStreamResponse({
    headers: {
      "X-Gesprek-Id": gesprek.id,
      "X-Ai-Provider": actieveProvider,
    },
  });
}
