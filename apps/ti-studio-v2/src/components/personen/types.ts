/**
 * Gedeelde data-types voor de personen-pagina.
 * Afgeleid van Prisma, niet het Prisma-type zelf.
 */

export type MemoBadge = "open" | "bespreking" | "risico" | "opgelost" | "geen";

export type LeeftijdCategorie =
  | "kangoeroe"
  | "blauw"
  | "groen"
  | "geel"
  | "oranje"
  | "rood"
  | "senior";

/**
 * Werkitem-detail voor weergave in SpelerDialog werkitems-tab.
 * Lichter dan het volledige Werkitem-model — alleen wat de tab toont.
 */
export interface SpelerWerkitemDetail {
  id: string;
  titel: string;
  beschrijving: string | null;
  status: import("@oranje-wit/database").WerkitemStatus;
  prioriteit: string; // "HOOG" | "MIDDEL" | "LAAG" — vrije string vanuit Prisma
  type: string; // "MEMO" | …
  auteurNaam: string | null;
  createdAt: Date;
}

export interface SpelerRijData {
  id: string; // rel_code — React key + server action identifier
  roepnaam: string;
  tussenvoegsel: string | null;
  achternaam: string;
  geslacht: "M" | "V";
  geboortedatum: Date | null;
  geboortejaar: number;
  status: string; // SpelerStatus enum value
  gezienStatus: string; // GezienStatus enum value
  huidigTeam: string | null; // uit Speler.huidig JSON
  indelingTeamNaam: string | null; // uit actieve Versie TeamSpeler
  indelingTeamId: string | null;
  heeftOpenMemo: boolean;
  memoBadge: MemoBadge;
  memoStatus: import("@oranje-wit/database").WerkitemStatus | null; // hoogste actieve WerkitemStatus
  leeftijdscategorie: LeeftijdCategorie;
  leeftijd: number; // exacte korfbal-leeftijd als decimaal getal
  korfbalLeeftijd: string; // output van formatKorfbalLeeftijd()
  isNieuw: boolean; // nieuw lid (lidSinds >= seizoenStart)
  hasFoto: boolean; // heeft een foto in de foto-store
  kadersSpelerId: string | null; // id van KadersSpeler-rij, nodig voor gezien-update
  kadersId: string;
  // ── Velden voor SpelerDialog-tabs (optioneel; tabel-mapper laat ze leeg, dialog-data-loader vult ze) ──
  lidSinds?: string | null; // ISO datum-string ("2018-09-02")
  seizoenenActief?: number | null; // Speler.seizoenenActief
  laatstGezien?: Date | null; // KadersSpeler.updatedAt of GezienHistorie.gezienOp
  werkitemsDetail?: SpelerWerkitemDetail[]; // detail voor werkitems-tab
}

export interface StafRijData {
  id: string; // Staf.id (stafCode: STAF-001)
  naam: string;
  rollen: string[]; // globale rollen
  teamKoppelingen: Array<{
    teamId: string;
    teamNaam: string;
    teamKleur: string | null;
    rol: string;
  }>;
  heeftOpenMemo: boolean;
  memoBadge: MemoBadge;
  email: string | null;
  geboortejaar: number | null;
}

export interface ReserveringRijData {
  id: string;
  titel: string;
  geslacht: "M" | "V";
  teamId: string | null;
  teamNaam: string | null;
}
