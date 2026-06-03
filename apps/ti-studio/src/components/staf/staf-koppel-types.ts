// Gedeelde types + constanten voor de staf↔team/selectie-koppeleditor.
// Gebruikt door de Personen → Staf pagina (StafOverzicht) én de werkbord
// StafPoolDrawer, zodat de [+]-koppelfunctie één code-werkelijkheid heeft.

export type StafDoelType = "team" | "selectie";

/** Eén koppeling van een staflid aan een team of (gebundelde) selectie. */
export interface StafKoppelingView {
  teamId: string; // doel-id: team-id óf selectiegroep-id
  teamNaam: string;
  kleur: string | null;
  rol: string;
  doelType: StafDoelType;
}

/** Minimaal staflid-object dat de koppeleditor nodig heeft. */
export interface StafKoppelStaf {
  id: string;
  naam: string;
  teams: StafKoppelingView[];
}

/** Een koppeldoel: een los team of een gebundelde selectie. */
export interface StafKoppelDoel {
  id: string;
  naam: string;
  kleur: string | null;
  volgorde: number;
  type: StafDoelType;
}

export const ROL_SUGGESTIES = [
  "Trainer/Coach",
  "Coach",
  "Trainer",
  "Assistent",
  "Verzorger",
  "Begeleider",
  "Manager",
];

export const KLEUR_DOT: Record<string, string> = {
  BLAUW: "#3b82f6",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  SENIOR: "#94a3b8",
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};
