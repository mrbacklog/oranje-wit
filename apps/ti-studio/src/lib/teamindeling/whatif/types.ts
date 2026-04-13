import type { TeamCategorie, Kleur, TeamType, SpelerStatus } from "@oranje-wit/database";

/** Samenvatting van een what-if voor de zijbalk-lijst */
export interface WhatIfSummary {
  id: string;
  vraag: string;
  status: string;
  aantalTeams: number;
  /** True als de werkindeling ondertussen gewijzigd is t.o.v. de basis */
  isStale: boolean;
  createdAt: Date;
}

/** Volledig what-if team met spelers en staf */
export interface WhatIfTeamData {
  id: string;
  bronTeamId: string | null;
  naam: string;
  categorie: TeamCategorie;
  kleur: Kleur | null;
  teamType: TeamType | null;
  volgorde: number;
  spelers: WhatIfTeamSpelerData[];
  staf: WhatIfTeamStafData[];
}

/** Speler in een what-if team */
export interface WhatIfTeamSpelerData {
  id: string;
  spelerId: string;
  statusOverride: SpelerStatus | null;
  notitie: string | null;
}

/** Staf in een what-if team */
export interface WhatIfTeamStafData {
  id: string;
  stafId: string;
  rol: string | null;
}

/** Delta tussen een werkindeling-team en de what-if-versie ervan */
export interface TeamDelta {
  teamNaam: string;
  bronTeamId: string | null;
  huidigAantal: number;
  nieuwAantal: number;
  verschil: number;
  isNieuw: boolean;
  spelersIn: string[];
  spelersUit: string[];
  /** Staf die erbij komt in de what-if */
  stafIn: string[];
  /** Staf die eruit gaat in de what-if */
  stafUit: string[];
  /** Huidig aantal stafleden in werkindeling */
  stafHuidig: number;
  /** Nieuw aantal stafleden in what-if */
  stafNieuw: number;
}

/** Samenvatting van de volledige impact van een what-if */
export interface ImpactSamenvatting {
  /** Teams die in de what-if zitten en gewijzigd zijn */
  gewijzigdeTeams: TeamDelta[];
  /** Teams die NIET in de what-if zitten maar wel geraakt worden (spelers kwijtraken) */
  impactTeams: TeamDelta[];
  /** Totaal aantal verplaatste spelers */
  totaalSpelersVerplaatst: number;
  /** Totaal aantal verplaatste stafleden */
  totaalStafVerplaatst: number;
  /** Aantal nieuwe teams in de what-if */
  nieuwTeams: number;
}

// ============================================================
// VALIDATIE TYPES
// ============================================================

import type { TeamValidatie, ValidatieMelding, BlauwdrukKaders } from "../validatie/types";

/** Volledige validatie-uitkomst voor een what-if */
export interface WhatIfValidatie {
  /** Per teamId (what-if team id) de team-validatie */
  teamValidaties: Map<string, TeamValidatie>;
  /** Cross-team meldingen (dubbele plaatsingen, etc.) */
  crossTeamMeldingen: ValidatieMelding[];
  /** Pins die geschonden worden */
  pinSchendingen: PinSchending[];
  /** Afwijkingen t.o.v. blauwdruk-kaders */
  kaderAfwijkingen: KaderAfwijking[];
  /** True als er harde fouten zijn die toepassen blokkeren */
  heeftHardefouten: boolean;
  /** True als er afwijkingen zijn die toelichting vereisen */
  heeftAfwijkingen: boolean;
}

/** Een pin die geschonden wordt door de what-if */
export interface PinSchending {
  pinId: string;
  type: string;
  beschrijving: string;
  /** Team waar de speler nu in staat (in de what-if of werkindeling) */
  huidigTeam: string | null;
  /** Team waar de speler volgens de pin zou moeten staan */
  verwachtTeam: string;
}

/** Afwijking van een blauwdruk-kader */
export interface KaderAfwijking {
  categorie: string;
  verwachtAantal: number;
  werkelijkAantal: number;
  verschil: number;
}
