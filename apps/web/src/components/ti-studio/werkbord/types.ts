// apps/web/src/components/ti-studio/werkbord/types.ts
// Lokale types voor het werkbord — gebaseerd op bestaande types in components/teamindeling/scenario/types.ts

export type Geslacht = "V" | "M";
export type SpelerStatus = "BESCHIKBAAR" | "TWIJFELT" | "GAAT_STOPPEN" | "GESTOPT" | "AFGEMELD";

export type ZoomLevel = "compact" | "normaal" | "detail";
export type KaartFormaat = "viertal" | "achtal" | "selectie";
export type KnkvCategorie = "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior";

export type SpelerFilter = "zonder_team" | "ingedeeld" | "alle";

// Memo-patroon: status van een memo (open = actie vereist, gesloten = afgerond met besluit)
export type MemoStatus = "open" | "gesloten";

export interface MemoData {
  tekst: string; // UI: "Memo" — DB kolom: "notitie"
  memoStatus: MemoStatus;
  besluit: string | null;
}

// Team-configuratie beslisboom
export type TeamHoofdCategorie = "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE";
export type TeamLeeftijdsCat = "U15" | "U17" | "U19";

export interface TeamConfigUpdate {
  hoofdCategorie: TeamHoofdCategorie;
  kleur: KnkvCategorie | null; // alleen voor B_CATEGORIE
  niveau: TeamLeeftijdsCat | null; // alleen voor A_CATEGORIE
  teamType: "viertal" | "achtal" | null; // alleen voor B_CATEGORIE GEEL
}

export interface WerkbordSpeler {
  id: string;
  roepnaam: string;
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
  notitie: string | null;
  ussScore: number | null;
  gemiddeldeLeeftijd: number | null;
  validatieStatus: "ok" | "warn" | "err";
  validatieCount: number;
  // Team-configuratie velden (uit DB)
  teamCategorie: TeamHoofdCategorie;
  niveau: TeamLeeftijdsCat | null;
  selectieGroepId: string | null;
  selectieNaam: string | null;
  // Selectie-bundeling velden
  selectieDames: WerkbordSpelerInTeam[]; // spelers op selectie-niveau (geslacht V)
  selectieHeren: WerkbordSpelerInTeam[]; // spelers op selectie-niveau (geslacht M)
  gebundeld: boolean;
  // Memo-patroon velden
  memoStatus: MemoStatus;
  besluit: string | null;
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
  validatie: WerkbordValidatieItem[];
  werkindelingId: string;
  versieId: string;
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
