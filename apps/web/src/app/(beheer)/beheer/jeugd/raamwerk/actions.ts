"use server";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";

// ── Types ─────────────────────────────────────────────────────

export type ValidationSeverity = "ERROR" | "WARNING";

export interface ValidationResult {
  regel: string;
  severity: ValidationSeverity;
  bericht: string;
  groepId?: string;
  pijlerId?: string;
}

// ── Queries ───────────────────────────────────────────────────

/**
 * Lijst alle raamwerkversies met groepen-count en item-totalen per band.
 */
export async function getRaamwerkVersies() {
  const versies = await prisma.raamwerkVersie.findMany({
    orderBy: [{ seizoen: "desc" }],
    include: {
      groepen: {
        orderBy: { band: "asc" },
        include: {
          pijlers: {
            include: {
              _count: { select: { items: true } },
            },
          },
        },
      },
    },
  });

  return versies.map((v) => ({
    id: v.id,
    seizoen: v.seizoen,
    naam: v.naam,
    status: v.status,
    opmerking: v.opmerking,
    gepubliceerdOp: v.gepubliceerdOp,
    createdAt: v.createdAt,
    groepenCount: v.groepen.length,
    itemsPerBand: v.groepen.map((g) => ({
      band: g.band,
      items: g.pijlers.reduce((sum, p) => sum + p._count.items, 0),
      doelAantal: g.doelAantal,
    })),
    totaalItems: v.groepen.reduce(
      (sum, g) => sum + g.pijlers.reduce((s, p) => s + p._count.items, 0),
      0
    ),
  }));
}

export type RaamwerkVersieSamenvatting = Awaited<ReturnType<typeof getRaamwerkVersies>>[number];

// ── Standaard bandconfiguratie ────────────────────────────────

const STANDAARD_BANDEN = [
  { band: "paars", schaalType: "observatie", maxScore: 1, doelAantal: 3 },
  { band: "blauw", schaalType: "ja_nogniet", maxScore: 2, doelAantal: 10 },
  { band: "groen", schaalType: "goed_oke_nogniet", maxScore: 3, doelAantal: 14 },
  { band: "geel", schaalType: "sterren", maxScore: 5, doelAantal: 25 },
  { band: "oranje", schaalType: "slider", maxScore: 10, doelAantal: 40 },
  { band: "rood", schaalType: "slider", maxScore: 10, doelAantal: 60 },
] as const;

// v3.0 Pijlerevolutie: 5 kindpijlers groeien naar 9 korfbalpijlers
// Blauw/Groen: Bal, Bewegen, Spel, Samen, Ik
// Geel: Aanvallen, Verdedigen, Techniek, Tactiek, Mentaal, Fysiek
// Oranje: + Sociaal
// Rood: + Scoren, Spelintelligentie
const PIJLERS_PER_BAND: Record<
  string,
  { code: string; naam: string; blok: string; gewicht: number }[]
> = {
  paars: [], // geen pijlers, observaties
  blauw: [
    { code: "BAL", naam: "Bal", blok: "korfbalacties", gewicht: 0.25 },
    { code: "BEWEGEN", naam: "Bewegen", blok: "korfbalacties", gewicht: 0.25 },
    { code: "SPEL", naam: "Spel", blok: "korfbalacties", gewicht: 0.2 },
    { code: "SAMEN", naam: "Samen", blok: "spelerskwaliteiten", gewicht: 0.15 },
    { code: "IK", naam: "Ik", blok: "spelerskwaliteiten", gewicht: 0.15 },
  ],
  groen: [
    { code: "BAL", naam: "Bal", blok: "korfbalacties", gewicht: 0.25 },
    { code: "BEWEGEN", naam: "Bewegen", blok: "korfbalacties", gewicht: 0.25 },
    { code: "SPEL", naam: "Spel", blok: "korfbalacties", gewicht: 0.2 },
    { code: "SAMEN", naam: "Samen", blok: "spelerskwaliteiten", gewicht: 0.15 },
    { code: "IK", naam: "Ik", blok: "spelerskwaliteiten", gewicht: 0.15 },
  ],
  geel: [
    { code: "AANVALLEN", naam: "Aanvallen", blok: "korfbalacties", gewicht: 0.18 },
    { code: "VERDEDIGEN", naam: "Verdedigen", blok: "korfbalacties", gewicht: 0.18 },
    { code: "TECHNIEK", naam: "Techniek", blok: "korfbalacties", gewicht: 0.16 },
    { code: "TACTIEK", naam: "Tactiek", blok: "korfbalacties", gewicht: 0.16 },
    { code: "MENTAAL", naam: "Mentaal", blok: "spelerskwaliteiten", gewicht: 0.16 },
    { code: "FYSIEK", naam: "Fysiek", blok: "spelerskwaliteiten", gewicht: 0.16 },
  ],
  oranje: [
    { code: "AANVALLEN", naam: "Aanvallen", blok: "korfbalacties", gewicht: 0.16 },
    { code: "VERDEDIGEN", naam: "Verdedigen", blok: "korfbalacties", gewicht: 0.16 },
    { code: "TECHNIEK", naam: "Techniek", blok: "korfbalacties", gewicht: 0.14 },
    { code: "TACTIEK", naam: "Tactiek", blok: "korfbalacties", gewicht: 0.14 },
    { code: "MENTAAL", naam: "Mentaal", blok: "spelerskwaliteiten", gewicht: 0.14 },
    { code: "SOCIAAL", naam: "Sociaal", blok: "spelerskwaliteiten", gewicht: 0.12 },
    { code: "FYSIEK", naam: "Fysiek", blok: "spelerskwaliteiten", gewicht: 0.14 },
  ],
  rood: [
    { code: "AANVALLEN", naam: "Aanvallen", blok: "korfbalacties", gewicht: 0.12 },
    { code: "VERDEDIGEN", naam: "Verdedigen", blok: "korfbalacties", gewicht: 0.12 },
    { code: "SCOREN", naam: "Scoren", blok: "korfbalacties", gewicht: 0.12 },
    { code: "TECHNIEK", naam: "Techniek", blok: "korfbalacties", gewicht: 0.11 },
    { code: "TACTIEK", naam: "Tactiek", blok: "korfbalacties", gewicht: 0.11 },
    { code: "SPELINTELLIGENTIE", naam: "Spelintelligentie", blok: "korfbalacties", gewicht: 0.1 },
    { code: "MENTAAL", naam: "Mentaal", blok: "spelerskwaliteiten", gewicht: 0.1 },
    { code: "SOCIAAL", naam: "Sociaal", blok: "spelerskwaliteiten", gewicht: 0.1 },
    { code: "FYSIEK", naam: "Fysiek", blok: "spelerskwaliteiten", gewicht: 0.12 },
  ],
};

