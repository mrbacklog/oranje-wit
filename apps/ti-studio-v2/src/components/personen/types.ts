/**
 * Gedeelde data-types voor de personen-pagina.
 * Afgeleid van Prisma, niet het Prisma-type zelf.
 */

export type MemoBadge = "open" | "bespreking" | "risico" | "opgelost" | "geen";

export type LeeftijdCategorie = "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior";

export interface SpelerRijData {
  id: string; // rel_code — React key + server action identifier
  roepnaam: string;
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
  leeftijdscategorie: LeeftijdCategorie;
  korfbalLeeftijd: string; // output van formatKorfbalLeeftijd()
  kadersSpelerId: string | null; // id van KadersSpeler-rij, nodig voor gezien-update
  kadersId: string;
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
