/**
 * Typen voor de read-only team-/selectie-presentatielaag (coverflow).
 * Fase 1 — data-laag. UI-componenten komen in fase 2.
 *
 * Alle datums zijn ISO-strings (serialisatiegrens server → client).
 * `relCode` is de enige stabiele speler-sleutel (Sportlink relatienummer).
 */

export type SpelerStatus =
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GEBLESSEERD"
  | "GAAT_STOPPEN"
  | "GESTOPT"
  | "NIEUW_POTENTIEEL"
  | "NIEUW_DEFINITIEF"
  | "ALGEMEEN_RESERVE"
  | "RECREANT"
  | "NIET_SPELEND";

/** Enkelvoudige speler in een presentatie-kaart. */
export interface PresentatieSpeler {
  /** Sportlink relatienummer — enige stabiele sleutel. */
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  geslacht: "V" | "M";
  /** ISO datum string (YYYY-MM-DD) of null. Client berekent korfballeeftijd. */
  geboortedatum: string | null;
  /** Fallback als geboortedatum ontbreekt. */
  geboortejaar: number;
  /** Foto-URL als /api/scouting/spelers/{relCode}/foto, of null. */
  fotoUrl: string | null;
  /** Effectieve status (override wint van Sportlink-basis). */
  status: SpelerStatus;
  /** Is dit seizoen nieuw ingestroomd. */
  isNieuw: boolean;
  /** Huidig competitieteam (uit Sportlink). */
  huidigTeam: string | null;
}

/** Staf-lid in een presentatie-kaart. */
export interface PresentatieStaf {
  stafId: string;
  naam: string;
  /** Rol in dit team of deze selectie. */
  rol: string;
}

/** Team-memo als opmerking op een presentatie-kaart. */
export interface PresentatieOpmerking {
  /** Bron van de opmerking, bijv. "MEMO". */
  bron: string;
  /** Type werkitem, bijv. "MEMO". */
  type: string;
  /** Status van het werkitem, bijv. "OPEN" | "IN_BESPREKING" | "AFGEHANDELD". */
  status: string;
  /** ISO-string van createdAt. */
  datum: string;
  /** Tekst: titel + beschrijving samengevoegd, of alleen titel. */
  tekst: string;
}

/**
 * Één kaart in de presentatie-carrousel.
 * Kan een regulier team zijn of een gebundelde selectie.
 */
export interface PresentatieTeam {
  id: string;
  naam: string;
  /** Lowercase kleur-token, bijv. "blauw" | "groen" | "geel" | "oranje" | "rood" | null. */
  kleur: string | null;
  /** Team-categorie, bijv. "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE". */
  teamCategorie: string | null;
  /** Viertal of achttal. */
  teamType: string | null;
  /** Poule/niveau omschrijving. */
  niveau: string | null;
  /** Sorteervolgorde binnen de versie. */
  volgorde: number;
  /** True als dit een gebundelde selectiegroep-kaart is. */
  isSelectie: boolean;
  /** True als de selectiegroep gebundeld is (pool-modus). */
  gebundeld: boolean;
  /** Naam van de selectiegroep, of null voor losse teams. */
  selectieNaam: string | null;
  /** Dameskant. */
  dames: PresentatieSpeler[];
  /** Herenkant. */
  heren: PresentatieSpeler[];
  staf: PresentatieStaf[];
  opmerkingen: PresentatieOpmerking[];
  /** Afgeleiden. */
  aantalDames: number;
  aantalHeren: number;
  /**
   * Gemiddelde korfballeeftijd berekend op de server (afgerond op 1 decimaal).
   * null als er geen spelers met geboortejaar zijn.
   */
  gemiddeldeLeeftijd: number | null;
  /** Aantal openstaande validatieaandachtspunten. */
  validatieCount: number;
  /** Aantal open memo's (OPEN of IN_BESPREKING). */
  openMemoCount: number;
}

/** Payload van getTeamsVoorPresentatie — inclusief peildatum voor client-berekeningen. */
export interface PresentatiePayload {
  teams: PresentatieTeam[];
  /** ISO-string van de korfbal-peildatum (31 december startjaar). Client gebruikt dit voor berekenKorfbalLeeftijd. */
  peildatum: string;
}
