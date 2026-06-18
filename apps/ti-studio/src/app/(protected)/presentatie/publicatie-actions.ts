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
  DEFAULT_BLOKKEN,
  maakDefaultPublicatieInstellingen,
  type PublicatieInstellingen,
  type PublicatieSectieConfig,
  type BelangrijkeDatumItem,
  type KennismakingItem,
  type TekstBlok,
} from "./preseason-pdf-data";

function normaliseerBelangrijkeData(value: unknown): BelangrijkeDatumItem[] {
  if (!Array.isArray(value)) return [...DEFAULT_PUBLICATIE_TEKSTEN.belangrijkeData];
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      if (typeof r.datum !== "string" || typeof r.omschrijving !== "string") return null;
      return { datum: r.datum, omschrijving: r.omschrijving };
    })
    .filter(Boolean) as BelangrijkeDatumItem[];
  return items;
}

function normaliseerKennismakingData(value: unknown): KennismakingItem[] {
  if (!Array.isArray(value)) return [...DEFAULT_PUBLICATIE_TEKSTEN.kennismakingData];
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      if (
        typeof r.teamnaam !== "string" ||
        typeof r.datum !== "string" ||
        typeof r.tijd !== "string" ||
        typeof r.locatie !== "string"
      )
        return null;
      return { teamnaam: r.teamnaam, datum: r.datum, tijd: r.tijd, locatie: r.locatie };
    })
    .filter(Boolean) as KennismakingItem[];
  return items;
}

