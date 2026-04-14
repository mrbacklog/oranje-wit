// Gedeelde types voor het Oranje Wit ecosysteem
// Worden aangevuld naarmate de apps groeien

export type Seizoen = `${number}-${number}`; // "2025-2026"

export type Geslacht = "M" | "V";

export type Kleur = "blauw" | "groen" | "geel" | "oranje" | "rood";

export type Categorie = "a" | "b";

export type SpelerStatusType = "beschikbaar" | "twijfelt" | "gaat_stoppen" | "nieuw";

export type Ernst = "kritiek" | "aandacht" | "op_koers";

export * from "./constanten";
export * from "./api";
export * from "./api-response";
export * from "./evaluatie";
export * from "./korfballeeftijd";
export * from "./leeftijdsgroep-config";
export * from "./score-model";
export * from "./score-model-v2";
export * from "./clearance";
export * from "./raamwerk-contract";
export * from "./seizoen-contract";
export { logger } from "./logger";
export { validateEnv, type EnvVars } from "./env";
