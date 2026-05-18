import { prisma, teamId } from "./types";
import { logger } from "@oranje-wit/types";

/**
 * Sectie 1.11 — Canvas-posities voor teams en selectiegroepen.
 *
 * Layout volgens TC-voorkeur (top-down, links-rechts):
 *
 *   Rij 0:  [sg-senioren-a] [S3] [S4] [Rec] [MW1]
 *   Rij 1:  [sg-u19] [Rood-1] [Rood-2]
 *   Rij 2:  [sg-u17] [Oranje-1] [Oranje-2]
 *   Rij 3:  [sg-u15] [Geel-1] [Geel-2]
 *   Rij 4:  [Groen-1] [Groen-2]
 *   Rij 5:  [Blauw-1] [Blauw-2] [Kangoeroes]
 *   Rij 6:  [EDGE-LEEG] [EDGE-ONDER]
 *
 * Schrijft Versie.posities als Record<kaartKey, {x, y}>.
 * KaartKey-conventie (matchend met team-drag B1):
 *   - Solo team:           "team-{teamId}"
 *   - Selectiegroep-bundel: "sg-{groepId}"
 */

const VERSIE_ID = "versie-edge-actief";

// Layout-constanten
const KOL_BREEDTE = 320; // pixels (team-kaart ~280 + 40 gap)
const RIJ_HOOGTE = 360; // pixels (kaart ~320 + 40 gap)
const SG_BREEDTE_FACTOR = 1.8; // selectiekaart ~580px (1.8 × team-kaart)

function pos(kolom: number, rij: number): { x: number; y: number } {
  return { x: kolom * KOL_BREEDTE, y: rij * RIJ_HOOGTE };
}

function posNaSg(naSgKolom: number, rij: number): { x: number; y: number } {
  // Na een selectiegroep start de volgende kaart op kolom 1.8 (vanwege bredere selectiekaart)
  return {
    x: Math.round(SG_BREEDTE_FACTOR * KOL_BREEDTE) + naSgKolom * KOL_BREEDTE,
    y: rij * RIJ_HOOGTE,
  };
}

export async function seedPosities(): Promise<void> {
  logger.info("[seed-posities] starten");

  const posities: Record<string, { x: number; y: number }> = {
    // Rij 0: Senioren-rij
    "sg-sg-senioren-a": pos(0, 0),
    [`team-${teamId(3)}`]: posNaSg(0, 0), // S3
    [`team-${teamId(4)}`]: posNaSg(1, 0), // S4
    [`team-${teamId(5)}`]: posNaSg(2, 0), // Recreanten
    [`team-${teamId(6)}`]: posNaSg(3, 0), // MW1

    // Rij 1: U19 + Rood
    "sg-sg-u19": pos(0, 1),
    [`team-${teamId(13)}`]: posNaSg(0, 1), // Rood-1
    [`team-${teamId(14)}`]: posNaSg(1, 1), // Rood-2

    // Rij 2: U17 + Oranje
    "sg-sg-u17": pos(0, 2),
    [`team-${teamId(15)}`]: posNaSg(0, 2), // Oranje-1
    [`team-${teamId(16)}`]: posNaSg(1, 2), // Oranje-2

    // Rij 3: U15 + Geel
    "sg-sg-u15": pos(0, 3),
    [`team-${teamId(17)}`]: posNaSg(0, 3), // Geel-1
    [`team-${teamId(18)}`]: posNaSg(1, 3), // Geel-2

    // Rij 4: Groen (volledig links)
    [`team-${teamId(19)}`]: pos(0, 4),
    [`team-${teamId(20)}`]: pos(1, 4),

    // Rij 5: Blauw + Kangoeroes
    [`team-${teamId(21)}`]: pos(0, 5),
    [`team-${teamId(22)}`]: pos(1, 5),
    [`team-${teamId(23)}`]: pos(2, 5), // Kangoeroes

    // Rij 6: Edge-cases apart onderaan
    [`team-${teamId(24)}`]: pos(0, 6), // EDGE-LEEG
    [`team-${teamId(25)}`]: pos(1, 6), // EDGE-ONDER
  };

  await prisma.versie.update({
    where: { id: VERSIE_ID },
    data: { posities },
  });

  logger.info(`[seed-posities] klaar — ${Object.keys(posities).length} kaarten gepositioneerd`);
}
