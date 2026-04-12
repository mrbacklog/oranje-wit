// apps/web/src/components/ti-studio/werkbord/types.ts
// Lokale types voor het werkbord — gebaseerd op bestaande types in components/teamindeling/scenario/types.ts

export type Geslacht = "V" | "M";
export type SpelerStatus =
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GEBLESSEERD"
  | "GAAT_STOPPEN"
  | "GESTOPT"
  | "AFGEMELD"
  | "ALGEMEEN_RESERVE";

export type ZoomLevel = "compact" | "normaal" | "detail";
export type KaartFormaat = "viertal" | "achtal" | "selectie";
export type KnkvCategorie = "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior";

export type SpelerFilter = "zonder_team" | "ingedeeld" | "alle";

// Team-configuratie beslisboom
export type TeamHoofdCategorie = "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE";
export type TeamLeeftijdsCat = "U15" | "U17" | "U19";
export type TeamSeniorenCategorie = "A" | "B"; // A = topsport/wedstrijdsport, B = recreant/korfbalplezier
export type TeamNiveau = TeamLeeftijdsCat | TeamSeniorenCategorie;

export interface TeamConfigUpdate {
  hoofdCategorie: TeamHoofdCategorie;
  kleur: KnkvCategorie | null; // alleen voor B_CATEGORIE
  niveau: TeamNiveau | null; // A_CATEGORIE → U15/U17/U19, SENIOREN → A/B
  teamType: "viertal" | "achtal" | null; // alleen voor B_CATEGORIE GEEL
}

export interface WerkbordSpeler {
  id: string;
  roepnaam: string;
  tussenvoegsel: string | null;
  achternaam: string;
  geboortejaar: number;
  geboortedatum: string | null;
  geslacht: Geslacht;
  status: SpelerStatus;
  rating: number | null;
  notitie: string | null;
  afmelddatum: string | null;
  teamId: string | null;
  gepind: boolean;
  isNieuw: boolean;
  openMemoCount: number;
  huidigTeam: string | null;
  ingedeeldTeamNaam: string | null;
  selectieGroepId: string | null; // null = in team of vrij
}

export interface WerkbordSpelerInTeam {
  id: string;
  spelerId: string;
  speler: WerkbordSpeler;
  notitie: string | null;
}

export interface WerkbordStafInTeam {
  id: string;
  stafId: string;
  naam: string;
  rol: string;
}

export interface WerkbordStafTeamrol {
  teamId: string;
  teamNaam: string;
  kleur: string;
  rol: string;
}

export interface WerkbordStaf {
  id: string;
  naam: string;
  rollen: string[]; // globale rollen uit Staf.rollen
  teams: WerkbordStafTeamrol[]; // per team welke rol
}

export interface WerkbordReservering {
  id: string;
  titel: string;
  geslacht: Geslacht;
  teamId: string | null;
  ingedeeldTeamNaam: string | null;
}

// Werkitem als memo — vervangt notitie/memoStatus/besluit op Team/Speler/Staf
export interface WerkbordWerkitem {
  id: string;
  titel: string | null;
  beschrijving: string;
  type: string;
  status: string; // WerkitemStatus: OPEN | IN_BESPREKING | OPGELOST | GEACCEPTEERD_RISICO | GEARCHIVEERD
  prioriteit: string; // WerkitemPrioriteit: BLOCKER | HOOG | MIDDEL | LAAG | INFO
  volgorde: number;
  resolutie: string | null;
  createdAt: string; // ISO string
}

export interface WerkbordTeam {
  id: string;
  naam: string;
  categorie: string;
  kleur: KnkvCategorie;
  formaat: KaartFormaat;
  volgorde: number;
  canvasX: number;
  canvasY: number;
  dames: WerkbordSpelerInTeam[];
  heren: WerkbordSpelerInTeam[];
  staf: WerkbordStafInTeam[];
  ussScore: number | null;
  gemiddeldeLeeftijd: number | null;
  validatieStatus: "ok" | "warn" | "err";
  validatieCount: number;
  // Team-configuratie velden (uit DB)
  teamCategorie: TeamHoofdCategorie;
  niveau: TeamNiveau | null;
  selectieGroepId: string | null;
  selectieNaam: string | null;
  // Selectie-bundeling velden
  selectieDames: WerkbordSpelerInTeam[]; // spelers op selectie-niveau (geslacht V)
  selectieHeren: WerkbordSpelerInTeam[]; // spelers op selectie-niveau (geslacht M)
  gebundeld: boolean;
  // Werkitems (memos, actiepunten)
  werkitems: WerkbordWerkitem[];
  openMemoCount: number;
}

export interface WerkbordValidatieItem {
  teamId: string;
  type: "ok" | "warn" | "err";
  regel: string;
  beschrijving: string;
  laag?: "KNKV" | "TC"; // optioneel — ontbreekt = onbekend
}

export interface WerkbordState {
  teams: WerkbordTeam[];
  alleSpelers: WerkbordSpeler[];
  alleStaf: WerkbordStaf[];
  alleReserveringen: WerkbordReservering[];
  validatie: WerkbordValidatieItem[];
  werkindelingId: string;
  versieId: string;
  kadersId: string;
  seizoen: string;
  naam: string;
  status: "concept" | "definitief";
  versieNummer: number;
  versieNaam: string | null;
  totalSpelers: number;
  ingeplandSpelers: number;
}

export interface TiStudioShellProps {
  initieleState: WerkbordState;
  gebruikerEmail: string;
}

export interface ValidatieUpdate {
  teamId: string;
  items: WerkbordValidatieItem[];
  status: "ok" | "warn" | "err";
  count: number;
}

export type VersiesDrawerConfirm =
  | {
      type: "promoveer-whatif";
      whatIfId: string;
      vraag: string;
      basisVersieNummer: number;
    }
  | {
      type: "herstel-versie";
      versieId: string;
      nummer: number;
      naam: string | null;
    }
  | { type: "verwijder-versie"; versieId: string; nummer: number }
  | { type: "archiveer-whatif"; whatIfId: string; vraag: string };
