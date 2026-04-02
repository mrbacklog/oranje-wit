"use server";

import { revalidatePath } from "next/cache";
import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";
import { type ActionResult } from "@oranje-wit/types";
import { type AiProviderSleutel } from "./ai-providers";

// ─── Types ──────────────────────────────────────────────────────

export interface DaisyInstellingenData {
  provider: AiProviderSleutel;
  claudeModel: string;
  geminiModel: string;
  maxTokens: number;
}

// ─── Ophalen ─────────────────────────────────────────────────────

export async function getDaisyInstellingen(): Promise<DaisyInstellingenData> {
  const instelling = await prisma.aiProviderInstelling.findFirst({
    orderBy: { bijgewerktOp: "desc" },
  });

  return {
    provider: (instelling?.provider ?? "auto") as AiProviderSleutel,
    claudeModel: instelling?.claudeModel ?? "claude-sonnet-4-6",
    geminiModel: instelling?.geminiModel ?? "gemini-2.0-flash",
    maxTokens: instelling?.maxTokens ?? 1024,
  };
}

// ─── Provider-beschikbaarheid ─────────────────────────────────────

export async function getDaisyBeschikbaarheid(): Promise<{
  beschikbaar: boolean;
  actieveProvider: "claude" | "gemini" | null;
}> {
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  const instelling = await prisma.aiProviderInstelling.findFirst({
    orderBy: { bijgewerktOp: "desc" },
  });

  const provider = instelling?.provider ?? "auto";

  if (provider === "claude") {
    return { beschikbaar: !!claudeKey, actieveProvider: claudeKey ? "claude" : null };
  }
  if (provider === "gemini") {
    return { beschikbaar: !!geminiKey, actieveProvider: geminiKey ? "gemini" : null };
  }

  // auto
  if (claudeKey) return { beschikbaar: true, actieveProvider: "claude" };
  if (geminiKey) return { beschikbaar: true, actieveProvider: "gemini" };
  return { beschikbaar: false, actieveProvider: null };
}

// ─── Opslaan ─────────────────────────────────────────────────────

export async function slaInstellingenOp(
  data: DaisyInstellingenData
): Promise<ActionResult<{ id: string }>> {
  const session = await requireTC();

  try {
    const bestaand = await prisma.aiProviderInstelling.findFirst({
      orderBy: { bijgewerktOp: "desc" },
    });

    if (bestaand) {
      const bijgewerkt = await prisma.aiProviderInstelling.update({
        where: { id: bestaand.id },
        data: {
          provider: data.provider,
          claudeModel: data.claudeModel,
          geminiModel: data.geminiModel,
          maxTokens: data.maxTokens,
          bijgewerktDoor: session.user?.email ?? null,
        },
      });
      revalidatePath("/beheer/systeem/daisy");
      return { ok: true, data: { id: bijgewerkt.id } };
    }

    const nieuw = await prisma.aiProviderInstelling.create({
      data: {
        provider: data.provider,
        claudeModel: data.claudeModel,
        geminiModel: data.geminiModel,
        maxTokens: data.maxTokens,
        bijgewerktDoor: session.user?.email ?? null,
      },
    });
    revalidatePath("/beheer/systeem/daisy");
    return { ok: true, data: { id: nieuw.id } };
  } catch (error) {
    logger.error("Fout bij opslaan Daisy instellingen:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Onbekende fout bij opslaan.",
    };
  }
}
