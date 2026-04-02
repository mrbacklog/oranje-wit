/**
 * AI provider-configuratie voor de Daisy instellingen pagina.
 */

export type AiProviderSleutel = "auto" | "claude" | "gemini";

export interface AiProviderOptie {
  sleutel: AiProviderSleutel;
  label: string;
  envVar?: string;
}

export interface AiModelOptie {
  waarde: string;
  label: string;
}

export const AI_PROVIDERS: AiProviderOptie[] = [
  { sleutel: "auto", label: "Auto" },
  { sleutel: "claude", label: "Claude", envVar: "ANTHROPIC_API_KEY" },
  { sleutel: "gemini", label: "Gemini", envVar: "GOOGLE_GENERATIVE_AI_API_KEY" },
];

export const CLAUDE_MODELLEN: AiModelOptie[] = [
  { waarde: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (aanbevolen)" },
  { waarde: "claude-opus-4-6", label: "Claude Opus 4.6 (krachtigst)" },
  { waarde: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (snel)" },
];

export const GEMINI_MODELLEN: AiModelOptie[] = [
  { waarde: "gemini-2.0-flash", label: "Gemini 2.0 Flash (aanbevolen)" },
  { waarde: "gemini-1.5-pro", label: "Gemini 1.5 Pro (krachtigst)" },
];

export const MAX_TOKENS_MIN = 256;
export const MAX_TOKENS_MAX = 4096;
export const MAX_TOKENS_STEP = 256;
export const MAX_TOKENS_DEFAULT = 1024;
