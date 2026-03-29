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
}
