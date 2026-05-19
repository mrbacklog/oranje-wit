import { prisma, teamId } from "./types";
import { logger } from "@oranje-wit/types";

/**
 * Sectie 1.11 — Canvas-posities voor teams en selectiegroepen.
 *
 * Layout volgens TC-voorkeur (top-down, links-rechts):
 *
 *   Rij 0:  [sg-senioren-a 480px] [S3 380] [S4 380] [Rec 380] [MW1 380]
 *   Rij 1:  [sg-u19 720px]        [Rood-1 380] [Rood-2 380]
 *   Rij 2:  [sg-u17 720px]        [Oranje-1 380] [Oranje-2 380]
 *   Rij 3:  [sg-u15 720px]        [Geel-1 380] [Geel-2 380]
 *   Rij 4:  [Groen-1 220] [Groen-2 220]
 *   Rij 5:  [Blauw-1 220] [Blauw-2 220] [Kangoeroes 220]
 *   Rij 6:  [EDGE-LEEG 380] [EDGE-ONDER 380]
 *
 * Schrijft Versie.posities als Record<kaartKey, {x, y}>.
 * KaartKey-conventie (matchend met team-drag B1):
 *   - Solo team:           "team-{teamId}"
 *   - Selectiegroep-bundel: "sg-{groepId}"
 */

const VERSIE_ID = "versie-edge-actief";

// Exacte breedtes uit globals.css + SelectieKaart.tsx (regel 569)
const BR_VIERTAL = 220;
const BR_ACHTTAL = 380;
const BR_SG_GEBUNDELD = 480;
const BR_SG_ONGEBUNDELD = 720; // 2 teams: max(720, 2*360)

const GAP_X = 40;
const RIJ_HOOGTE = 440; // ruim genoeg voor compact-mode kaart (~360-400px)

interface Plaatsing {
  key: string;
  breedte: number;
}

function plaatsRij(
  plaatsingen: Plaatsing[],
  rij: number
): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {};
  let xCursor = 0;
  const y = rij * RIJ_HOOGTE;
  for (const p of plaatsingen) {
    result[p.key] = { x: xCursor, y };
    xCursor += p.breedte + GAP_X;
  }
  return result;
}

export async function seedPosities(): Promise<void> {
  logger.info("[seed-posities] starten");

  const posities: Record<string, { x: number; y: number }> = {
    // Rij 0: Senioren-rij — sg-senioren-a (gebundeld) + 4× ACHTTAL
    ...plaatsRij(
      [
        { key: "sg-sg-senioren-a", breedte: BR_SG_GEBUNDELD },
        { key: `team-${teamId(3)}`, breedte: BR_ACHTTAL }, // S3
        { key: `team-${teamId(4)}`, breedte: BR_ACHTTAL }, // S4
        { key: `team-${teamId(5)}`, breedte: BR_ACHTTAL }, // Recreanten
        { key: `team-${teamId(6)}`, breedte: BR_ACHTTAL }, // MW1
      ],
      0
    ),

    // Rij 1: U19 (ongebundeld) + Rood
    ...plaatsRij(
      [
        { key: "sg-sg-u19", breedte: BR_SG_ONGEBUNDELD },
        { key: `team-${teamId(13)}`, breedte: BR_ACHTTAL }, // Rood-1
        { key: `team-${teamId(14)}`, breedte: BR_ACHTTAL }, // Rood-2
      ],
      1
    ),

    // Rij 2: U17 (ongebundeld) + Oranje
    ...plaatsRij(
      [
        { key: "sg-sg-u17", breedte: BR_SG_ONGEBUNDELD },
        { key: `team-${teamId(15)}`, breedte: BR_ACHTTAL }, // Oranje-1
        { key: `team-${teamId(16)}`, breedte: BR_ACHTTAL }, // Oranje-2
      ],
      2
    ),

    // Rij 3: U15 (ongebundeld) + Geel
    ...plaatsRij(
      [
        { key: "sg-sg-u15", breedte: BR_SG_ONGEBUNDELD },
        { key: `team-${teamId(17)}`, breedte: BR_ACHTTAL }, // Geel-1
        { key: `team-${teamId(18)}`, breedte: BR_ACHTTAL }, // Geel-2
      ],
      3
    ),

    // Rij 4: Groen (VIERTAL)
    ...plaatsRij(
      [
        { key: `team-${teamId(19)}`, breedte: BR_VIERTAL }, // Groen-1
        { key: `team-${teamId(20)}`, breedte: BR_VIERTAL }, // Groen-2
      ],
      4
    ),

    // Rij 5: Blauw + Kangoeroes (VIERTAL)
    ...plaatsRij(
      [
        { key: `team-${teamId(21)}`, breedte: BR_VIERTAL }, // Blauw-1
        { key: `team-${teamId(22)}`, breedte: BR_VIERTAL }, // Blauw-2
        { key: `team-${teamId(23)}`, breedte: BR_VIERTAL }, // Kangoeroes
      ],
      5
    ),

    // Rij 6: Edge-cases apart onderaan
    ...plaatsRij(
      [
        { key: `team-${teamId(24)}`, breedte: BR_ACHTTAL }, // EDGE-LEEG
        { key: `team-${teamId(25)}`, breedte: BR_ACHTTAL }, // EDGE-ONDER
      ],
      6
    ),
  };

  await prisma.versie.update({
    where: { id: VERSIE_ID },
    data: { posities },
  });

  logger.info(`[seed-posities] klaar — ${Object.keys(posities).length} kaarten gepositioneerd`);
}
