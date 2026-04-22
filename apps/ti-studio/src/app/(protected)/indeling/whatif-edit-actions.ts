"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import { assertWhatIfBewerkbaar, assertWhatIfBewerkbaarById } from "./whatif-guards";

// ============================================================
// WHAT-IF TEAM BEWERKINGEN
// ============================================================

/**
 * Voeg een speler toe aan een what-if team.
 */
export async function addSpelerToWhatIfTeam(whatIfTeamId: string, spelerId: string): Promise<void> {
  await assertWhatIfBewerkbaar(whatIfTeamId);

  const bestaand = await prisma.whatIfTeamSpeler.findFirst({
    where: { whatIfTeamId, spelerId },
  });
  if (bestaand) {
    throw new Error("Speler zit al in dit what-if team");
  }

  await prisma.whatIfTeamSpeler.create({
    data: { whatIfTeamId, spelerId },
  });

  logger.info(`Speler ${spelerId} toegevoegd aan what-if team ${whatIfTeamId}`);
}

/**
 * Verwijder een speler uit een what-if team.
 */
export async function removeSpelerFromWhatIfTeam(
  whatIfTeamId: string,
  spelerId: string
): Promise<void> {
  await assertWhatIfBewerkbaar(whatIfTeamId);

  const plaatsing = await prisma.whatIfTeamSpeler.findFirst({
    where: { whatIfTeamId, spelerId },
  });
  if (!plaatsing) {
    throw new Error("Speler zit niet in dit what-if team");
  }

  await prisma.whatIfTeamSpeler.delete({
    where: { id: plaatsing.id },
  });

  logger.info(`Speler ${spelerId} verwijderd uit what-if team ${whatIfTeamId}`);
}

/**
 * Verplaats een speler van het ene what-if team naar het andere.
 */
export async function moveSpelerInWhatIf(
  spelerId: string,
  vanTeamId: string,
  naarTeamId: string
): Promise<void> {
  if (vanTeamId === naarTeamId) {
    throw new Error("Bron- en doelteam zijn gelijk");
  }

  const [vanTeam, naarTeam] = await Promise.all([
    prisma.whatIfTeam.findUniqueOrThrow({
      where: { id: vanTeamId },
      select: { whatIfId: true },
    }),
    prisma.whatIfTeam.findUniqueOrThrow({
      where: { id: naarTeamId },
      select: { whatIfId: true },
    }),
  ]);

  if (vanTeam.whatIfId !== naarTeam.whatIfId) {
    throw new Error("Teams horen niet bij dezelfde what-if");
  }

  await assertWhatIfBewerkbaarById(vanTeam.whatIfId);

  await prisma.$transaction(async (tx: any) => {
    const plaatsing = await tx.whatIfTeamSpeler.findFirst({
      where: { whatIfTeamId: vanTeamId, spelerId },
    });
    if (!plaatsing) {
      throw new Error(`Speler ${spelerId} zit niet in team ${vanTeamId}`);
    }
    await tx.whatIfTeamSpeler.delete({
      where: { id: plaatsing.id },
    });

    const bestaandInDoel = await tx.whatIfTeamSpeler.findFirst({
      where: { whatIfTeamId: naarTeamId, spelerId },
    });
    if (bestaandInDoel) {
      throw new Error(`Speler ${spelerId} zit al in doelteam ${naarTeamId}`);
    }

    await tx.whatIfTeamSpeler.create({
      data: { whatIfTeamId: naarTeamId, spelerId },
    });
  });

  logger.info(`Speler ${spelerId} verplaatst van ${vanTeamId} naar ${naarTeamId}`);
}

/**
 * Voeg een extra team toe aan de what-if.
 *
 * Twee varianten:
 * - Met bronTeamId: kopieer een bestaand team uit de werkindeling
 * - Zonder bronTeamId: maak een nieuw team aan met naam/categorie/kleur
 */
export async function addTeamToWhatIf(
  whatIfId: string,
  data: { bronTeamId: string } | { naam: string; categorie: string; kleur?: string }
): Promise<{ id: string }> {
  await assertWhatIfBewerkbaarById(whatIfId);

  if ("bronTeamId" in data) {
    return kopieerBronTeam(whatIfId, data.bronTeamId);
  }

  const created = await prisma.whatIfTeam.create({
    data: {
      whatIfId,
      naam: data.naam,
      categorie: data.categorie,
      kleur: data.kleur ?? null,
    },
    select: { id: true },
  });

  logger.info(`Nieuw team "${data.naam}" aangemaakt in what-if ${whatIfId}`);
  return { id: created.id };
}

