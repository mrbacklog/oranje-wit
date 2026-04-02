/**
 * Provider abstractielaag voor Daisy
 *
 * Haalt de juiste Vercel AI SDK model op op basis van instellingen.
 * Ondersteunt: claude (Anthropic), gemini (Google), auto (eerste beschikbare).
 */

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { type LanguageModel } from "ai";
import { logger } from "@oranje-wit/types";

// ─── Types ──────────────────────────────────────────────────────

export type AiProvider = "auto" | "claude" | "gemini";

export interface AiInstellingen {
  provider: AiProvider;
  claudeModel: string;
  geminiModel: string;
  maxTokens: number;
  claudeKey?: string;
  geminiKey?: string;
}

// ─── Model-namen ─────────────────────────────────────────────────

const CLAUDE_MODELLEN = {
  default: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
  haiku: "claude-haiku-4-5-20251001",
} as const;

const GEMINI_MODELLEN = {
  default: "gemini-2.0-flash",
  pro: "gemini-1.5-pro",
} as const;

export const CLAUDE_MODEL_DEFAULT = CLAUDE_MODELLEN.default;
export const GEMINI_MODEL_DEFAULT = GEMINI_MODELLEN.default;

// ─── Actieve provider naam ────────────────────────────────────────

export function bepaalActieveProvider(instellingen: AiInstellingen): "claude" | "gemini" {
  const { provider, claudeKey, geminiKey } = instellingen;

  if (provider === "claude") {
    if (!claudeKey) {
      throw new Error("Claude geselecteerd als provider maar ANTHROPIC_API_KEY ontbreekt.");
    }
    return "claude";
  }

  if (provider === "gemini") {
    if (!geminiKey) {
      throw new Error(
        "Gemini geselecteerd als provider maar GOOGLE_GENERATIVE_AI_API_KEY ontbreekt."
      );
    }
    return "gemini";
  }

  // auto: Claude eerst, dan Gemini
  if (claudeKey) return "claude";
  if (geminiKey) return "gemini";

  throw new Error(
    "Geen AI-provider beschikbaar. Stel ANTHROPIC_API_KEY of GOOGLE_GENERATIVE_AI_API_KEY in."
  );
}

// ─── Model ophalen ────────────────────────────────────────────────

export function getDaisyModel(instellingen: AiInstellingen): LanguageModel {
  const actief = bepaalActieveProvider(instellingen);

  if (actief === "claude") {
    const modelNaam = instellingen.claudeModel || CLAUDE_MODEL_DEFAULT;
    logger.info(`Daisy gebruikt Claude model: ${modelNaam}`);
    return anthropic(modelNaam) as unknown as LanguageModel;
  }

  const modelNaam = instellingen.geminiModel || GEMINI_MODEL_DEFAULT;
  logger.info(`Daisy gebruikt Gemini model: ${modelNaam}`);
  return google(modelNaam) as unknown as LanguageModel;
}
