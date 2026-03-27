/**
 * Lokale type-definities voor het werkbord.
 *
 * Het Werkitem Prisma-model is nog niet aangemaakt in het database-schema.
 * Deze types fungeren als placeholder totdat het model wordt toegevoegd.
 */

export type WerkitemType = "BESLUIT" | "STRATEGISCH" | "DATA" | "REGEL" | "TRAINER" | "SPELER";

export type WerkitemPrioriteit = "BLOCKER" | "HOOG" | "MIDDEL" | "LAAG" | "INFO";

export type WerkitemStatus =
  | "OPEN"
  | "IN_BESPREKING"
  | "OPGELOST"
  | "GEACCEPTEERD_RISICO"
  | "GEARCHIVEERD";

export type ActiepuntStatus = "OPEN" | "AFGEROND";

export type Besluitniveau = "BESTUUR" | "TC" | "DOELGROEP";

export type Doelgroep =
  | "TOP"
  | "KWEEK"
  | "OPLEIDINGSHART"
  | "KORFBALPLEZIER_JEUGD"
  | "KORFBALPLEZIER_SENIOREN";

export type Entiteit = "BELEID" | "SELECTIE" | "TEAM" | "STAF" | "SPELER";
