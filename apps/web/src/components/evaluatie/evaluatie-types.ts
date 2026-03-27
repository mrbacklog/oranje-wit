export interface Speler {
  relCode: string;
  naam: string;
  geslacht: string;
}

export interface SpelerScore {
  relCode: string;
  niveau: number | null;
  inzet: number | null;
  groei: number | null;
  opmerking: string;
}

export interface TeamScore {
  plezier: number | null;
  plezierToelichting: string;
  ontwikkeling: number | null;
  ontwikkelingToelichting: string;
  prestatie: number | null;
  prestatieToelichting: string;
}
