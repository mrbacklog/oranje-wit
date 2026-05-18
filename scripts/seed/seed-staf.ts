/**
 * seed-staf — 100 stafleden voor het werkseizoen.
 *
 * Schema:
 *   - id            STAF-001 t/m STAF-100 (deterministisch)
 *   - naam          "Roepnaam tussenvoegsel? Achternaam" (uit namen-pool, uniek)
 *   - rollen        array van rol-strings, mix per profiel
 *   - geboortejaar  1965-2005 (volwassenen)
 *   - email         50% kans
 *   - actief        95% true
 *
 * Idempotent: upsert op id.
 */
import { prisma } from "./types";
import { logger } from "@oranje-wit/types";
import { getUniekeNaam } from "./namen-pool";

// Rollen-pool uit het schema-commentaar
const ROLLEN_POOL = ["trainer", "assistent", "manager", "coordinator"] as const;

// 7 rol-profielen met realistische frequentie
const ROLPROFIELEN: ReadonlyArray<{ rollen: readonly string[]; gewicht: number }> = [
  { rollen: ["trainer"], gewicht: 35 },
  { rollen: ["assistent"], gewicht: 20 },
  { rollen: ["trainer", "assistent"], gewicht: 15 },
  { rollen: ["manager"], gewicht: 10 },
  { rollen: ["coordinator"], gewicht: 8 },
  { rollen: ["trainer", "coordinator"], gewicht: 7 },
  { rollen: ["manager", "coordinator"], gewicht: 5 },
];

const TOT_GEWICHT = ROLPROFIELEN.reduce((s, p) => s + p.gewicht, 0);

function kiesRollen(): string[] {
  let r = Math.random() * TOT_GEWICHT;
  for (const profiel of ROLPROFIELEN) {
    r -= profiel.gewicht;
    if (r <= 0) return [...profiel.rollen];
  }
  return [ROLLEN_POOL[0]];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function bouwEmail(roepnaam: string, achternaam: string): string {
  const slug = `${roepnaam}.${achternaam.replace(/\s+/g, "")}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w.]/g, "");
  return `${slug}@ckvoranjewit.nl`;
}

export async function seedStaf(aantal: number = 100): Promise<void> {
  logger.info(`[seed-staf] ${aantal} stafleden aanmaken`);

  

  for (let i = 1; i <= aantal; i++) {
    const id = `STAF-${String(i).padStart(3, "0")}`;
    const geslacht: "M" | "V" = Math.random() < 0.5 ? "M" : "V";
    const naam = getUniekeNaam(geslacht);
    if (!naam) {
      logger.warn(`[seed-staf] namen-pool uitgeput bij ${id} — sla over`);
      continue;
    }
    const naamStr = naam.tussenvoegsel
      ? `${naam.roepnaam} ${naam.tussenvoegsel} ${naam.achternaam}`
      : `${naam.roepnaam} ${naam.achternaam}`;

    await prisma.staf.upsert({
      where: { id },
      create: {
        id,
        naam: naamStr,
        geboortejaar: randInt(1965, 2005),
        email: Math.random() < 0.5 ? bouwEmail(naam.roepnaam, naam.achternaam) : null,
        rollen: kiesRollen(),
        actief: Math.random() < 0.95,
      },
      update: {},
    });
  }

  logger.info(`[seed-staf] klaar — ${aantal} stafleden`);
}
