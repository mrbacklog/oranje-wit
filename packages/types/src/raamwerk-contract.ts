/**
 * Contracttypes voor het scouting-raamwerk.
 *
 * Deze types definiëren het contract tussen de beheer-app (raamwerk CRUD)
 * en de scouting-app (raamwerk lezen). Beide apps delen de database,
 * maar communiceren via deze contracttypes.
 */

/** Status van een raamwerkversie (spiegelt Prisma enum CatalogusStatus) */
export type RaamwerkStatusType = "CONCEPT" | "ACTIEF" | "GEARCHIVEERD";

/** Versie-metadata zoals de scouting-app die nodig heeft */
export interface RaamwerkVersieContract {
  id: string;
  seizoen: string;
  naam: string;
  status: RaamwerkStatusType;
}

/** Eén beoordelingsitem uit het raamwerk */
export interface RaamwerkItemContract {
  itemCode: string;
  pijler: string;
  label: string;
  vraagTekst: string;
  laag?: string | null;
  isKern: boolean;
  categorie?: string | null;
  observatie?: string | null;
}

/** Het volledige contract dat de scouting-app verwacht van een raamwerkgroep */
export interface RaamwerkContract {
  seizoen: string;
  band: string;
  schaalType:
    | "duim"
    | "smiley"
    | "sterren"
    | "slider"
    | "ja_nogniet"
    | "goed_oke_nogniet"
    | "observatie";
  maxScore: number;
  items: RaamwerkItemContract[];
}
