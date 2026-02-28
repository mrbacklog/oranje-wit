import type { Seizoen } from "./index";

/** Peiljaar voor korfballeeftijd (31-12 van dit jaar) */
export const PEILJAAR = 2026;

/** Huidig seizoen waarvoor indelingen gemaakt worden */
export const HUIDIG_SEIZOEN: Seizoen = "2025-2026";

/** Peildatum: 31 december van het peiljaar */
export const PEILDATUM = new Date(PEILJAAR, 11, 31);

/** Minimum aantal spelers van elk geslacht per team */
export const MIN_GENDER_PER_TEAM = 2;