// ── Mutations ─────────────────────────────────────────────────

/**
 * Maak een nieuwe raamwerkversie aan.
 * Optioneel: diepe kopie van een bestaande versie (groepen, pijlers, items).
 */
export async function createRaamwerk(seizoen: string, naam: string, kopieerVan?: string) {
  if (!/^\d{4}-\d{4}$/.test(seizoen)) {
    throw new Error("Ongeldig seizoensformaat (verwacht: 2025-2026)");
  }

  // Check of seizoen al bestaat
  const bestaand = await prisma.raamwerkVersie.findUnique({ where: { seizoen } });
  if (bestaand) {
    throw new Error(`Er bestaat al een raamwerkversie voor seizoen ${seizoen}`);
  }

  if (kopieerVan) {
    // Diepe kopie
    const bron = await prisma.raamwerkVersie.findUnique({
      where: { id: kopieerVan },
      include: {
        groepen: {
          include: {
            pijlers: {
              include: { items: { orderBy: { volgorde: "asc" } } },
              orderBy: { volgorde: "asc" },
            },
          },
        },
      },
    });

    if (!bron) throw new Error("Bronversie niet gevonden");

    await prisma.raamwerkVersie.create({
      data: {
        seizoen,
        naam,
        bronVersieId: kopieerVan,
        groepen: {
          create: bron.groepen.map((g) => ({
            band: g.band,
            schaalType: g.schaalType,
            maxScore: g.maxScore,
            doelAantal: g.doelAantal,
            pijlers: {
              create: g.pijlers.map((p) => ({
                code: p.code,
                naam: p.naam,
                icoon: p.icoon,
                blok: p.blok,
                gewicht: p.gewicht,
                volgorde: p.volgorde,
                items: {
                  create: p.items.map((i) => ({
                    itemCode: i.itemCode,
                    label: i.label,
                    vraagTekst: i.vraagTekst,
                    laag: i.laag,
                    isKern: i.isKern,
                    categorie: i.categorie,
                    observatie: i.observatie,
                    volgorde: i.volgorde,
                    actief: i.actief,
                    // voorloperId wordt niet gekopieerd (verwijst naar oude versie)
                  })),
                },
              })),
            },
          })),
        },
      },
    });

    logger.info(`Raamwerk ${seizoen} aangemaakt als kopie van ${bron.seizoen}`);
  } else {
    // Lege versie met standaard bandstructuur
    await prisma.raamwerkVersie.create({
      data: {
        seizoen,
        naam,
        groepen: {
          create: STANDAARD_BANDEN.map((b) => ({
            band: b.band,
            schaalType: b.schaalType,
            maxScore: b.maxScore,
            doelAantal: b.doelAantal,
            pijlers: {
              create: (PIJLERS_PER_BAND[b.band] ?? []).map((p, i) => ({
                code: p.code,
                naam: p.naam,
                blok: p.blok || null,
                gewicht: p.gewicht,
                volgorde: i,
              })),
            },
          })),
        },
      },
    });

    logger.info(`Leeg raamwerk ${seizoen} aangemaakt`);
  }

  revalidatePath("/beheer/jeugd/raamwerk");
}

/**
 * Publiceer een raamwerkversie: CONCEPT -> ACTIEF.
 * Voert eerst validatie uit en blokkeert bij ERROR-resultaten.
 */
