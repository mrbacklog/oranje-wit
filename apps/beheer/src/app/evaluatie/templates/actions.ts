"use server";

import { prisma } from "@/lib/db/prisma";
import {
  getTemplates as _getTemplates,
  updateTemplate as _updateTemplate,
  type EmailTemplateRow as _EmailTemplateRow,
} from "@oranje-wit/database";
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type { ActionResult } from "@oranje-wit/types";

export type TemplateRow = _EmailTemplateRow;

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle e-mail templates.
 */
export async function getTemplates() {
  return _getTemplates(prisma);
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
    const result = await _updateTemplate(prisma, id, {
      onderwerp: parsed.data.onderwerp,
      inhoudHtml: parsed.data.inhoudHtml,
    });

    logger.info(`Template bijgewerkt: ${id}`);
    revalidatePath("/evaluatie/templates");
    return result;
  } catch (error) {
    logger.warn("updateTemplate mislukt:", error);
    return { ok: false, error: "Kon template niet bijwerken" };
  }
}
