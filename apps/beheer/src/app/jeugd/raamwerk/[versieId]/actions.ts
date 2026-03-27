"use server";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────

export type RaamwerkDetail = Awaited<ReturnType<typeof getRaamwerkDetail>>;
export type RaamwerkGroepDetail = RaamwerkDetail["groepen"][number];
export type RaamwerkPijlerDetail = RaamwerkGroepDetail["pijlers"][number];
export type RaamwerkItemDetail = RaamwerkPijlerDetail["items"][number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Haal een versie op met alle groepen, pijlers en items.
 */
export async function getRaamwerkDetail(versieId: string) {
  const versie = await prisma.raamwerkVersie.findUniqueOrThrow({
    where: { id: versieId },
    include: {
      groepen: {
        orderBy: { band: "asc" },
        include: {
          pijlers: {
            orderBy: { volgorde: "asc" },
            include: {
              items: {
                orderBy: { volgorde: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return versie;
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Guard: controleer of de versie bewerkbaar is (status CONCEPT).
 */
async function assertBewerkbaar(versieId: string) {
  const versie = await prisma.raamwerkVersie.findUniqueOrThrow({
    where: { id: versieId },
    select: { status: true },
  });
  if (versie.status !== "CONCEPT") {
    throw new Error(
      `Versie is niet bewerkbaar (status: ${versie.status}). Alleen CONCEPT-versies kunnen worden gewijzigd.`
    );
  }
}

/**
 * Haal de versieId op via een pijlerId (voor bewerkbaarheidscheck).
 */
async function getVersieIdViaPijler(pijlerId: string): Promise<string> {
  const pijler = await prisma.pijler.findUniqueOrThrow({
    where: { id: pijlerId },
    select: { groep: { select: { versieId: true } } },
  });
  return pijler.groep.versieId;
}

/**
 * Haal de versieId op via een itemId.
 */
async function getVersieIdViaItem(itemId: string): Promise<string> {
  const item = await prisma.ontwikkelItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { pijler: { select: { groep: { select: { versieId: true } } } } },
  });
  return item.pijler.groep.versieId;
}

// ── Item mutations ────────────────────────────────────────────

const CreateItemSchema = z.object({
  itemCode: z
    .string()
    .min(1, "itemCode is verplicht")
    .regex(/^[a-z_]+$/, "itemCode mag alleen lowercase letters en underscores bevatten"),
  label: z.string().min(1, "Label is verplicht"),
  vraagTekst: z.string().min(1, "Vraagtekst is verplicht"),
  laag: z.enum(["technisch", "tactisch", "mentaal"]).nullable().optional(),
});

/**
 * Maak een nieuw item aan binnen een pijler.
 */
export async function createItem(
  pijlerId: string,
  data: { itemCode: string; label: string; vraagTekst: string; laag?: string | null }
) {
  const versieId = await getVersieIdViaPijler(pijlerId);
  await assertBewerkbaar(versieId);

  const parsed = CreateItemSchema.parse(data);

  // Bepaal volgende volgorde
  const laatsteItem = await prisma.ontwikkelItem.findFirst({
    where: { pijlerId },
    orderBy: { volgorde: "desc" },
    select: { volgorde: true },
  });
  const volgorde = (laatsteItem?.volgorde ?? -1) + 1;

  const item = await prisma.ontwikkelItem.create({
    data: {
      pijlerId,
      itemCode: parsed.itemCode,
      label: parsed.label,
      vraagTekst: parsed.vraagTekst,
      laag: parsed.laag ?? null,
      volgorde,
    },
  });

  logger.info(`Item ${parsed.itemCode} aangemaakt in pijler ${pijlerId}`);
  revalidatePath(`/jeugd/raamwerk/${versieId}`);
  return item;
}

const UpdateItemSchema = z.object({
  label: z.string().min(1).optional(),
  vraagTekst: z.string().min(1).optional(),
  laag: z.enum(["technisch", "tactisch", "mentaal"]).nullable().optional(),
  actief: z.boolean().optional(),
});

/**
 * Update een bestaand item (label, vraagTekst, laag, actief).
 */
export async function updateItem(
  itemId: string,
  data: Partial<{ label: string; vraagTekst: string; laag: string | null; actief: boolean }>
) {
  const versieId = await getVersieIdViaItem(itemId);
  await assertBewerkbaar(versieId);

  const parsed = UpdateItemSchema.parse(data);

  const item = await prisma.ontwikkelItem.update({
    where: { id: itemId },
    data: parsed,
  });

  logger.info(`Item ${itemId} bijgewerkt`);
  revalidatePath(`/jeugd/raamwerk/${versieId}`);
  return item;
}

/**
 * Verwijder een item (alleen bij CONCEPT-status).
 */
export async function deleteItem(itemId: string) {
  const versieId = await getVersieIdViaItem(itemId);
  await assertBewerkbaar(versieId);

  await prisma.ontwikkelItem.delete({ where: { id: itemId } });

  logger.info(`Item ${itemId} verwijderd`);
  revalidatePath(`/jeugd/raamwerk/${versieId}`);
}

/**
 * Bulk volgorde-update voor items binnen een pijler.
 * @param pijlerId - De pijler waarvan de items worden gesorteerd
 * @param itemIds - De item-IDs in de gewenste volgorde
 */
export async function reorderItems(pijlerId: string, itemIds: string[]) {
  const versieId = await getVersieIdViaPijler(pijlerId);
  await assertBewerkbaar(versieId);

  // Valideer dat alle items bij deze pijler horen
  const items = await prisma.ontwikkelItem.findMany({
    where: { pijlerId },
    select: { id: true },
  });
  const bestaandeIds = new Set(items.map((i) => i.id));
  for (const id of itemIds) {
    if (!bestaandeIds.has(id)) {
      throw new Error(`Item ${id} hoort niet bij pijler ${pijlerId}`);
    }
  }

  // Batch update volgorde
  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.ontwikkelItem.update({
        where: { id },
        data: { volgorde: index },
      })
    )
  );

  logger.info(`Items in pijler ${pijlerId} opnieuw geordend`);
  revalidatePath(`/jeugd/raamwerk/${versieId}`);
}

// ── Groep mutations ───────────────────────────────────────────

const UpdateGroepSchema = z.object({
  schaalType: z.enum(["duim", "smiley", "sterren", "slider"]).optional(),
  maxScore: z.number().int().min(1).max(99).optional(),
  doelAantal: z.number().int().min(0).optional(),
});

/**
 * Update groepsinstellingen (schaalType, maxScore, doelAantal).
 */
export async function updateGroepSettings(
  groepId: string,
  data: Partial<{ schaalType: string; maxScore: number; doelAantal: number }>
) {
  const groep = await prisma.leeftijdsgroep.findUniqueOrThrow({
    where: { id: groepId },
    select: { versieId: true },
  });
  await assertBewerkbaar(groep.versieId);

  const parsed = UpdateGroepSchema.parse(data);

  const updated = await prisma.leeftijdsgroep.update({
    where: { id: groepId },
    data: parsed,
  });

  logger.info(`Groep ${groepId} instellingen bijgewerkt`);
  revalidatePath(`/jeugd/raamwerk/${groep.versieId}`);
  return updated;
}
