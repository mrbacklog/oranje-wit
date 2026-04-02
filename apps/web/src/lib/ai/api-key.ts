/**
 * AI instellingen ophalen
 *
 * Haalt provider-configuratie op uit de database (AiProviderInstelling).
 * Gebruikt env-vars als fallback voor API keys.
 */

import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";
import {
  CLAUDE_MODEL_DEFAULT,
  GEMINI_MODEL_DEFAULT,
  type AiInstellingen,
  type AiProvider,
} from "./provider";

// ─── Defaults ────────────────────────────────────────────────────

const DEFAULTS: AiInstellingen = {
  provider: "claude",
  claudeModel: CLAUDE_MODEL_DEFAULT,
  geminiModel: GEMINI_MODEL_DEFAULT,
  maxTokens: 1024,
};

// ─── Publieke functie ─────────────────────────────────────────────

export async function getAiInstellingen(): Promise<AiInstellingen> {
  let dbInstelling: {
    provider: string;
    claudeModel: string;
    geminiModel: string;
    maxTokens: number;
  } | null = null;

  try {
    dbInstelling = await prisma.aiProviderInstelling.findFirst({
      orderBy: { bijgewerktOp: "desc" },
    });
  } catch (error) {
    logger.warn("Kon AI-instellingen niet ophalen uit database, gebruik defaults:", error);
  }

  const provider = (dbInstelling?.provider ?? DEFAULTS.provider) as AiProvider;
  const claudeModel = dbInstelling?.claudeModel ?? DEFAULTS.claudeModel;
  const geminiModel = dbInstelling?.geminiModel ?? DEFAULTS.geminiModel;
  const maxTokens = dbInstelling?.maxTokens ?? DEFAULTS.maxTokens;

  // API keys altijd uit env (nooit in DB opslaan)
  const claudeKey = process.env.ANTHROPIC_API_KEY || undefined;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || undefined;

  return {
    provider,
    claudeModel,
    geminiModel,
    maxTokens,
    claudeKey,
    geminiKey,
  };
}
