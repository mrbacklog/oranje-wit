import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@oranje-wit/database";

// Maak een verse client-instantie (niet de globale singleton) zodat het
// seed-script de DATABASE_URL leest die op het moment van aanroep actief is.
// max: 1 — single connection garandeert dat alle commits direct zichtbaar zijn
// voor volgende queries; voorkomt FK-visibility-gap op remote DB (Railway).
function maakSeedClient() {
  const url = process.env.DATABASE_URL ?? "";
  const pool = new Pool({ connectionString: url, max: 1 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = maakSeedClient();

export const REL_CODE_PREFIX = "9900";
export const TEAM_ID_PREFIX = "team-edge";
export const PEILDATUM_2026_2027 = new Date("2027-01-01"); // KNKV peildatum 1 januari

export function relCode(teamNr: number, volgnr: number): string {
  return `${REL_CODE_PREFIX}${String(teamNr).padStart(4, "0")}${String(volgnr).padStart(4, "0")}`;
}

export function teamId(nr: number): string {
  return `${TEAM_ID_PREFIX}-${String(nr).padStart(2, "0")}`;
}
