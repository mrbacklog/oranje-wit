"use server";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type TemplateRow = Awaited<ReturnType<typeof getTemplates>>[number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle e-mail templates.
 */
export async function getTemplates() {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { sleutel: "asc" },
  });
  return templates;
}

// ── Validatie ─────────────────────────────────────────────────

const UpdateTemplateSchema = z.object({
  onderwerp: z.string().min(1, "Onderwerp is verplicht").max(500),
  inhoudHtml: z.string().min(1, "HTML-inhoud is verplicht"),
});

// ── Mutaties ──────────────────────────────────────────────────

/**
 * Wijzig een bestaande template.
 */
export async function updateTemplate(id: string, formData: FormData): Promise<ActionResult> {
  const raw = {
    onderwerp: formData.get("onderwerp"),
    inhoudHtml: formData.get("inhoudHtml"),
  };

  const parsed = UpdateTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.emailTemplate.update({
      where: { id },
      data: {
        onderwerp: parsed.data.onderwerp,
        inhoudHtml: parsed.data.inhoudHtml,
      },
    });

    logger.info(`Template bijgewerkt: ${id}`);
    revalidatePath("/evaluatie/templates");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("updateTemplate mislukt:", error);
    return { ok: false, error: "Kon template niet bijwerken" };
  }
}
