import type { Seizoen } from "./index";
import { korfbalPeildatum } from "./korfballeeftijd";

/** Huidig seizoen waarvoor indelingen gemaakt worden. */
export const HUIDIG_SEIZOEN: Seizoen = "2025-2026";

/**
 * Peildatum voor het huidige seizoen.
 * Gebruik ALLEEN op plekken zonder scenario-context (personen-overzicht,
 * scouting-lijsten). Binnen een scenario: gebruik `korfbalPeildatum(scenario.seizoen)`.
 */
export const HUIDIGE_PEILDATUM: Date = korfbalPeildatum(HUIDIG_SEIZOEN);

/** Minimum aantal spelers van elk geslacht per team */
export const MIN_GENDER_PER_TEAM = 2;