export async function publiceerRaamwerk(versieId: string) {
  const versie = await prisma.raamwerkVersie.findUniqueOrThrow({
    where: { id: versieId },
    select: { status: true, seizoen: true },
  });

  if (versie.status !== "CONCEPT") {
    throw new Error(`Kan alleen CONCEPT-versies publiceren (huidige status: ${versie.status})`);
  }

  // Valideer eerst
  const resultaten = await valideerRaamwerk(versieId);
  const errors = resultaten.filter((r) => r.severity === "ERROR");
  if (errors.length > 0) {
    throw new Error(`Kan niet publiceren: ${errors.length} fout(en) gevonden. Los deze eerst op.`);
  }

  await prisma.raamwerkVersie.update({
    where: { id: versieId },
    data: {
      status: "ACTIEF",
      gepubliceerdOp: new Date(),
    },
  });

  logger.info(`Raamwerk ${versie.seizoen} gepubliceerd`);
  revalidatePath("/beheer/jeugd/raamwerk");
  revalidatePath(`/jeugd/raamwerk/${versieId}`);
}

/**
 * Archiveer een raamwerkversie: ACTIEF -> GEARCHIVEERD.
 */
export async function archiveerRaamwerk(versieId: string) {
  const versie = await prisma.raamwerkVersie.findUniqueOrThrow({
    where: { id: versieId },
    select: { status: true, seizoen: true },
  });

  if (versie.status !== "ACTIEF") {
    throw new Error(`Kan alleen ACTIEF-versies archiveren (huidige status: ${versie.status})`);
  }

  await prisma.raamwerkVersie.update({
    where: { id: versieId },
    data: { status: "GEARCHIVEERD" },
  });

  logger.info(`Raamwerk ${versie.seizoen} gearchiveerd`);
  revalidatePath("/beheer/jeugd/raamwerk");
  revalidatePath(`/jeugd/raamwerk/${versieId}`);
}

// ── Validatie ─────────────────────────────────────────────────

/**
 * Valideer een raamwerkversie tegen de businessregels.
 *
 * Regels:
 * - PIJLER_MIN_1: Elke pijler in elke groep heeft minstens 1 actief item (ERROR)
 * - BAND_ITEM_RANGE: Items binnen doelAantal +/- 20% (WARNING)
 * - PIJLER_BALANS: Geen pijler >50% van alle items in een groep (WARNING)
 * - STATUS_LOCK: ACTIEF/GEARCHIVEERD niet bewerkbaar (ERROR)
 */
export async function valideerRaamwerk(versieId: string): Promise<ValidationResult[]> {
  const versie = await prisma.raamwerkVersie.findUniqueOrThrow({
    where: { id: versieId },
    include: {
      groepen: {
        include: {
          pijlers: {
            include: {
              items: { where: { actief: true } },
            },
          },
        },
      },
    },
  });

  const resultaten: ValidationResult[] = [];

  // STATUS_LOCK
  if (versie.status === "ACTIEF" || versie.status === "GEARCHIVEERD") {
    resultaten.push({
      regel: "STATUS_LOCK",
      severity: "ERROR",
      bericht: `Versie heeft status ${versie.status} en is niet meer bewerkbaar`,
    });
  }

  for (const groep of versie.groepen) {
    const totaalActieveItems = groep.pijlers.reduce((s, p) => s + p.items.length, 0);

    // PIJLER_MIN_1
    for (const pijler of groep.pijlers) {
      if (pijler.items.length === 0) {
        resultaten.push({
          regel: "PIJLER_MIN_1",
          severity: "ERROR",
          bericht: `Band ${groep.band}: pijler ${pijler.naam} heeft geen actieve items`,
          groepId: groep.id,
          pijlerId: pijler.id,
        });
      }
    }

    // BAND_ITEM_RANGE
    if (groep.doelAantal > 0) {
      const ondergrens = Math.floor(groep.doelAantal * 0.8);
      const bovengrens = Math.ceil(groep.doelAantal * 1.2);
      if (totaalActieveItems < ondergrens || totaalActieveItems > bovengrens) {
        resultaten.push({
          regel: "BAND_ITEM_RANGE",
          severity: "WARNING",
          bericht: `Band ${groep.band}: ${totaalActieveItems} items (doel: ${groep.doelAantal}, range: ${ondergrens}-${bovengrens})`,
          groepId: groep.id,
        });
      }
    }

    // PIJLER_BALANS
    if (totaalActieveItems > 0) {
      for (const pijler of groep.pijlers) {
        const percentage = (pijler.items.length / totaalActieveItems) * 100;
        if (percentage > 50) {
          resultaten.push({
            regel: "PIJLER_BALANS",
            severity: "WARNING",
            bericht: `Band ${groep.band}: pijler ${pijler.naam} heeft ${Math.round(percentage)}% van alle items (max 50%)`,
            groepId: groep.id,
            pijlerId: pijler.id,
          });
        }
      }
    }
  }

  return resultaten;
}
