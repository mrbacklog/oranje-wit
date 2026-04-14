/**
 * POST /api/ai/chat — Streaming chat endpoint voor Daisy (TI Studio)
 */

import { streamText, type UIMessage, type ToolSet, convertToModelMessages, stepCountIs } from "ai";
import { guardAuth } from "@oranje-wit/auth/checks";
import type { AuthSession } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import { buildDaisyPrompt } from "@/lib/ai/daisy";
import { getTiStudioTools } from "@/lib/ai/plugins/ti-studio";
import { getAiInstellingen } from "@/lib/ai/api-key";
import { getDaisyModel, bepaalActieveProvider } from "@/lib/ai/provider";

export const maxDuration = 30;

export async function POST(request: Request) {
  // --- Auth: browser-sessie OF service-key ---
  let session: AuthSession;

  const serviceKey = request.headers.get("X-Daisy-Service-Key");
  const expectedKey = process.env.DAISY_SERVICE_KEY;

  if (serviceKey && expectedKey && serviceKey === expectedKey) {
    // Programmatische toegang via service-key (Claude Code, scripts)
    session = {
      user: {
        email: "service@oranjewit.internal",
        name: "Service",
        isTC: true,
        isScout: false,
        clearance: 3,
        doelgroepen: [],
      },
    } as AuthSession;
  } else {
    const auth = await guardAuth();
    if (!auth.ok) return auth.response;
    session = auth.session;
  }

  // --- Request body ---
  const body = (await request.json()) as {
    messages?: UIMessage[];
    versieId?: string;
    werkindelingId?: string;
    werkindelingNaam?: string;
  };

  const { messages, versieId, werkindelingId, werkindelingNaam } = body;

  const werkbordContext =
    versieId && werkindelingId
      ? { versieId, werkindelingId, werkindelingNaam: werkindelingNaam ?? "" }
      : undefined;

  if (!messages || messages.length === 0) {
    return Response.json({ error: "Geen berichten meegegeven." }, { status: 400 });
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
    return Response.json(
      { error: error instanceof Error ? error.message : "Geen AI-provider beschikbaar." },
      { status: 503 }
    );
  }

  // --- Convert UI messages to model messages (max 10 beurten) ---
  const beperkteBerichten = messages.slice(-10);
  const modelMessages = await convertToModelMessages(beperkteBerichten);

  // --- Streaming response ---
  const sessieId = `ti-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tools = getTiStudioTools(sessieId, session.user.email) as unknown as ToolSet;

  const result = streamText({
    model,
    system: buildDaisyPrompt(session, werkbordContext),
    messages: modelMessages,
    tools,
    maxOutputTokens: aiInstellingen.maxTokens,
    stopWhen: stepCountIs(3),
  });

  return result.toTextStreamResponse({
    headers: {
      "X-Ai-Provider": actieveProvider,
    },
  });
}