function normaliseerBlokken(value: unknown, defaults: TekstBlok[]): TekstBlok[] {
  if (!Array.isArray(value) || value.length === 0) return defaults;
  const blokken = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.subtitle !== "string" || typeof r.tekst !== "string")
        return null;
      return {
        id: r.id,
        subtitle: r.subtitle,
        tekst: r.tekst,
        ...(typeof r.label === "string" && r.label ? { label: r.label } : {}),
      };
    })
    .filter(Boolean) as TekstBlok[];
  return blokken.length > 0 ? blokken : defaults;
}

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
    statusBanner: row.statusBanner ?? null,
    tcOndertekening: row.tcOndertekening ?? null,
    introTekst: row.introTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.introTekst,
    waaromTekst: row.waaromTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.waaromTekst,
    werkwijzeTekst: row.werkwijzeTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.werkwijzeTekst,
    competitieTekst: row.competitieTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.competitieTekst,
    tcTekst: row.tcTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.tcTekst,
    kennismakingTekst: row.kennismakingTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.kennismakingTekst,
    contactTekst: row.contactTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.contactTekst,
    kangoeroesTekst: row.kangoeroesTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.kangoeroesTekst,
    bedankTekst: row.bedankTekst ?? DEFAULT_PUBLICATIE_TEKSTEN.bedankTekst,
    toelichtingBlokken: normaliseerBlokken(
      row.toelichtingBlokken,
      DEFAULT_BLOKKEN.toelichtingBlokken
    ),
    kalenderBlokken: normaliseerBlokken(row.kalenderBlokken, DEFAULT_BLOKKEN.kalenderBlokken),
    kennismakingBlokken: normaliseerBlokken(
      row.kennismakingBlokken,
      DEFAULT_BLOKKEN.kennismakingBlokken
    ),
    tcOproepBlokken: normaliseerBlokken(row.tcOproepBlokken, DEFAULT_BLOKKEN.tcOproepBlokken),
    vragenBlokken: normaliseerBlokken(row.vragenBlokken, DEFAULT_BLOKKEN.vragenBlokken),
    sectieVolgorde: normaliseerSecties(row.sectieVolgorde),
    belangrijkeData: normaliseerBelangrijkeData(row.belangrijkeData),
    kennismakingData: normaliseerKennismakingData(row.kennismakingData),
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

    let row = await prisma.teamindelingPublicatie.findUnique({
      where: { kadersId: context.kadersId },
      select: {
        id: true,
        titel: true,
        seizoenLabel: true,
        statusBanner: true,
        tcOndertekening: true,
        introTekst: true,
        waaromTekst: true,
        werkwijzeTekst: true,
        competitieTekst: true,
        tcTekst: true,
        kennismakingTekst: true,
        contactTekst: true,
        kangoeroesTekst: true,
        bedankTekst: true,
        toelichtingBlokken: true,
        kalenderBlokken: true,
        kennismakingBlokken: true,
        tcOproepBlokken: true,
        vragenBlokken: true,
        sectieVolgorde: true,
        belangrijkeData: true,
        kennismakingData: true,
      },
    });

    // Eerste keer: sla defaults op zodat de TC direct kan redigeren
    if (!row) {
      const defaults = maakDefaultPublicatieInstellingen(context.kadersId, context.seizoen);
      row = await prisma.teamindelingPublicatie.upsert({
        where: { kadersId: context.kadersId },
        create: {
          kadersId: context.kadersId,
          titel: defaults.titel,
          seizoenLabel: defaults.seizoenLabel,
          statusBanner: defaults.statusBanner,
          tcOndertekening: defaults.tcOndertekening,
          introTekst: defaults.introTekst,
          waaromTekst: defaults.waaromTekst,
          werkwijzeTekst: defaults.werkwijzeTekst,
          competitieTekst: defaults.competitieTekst,
          tcTekst: defaults.tcTekst,
          kennismakingTekst: defaults.kennismakingTekst,
          contactTekst: defaults.contactTekst,
          kangoeroesTekst: defaults.kangoeroesTekst,
          bedankTekst: defaults.bedankTekst,
          toelichtingBlokken: defaults.toelichtingBlokken,
          kalenderBlokken: defaults.kalenderBlokken,
          kennismakingBlokken: defaults.kennismakingBlokken,
          tcOproepBlokken: defaults.tcOproepBlokken,
          vragenBlokken: defaults.vragenBlokken,
          sectieVolgorde: defaults.sectieVolgorde,
          belangrijkeData: defaults.belangrijkeData,
          kennismakingData: defaults.kennismakingData,
        },
        update: {},
        select: {
          id: true,
          titel: true,
          seizoenLabel: true,
          statusBanner: true,
          tcOndertekening: true,
          introTekst: true,
          waaromTekst: true,
          werkwijzeTekst: true,
          competitieTekst: true,
          tcTekst: true,
          kennismakingTekst: true,
          contactTekst: true,
          kangoeroesTekst: true,
          bedankTekst: true,
          toelichtingBlokken: true,
          kalenderBlokken: true,
          kennismakingBlokken: true,
          tcOproepBlokken: true,
          vragenBlokken: true,
          sectieVolgorde: true,
          belangrijkeData: true,
          kennismakingData: true,
        },
      });
      revalidatePath("/teamindeling");
    }

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
      statusBanner:
        typeof input.statusBanner === "string" ? input.statusBanner.trim() || null : null,
      tcOndertekening:
        typeof input.tcOndertekening === "string" ? input.tcOndertekening.trim() || null : null,
      introTekst: schoonTekst(input.introTekst) || defaults.introTekst,
      waaromTekst: schoonTekst(input.waaromTekst) || defaults.waaromTekst,
      werkwijzeTekst: schoonTekst(input.werkwijzeTekst) || defaults.werkwijzeTekst,
      competitieTekst: schoonTekst(input.competitieTekst) || defaults.competitieTekst,
      tcTekst: schoonTekst(input.tcTekst) || defaults.tcTekst,
      kennismakingTekst: schoonTekst(input.kennismakingTekst) || defaults.kennismakingTekst,
      contactTekst: schoonTekst(input.contactTekst) || defaults.contactTekst,
      kangoeroesTekst: schoonTekst(input.kangoeroesTekst) || defaults.kangoeroesTekst,
      bedankTekst: schoonTekst(input.bedankTekst) || defaults.bedankTekst,
      toelichtingBlokken: normaliseerBlokken(
        input.toelichtingBlokken,
        DEFAULT_BLOKKEN.toelichtingBlokken
      ),
      kalenderBlokken: normaliseerBlokken(input.kalenderBlokken, DEFAULT_BLOKKEN.kalenderBlokken),
      kennismakingBlokken: normaliseerBlokken(
        input.kennismakingBlokken,
        DEFAULT_BLOKKEN.kennismakingBlokken
      ),
      tcOproepBlokken: normaliseerBlokken(input.tcOproepBlokken, DEFAULT_BLOKKEN.tcOproepBlokken),
      vragenBlokken: normaliseerBlokken(input.vragenBlokken, DEFAULT_BLOKKEN.vragenBlokken),
      sectieVolgorde: normaliseerSecties(input.sectieVolgorde),
      belangrijkeData: normaliseerBelangrijkeData(input.belangrijkeData),
      kennismakingData: normaliseerKennismakingData(input.kennismakingData),
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
