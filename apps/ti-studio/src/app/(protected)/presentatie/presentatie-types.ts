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
  rolLabel?: string | null;
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
 * Eén lidteam binnen een ongecombineerde selectie-kaart.
 * Alleen aanwezig als soort === "selectie" && gebundeld === false.
 */
export interface PresentatieLidTeam {
  teamId: string;
  naam: string;
  kleur: string | null;
  dames: PresentatieSpeler[];
  heren: PresentatieSpeler[];
}

/**
 * Één kaart in de presentatie-carrousel.
 * soort === "team"     → regulier los team
 * soort === "selectie" → selectiegroep-kaart (gebundeld of ongecombineerd)
 */
export interface PresentatieTeam {
  id: string;
  naam: string;
  /** Lowercase kleur-token, bijv. "blauw" | "groen" | "geel" | "oranje" | "rood" | null. */
  kleur: string | null;
  /** Team-categorie, bijv. "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE". */
  teamCategorie: string | null;
  /** "viertal" | "achttal" — alleen voor losse teams. */
  teamType: string | null;
  /** Poule/niveau omschrijving. */
  niveau: string | null;
  /** Sorteervolgorde binnen de versie. */
  volgorde: number;
  /** Onderscheid los team vs. selectie-kaart. */
  soort: "team" | "selectie";
  /**
   * Alleen relevant als soort === "selectie":
   * true  = gebundelde pool (spelers/staf op selectiegroep-niveau)
   * false = ongecombineerd (spelers/staf per lidteam, zichtbaar via `leden`)
   */
  gebundeld: boolean;
  /**
   * Dameskant.
   * Los team of gebundelde selectie: directe spelerslijst.
   * Ongecombineerde selectie: samengevoegde set van alle lidteams (voor aggregaties).
   */
  dames: PresentatieSpeler[];
  /** Herenkant — zelfde semantiek als dames. */
  heren: PresentatieSpeler[];
  /**
   * Per-lidteam uitsplitsing.
   * Alleen gevuld bij soort === "selectie" && gebundeld === false.
   * Leeg array voor losse teams en gebundelde selecties.
   */
  leden: PresentatieLidTeam[];
  /** Aanwezige staf (geen lege plaatsen). */
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