/**
 * Neem een team automatisch mee in de what-if.
 *
 * Wordt aangeroepen als een speler uit een niet-actief team wordt verplaatst
 * naar een what-if team. Kopieert het team (met al zijn spelers en staf)
 * vanuit de werkindeling naar de what-if.
 *
 * Retourneert het ID van het aangemaakte WhatIfTeam.
 */
export async function neemTeamMeeInWhatIf(
  whatIfId: string,
  teamId: string
): Promise<{ id: string }> {
  await assertWhatIfBewerkbaarById(whatIfId);

  // Controleer dat het team niet al in de what-if zit
  const bestaand = await prisma.whatIfTeam.findFirst({
    where: { whatIfId, bronTeamId: teamId },
  });
  if (bestaand) {
    throw new Error(`Team zit al in deze what-if (whatIfTeamId: ${bestaand.id})`);
  }

  // Kopieer het team via de bestaande helper
  const result = await kopieerBronTeam(whatIfId, teamId);

  logger.info(`Team ${teamId} automatisch meegenomen in what-if ${whatIfId}`);
  return result;
}

// ============================================================
// HELPERS
// ============================================================

async function kopieerBronTeam(whatIfId: string, bronTeamId: string): Promise<{ id: string }> {
  const bronTeam = await prisma.team.findUniqueOrThrow({
    where: { id: bronTeamId },
    select: {
      id: true,
      naam: true,
      categorie: true,
      kleur: true,
      teamType: true,
      niveau: true,
      volgorde: true,
      spelers: {
        select: { spelerId: true, statusOverride: true, notitie: true },
      },
      staf: {
        select: { stafId: true, rol: true },
      },
    },
  });

  const bestaand = await prisma.whatIfTeam.findFirst({
    where: { whatIfId, bronTeamId },
  });
  if (bestaand) {
    throw new Error(`Team "${bronTeam.naam}" zit al in deze what-if`);
  }

  const created = await prisma.whatIfTeam.create({
    data: {
      whatIfId,
      bronTeamId: bronTeam.id,
      naam: bronTeam.naam,
      categorie: bronTeam.categorie,
      kleur: bronTeam.kleur,
      teamType: bronTeam.teamType,
      niveau: bronTeam.niveau,
      volgorde: bronTeam.volgorde,
      spelers: {
        create: bronTeam.spelers.map((s: any) => ({
          spelerId: s.spelerId,
          statusOverride: s.statusOverride,
          notitie: s.notitie,
        })),
      },
      staf: {
        create: bronTeam.staf.map((s: any) => ({
          stafId: s.stafId,
          rol: s.rol,
        })),
      },
    },
    select: { id: true },
  });

  logger.info(`Bestaand team "${bronTeam.naam}" gekopieerd naar what-if ${whatIfId}`);
  return { id: created.id };
}

// ============================================================
// CANVAS-GEORIËNTEERDE WRAPPERS
// Accepteren werkversie-team-ids (canvas id) en lazy-creëren
// WhatIfTeam-records waar nodig. Gebruikt door de canvas-variant
// modus, waar het canvas werkversie-team-ids als team.id toont.
// ============================================================

async function resolveOfCreateWhatIfTeamVoorBron(
  whatIfId: string,
  bronTeamId: string
): Promise<string> {
  const bestaand = await prisma.whatIfTeam.findFirst({
    where: { whatIfId, bronTeamId },
    select: { id: true },
  });
  if (bestaand) return bestaand.id;
  const created = await kopieerBronTeam(whatIfId, bronTeamId);
  return created.id;
}

async function resolveWhatIfTeamId(whatIfId: string, canvasTeamId: string): Promise<string> {
  // canvasTeamId kan zijn:
  // (a) een werkversie-team-id → zoek of lazy-create WhatIfTeam via bronTeamId
  // (b) een al-bestaand WhatIfTeam.id (voor nieuwe what-if teams zonder bron)
  const alsWhatIfTeam = await prisma.whatIfTeam.findUnique({
    where: { id: canvasTeamId },
    select: { id: true, whatIfId: true },
  });
  if (alsWhatIfTeam && alsWhatIfTeam.whatIfId === whatIfId) {
    return alsWhatIfTeam.id;
  }
  return resolveOfCreateWhatIfTeamVoorBron(whatIfId, canvasTeamId);
}

