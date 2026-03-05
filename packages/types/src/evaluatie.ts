// Evaluatie types — gedeeld tussen team-indeling en evaluatie app

/** Evaluatie score-structuur (uit Evaluatie.scores JSON) */
export interface EvaluatieScore {
  niveau?: number;
  inzet?: number;
  groei?: number;
  team_plezier?: number;
  team_plezier_toelichting?: string;
  team_ontwikkeling?: number;
  team_ontwikkeling_toelichting?: string;
  team_prestatie?: number;
  team_prestatie_toelichting?: string;
  team_naam?: string;
  speler_opmerkingen?: string;
}

export interface EvaluatieData {
  seizoen: string;
  ronde: number;
  type: string;
  scores: EvaluatieScore;
  opmerking: string | null;
  coach: string | null;
  teamNaam: string | null;
}

export interface TeamGemiddelde {
  niveau: number;
  inzet: number;
  groei: number;
  aantalSpelers: number;
}
