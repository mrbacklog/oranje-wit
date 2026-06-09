"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getOfMaakWerkindelingVoorSeizoen } from "../indeling/actions";
import { getWerkindelingVoorEditor } from "../indeling/werkindeling-actions";
import {
  DEFAULT_PUBLICATIE_SECTIES,
  DEFAULT_PUBLICATIE_TEKSTEN,
  maakDefaultPublicatieInstellingen,
  type PublicatieInstellingen,
  type PublicatieSectieConfig,
} from "./preseason-pdf-data";

function normaliseerSecties(value: unknown): PublicatieSectieConfig[] {
  if (!Array.isArray(value)) return DEFAULT_PUBLICATIE_SECTIES;
  const secties = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      if (typeof record.key !== "string" || typeof record.titel !== "string") return null;
      return { key: record.key, titel: record.titel };
    })
    .filter(Boolean) as PublicatieSectieConfig[];
  return secties.length > 0 ? secties : DEFAULT_PUBLICATIE_SECTIES;
}

function publicatieUitDb(row: any, kadersId: string, seizoen: string): PublicatieInstellingen {
  if (!row) return maakDefaultPublicatieInstellingen(kadersId, seizoen);
  return {
    id: row.id,
    kadersId,
    titel: row.titel ?? DEFAULT_PUBLICATIE_TEKSTEN.titel,
    seizoenLabel: row.seizoenLabel ?? seizoen,
    introTekst: row.introTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.introTekst,
    waaromTekst: row.waaromTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.waaromTekst,
    werkwijzeTekst: row.werkwijzeTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.werkwijzeTekst,
    competitieTekst: row.competitieTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.competitieTekst,
    tcTekst: row.tcTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.tcTekst,
    kennismakingTekst: row.kennismakingTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.kennismakingTekst,
    contactTekst: row.contactTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.contactTekst,
    kangoeroesTekst: row.kangoeroesTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.kangoeroesTekst,
    bedankTekst: row.bedankTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.bedankTekst,
    sectieVolgorde: normaliseerSecties(row.sectieVolgorde),
  };
}

async function getPublicatieContext() {
  const werkindeling = await getOfMaakWerkindelingVoorSeizoen();
  if (!werkindeling) return null;
  const volledig = await getWerkindelingVoorEditor(werkindeling.id);
  if (!volledig) return null;
  return {
    kadersId: volledig.kaders.id,
    seizoen: String(volledig.kaders.seizoen),
  };
}

export async function getPublicatieInstellingen(): Promise<ActionResult<PublicatieInstellingen>> {
  try {
    await requireTC();
    const context = await getPublicatieContext();
    if (!context) {
      return {
        ok: false,
        error: "Geen werkindeling of kaders gevonden voor het actieve seizoen.",
      };
    }

    const row = await prisma.teamindelingPublicatie.findUnique({
      where: { kadersId: context.kadersId },
    });

    return {
      ok: true,
      data: publicatieUitDb(row, context.kadersId, context.seizoen),
    };
  } catch (error) {
    logger.error("getPublicatieInstellingen mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function schoonTekst(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function savePublicatieInstellingen(
  input: PublicatieInstellingen
): Promise<ActionResult<PublicatieInstellingen>> {
  try {
    await requireTC();
    const context = await getPublicatieContext();
    if (!context) {
      return {
        ok: false,
        error: "Geen werkindeling of kaders gevonden voor het actieve seizoen.",
      };
    }

    const defaults = maakDefaultPublicatieInstellingen(context.kadersId, context.seizoen);
    const data = {
      titel: schoonTekst(input.titel) || defaults.titel,
      seizoenLabel: schoonTekst(input.seizoenLabel) || defaults.seizoenLabel,
      introTekst: schoonTekst(input.introTekst) || defaults.introTekst,
      waaromTekst: schoonTekst(input.waaromTekst) || defaults.waaromTekst,
      werkwijzeTekst: schoonTekst(input.werkwijzeTekst) || defaults.werkwijzeTekst,
      competitieTekst: schoonTekst(input.competitieTekst) || defaults.competitieTekst,
      tcTekst: schoonTekst(input.tcTekst) || defaults.tcTekst,
      kennismakingTekst: schoonTekst(input.kennismakingTekst) || defaults.kennismakingTekst,
      contactTekst: schoonTekst(input.contactTekst) || defaults.contactTekst,
      kangoeroesTekst: schoonTekst(input.kangoeroesTekst) || defaults.kangoeroesTekst,
      bedankTekst: schoonTekst(input.bedankTekst) || defaults.bedankTekst,
      sectieVolgorde: normaliseerSecties(input.sectieVolgorde),
    };

    const row = await prisma.teamindelingPublicatie.upsert({
      where: { kadersId: context.kadersId },
      create: { kadersId: context.kadersId, ...data },
      update: data,
    });

    revalidatePath("/presentatie");

    return {
      ok: true,
      data: publicatieUitDb(row, context.kadersId, context.seizoen),
    };
  } catch (error) {
    logger.error("savePublicatieInstellingen mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