/**
 * Verplaats een speler in een what-if op basis van canvas-team-ids.
 * Lazy-creëert WhatIfTeam-records voor nog niet gekopieerde werkversie-teams.
 */
export async function verplaatsSpelerInWhatIfViaCanvas(
  whatIfId: string,
  spelerId: string,
  vanCanvasTeamId: string | null,
  naarCanvasTeamId: string
): Promise<void> {
  await assertWhatIfBewerkbaarById(whatIfId);

  const naarWhatIfTeamId = await resolveWhatIfTeamId(whatIfId, naarCanvasTeamId);

  if (!vanCanvasTeamId) {
    // Toevoegen vanuit pool
    const bestaand = await prisma.whatIfTeamSpeler.findFirst({
      where: { whatIfTeamId: naarWhatIfTeamId, spelerId },
    });
    if (bestaand) return;
    await prisma.whatIfTeamSpeler.create({
      data: { whatIfTeamId: naarWhatIfTeamId, spelerId },
    });
    logger.info(`Speler ${spelerId} toegevoegd aan what-if team ${naarWhatIfTeamId} (via canvas)`);
    return;
  }

  const vanWhatIfTeamId = await resolveWhatIfTeamId(whatIfId, vanCanvasTeamId);
  if (vanWhatIfTeamId === naarWhatIfTeamId) return;

  await prisma.$transaction(async (txRaw: unknown) => {
    const tx = txRaw as typeof prisma;
    const plaatsing = await tx.whatIfTeamSpeler.findFirst({
      where: { whatIfTeamId: vanWhatIfTeamId, spelerId },
    });
    if (plaatsing) {
      await tx.whatIfTeamSpeler.delete({ where: { id: plaatsing.id } });
    }
    const bestaandInDoel = await tx.whatIfTeamSpeler.findFirst({
      where: { whatIfTeamId: naarWhatIfTeamId, spelerId },
    });
    if (!bestaandInDoel) {
      await tx.whatIfTeamSpeler.create({
        data: { whatIfTeamId: naarWhatIfTeamId, spelerId },
      });
    }
  });

  logger.info(
    `Speler ${spelerId} verplaatst in what-if ${whatIfId}: ${vanWhatIfTeamId} → ${naarWhatIfTeamId}`
  );
}

/**
 * Verwijder een speler uit een what-if team op basis van canvas-team-id.
 * Lazy-creëert een WhatIfTeam-record voor het werkversie-team als het
 * nog niet in de what-if zit (anders is er niets te verwijderen).
 */
export async function verwijderSpelerUitWhatIfViaCanvas(
  whatIfId: string,
  spelerId: string,
  vanCanvasTeamId: string
): Promise<void> {
  await assertWhatIfBewerkbaarById(whatIfId);

  const vanWhatIfTeamId = await resolveWhatIfTeamId(whatIfId, vanCanvasTeamId);

  const plaatsing = await prisma.whatIfTeamSpeler.findFirst({
    where: { whatIfTeamId: vanWhatIfTeamId, spelerId },
  });
  if (!plaatsing) return;
  await prisma.whatIfTeamSpeler.delete({ where: { id: plaatsing.id } });

  logger.info(`Speler ${spelerId} verwijderd uit what-if team ${vanWhatIfTeamId} (via canvas)`);
}

/**
 * Sla de canvas-positie van een team op binnen een what-if.
 * Posities worden opgeslagen als Record<canvasTeamId, {x,y}> in what-ifs.posities.
 * De werkversie wordt nooit aangeraakt.
 */
export async function slaWhatIfTeamPositieOp(
  whatIfId: string,
  canvasTeamId: string,
  x: number,
  y: number
): Promise<void> {
  await assertWhatIfBewerkbaarById(whatIfId);

  const huidig = await prisma.whatIf.findUniqueOrThrow({
    where: { id: whatIfId },
    select: { posities: true },
  });

  const huidigePosities = (huidig.posities ?? {}) as Record<string, { x: number; y: number }>;
  const nieuwePosities = {
    ...huidigePosities,
    [canvasTeamId]: { x: Math.round(x), y: Math.round(y) },
  };

  await prisma.whatIf.update({
    where: { id: whatIfId },
    data: { posities: nieuwePosities },
  });
}
