// apps/ti-studio-v2/src/lib/kader-mapping.ts

import { Doelgroep } from "@oranje-wit/database";
import type { TcKader } from "@/components/kader/types";

/**
 * Mapping van Prisma Doelgroep enum naar weergave-label.
 * Oplossing voor enum-mismatch: DB gebruikt ONTWIKKELHART, UI toont "Opleidingshart".
 * ALLE wordt niet als doelgroep-sectie getoond.
 */
export const DOELGROEP_LABEL: Record<Doelgroep, string> = {
  KWEEKVIJVER: "Kweekvijver",
  ONTWIKKELHART: "Opleidingshart",
  TOP: "Topsport",
  WEDSTRIJDSPORT: "Wedstrijdsport",
  KORFBALPLEZIER: "Korfbalplezier",
  ALLE: "Alle",
};

export const DOELGROEP_KLEUR: Record<Doelgroep, string> = {
  KWEEKVIJVER: "#22c55e",
  ONTWIKKELHART: "#f97316",
  TOP: "#8b5cf6",
  WEDSTRIJDSPORT: "#94a3b8",
  KORFBALPLEZIER: "#64748b",
  ALLE: "#6b7280",
};

/** Volgorde doelgroep-secties conform prototype layout (ALLE niet getoond). */
export const DOELGROEP_VOLGORDE: Doelgroep[] = [
  "WEDSTRIJDSPORT",
  "TOP",
  "ONTWIKKELHART",
  "KWEEKVIJVER",
  "KORFBALPLEZIER",
];

export type TeamtypeConfig = {
  id: string;
  label: string;
  categorie: string;
  kleurCss: string;
  leeftijdRange: string;
  spelvorm: string;
  doelgroep: Doelgroep;
  isBCategorie: boolean;
  isUTeam: boolean;
  knkvInfo: string;
};

export const TEAMTYPES: TeamtypeConfig[] = [
  {
    id: "SEN_A",
    label: "Senioren A",
    categorie: "Senioren",
    kleurCss: "#94a3b8",
    leeftijdRange: "19+ jaar",
    spelvorm: "8-tal",
    doelgroep: "WEDSTRIJDSPORT",
    isBCategorie: false,
    isUTeam: false,
    knkvInfo:
      "Paal 3,5m · Bal 5 · 2×30m · Max 8 wissels · Verplicht 4+4 · Vakwissel na 2 doelpunten",
  },
  {
    id: "SEN_B",
    label: "Senioren B",
    categorie: "Senioren",
    kleurCss: "#64748b",
    leeftijdRange: "19+ jaar",
    spelvorm: "8-tal",
    doelgroep: "KORFBALPLEZIER",
    isBCategorie: false,
    isUTeam: false,
    knkvInfo:
      "Paal 3,5m · Bal 5 · 2×30m · Onbeperkt wissels · Gender vrij · Vakwissel na 2 doelpunten",
  },
  {
    id: "U19",
    label: "U19",
    categorie: "A-categorie",
    kleurCss: "#8b5cf6",
    leeftijdRange: "< 19 jaar",
    spelvorm: "8-tal",
    doelgroep: "TOP",
    isBCategorie: false,
    isUTeam: true,
    knkvInfo: "Paal 3,5m · Bal 5 · 2×25m · Max 6 wissels · Verplicht 4+4 · Max leeftijd 19.00",
  },
  {
    id: "U17",
    label: "U17",
    categorie: "A-categorie",
    kleurCss: "#8b5cf6",
    leeftijdRange: "< 17 jaar",
    spelvorm: "8-tal",
    doelgroep: "TOP",
    isBCategorie: false,
    isUTeam: true,
    knkvInfo: "Paal 3,5m · Bal 5 · 2×25m · Max 6 wissels · Verplicht 4+4 · Max leeftijd 17.00",
  },
  {
    id: "U15",
    label: "U15",
    categorie: "A-categorie",
    kleurCss: "#8b5cf6",
    leeftijdRange: "< 15 jaar",
    spelvorm: "8-tal",
    doelgroep: "TOP",
    isBCategorie: false,
    isUTeam: true,
    knkvInfo: "Paal 3,5m · Bal 5 · 2×20m · Max 6 wissels · Verplicht 4+4 · Max leeftijd 15.00",
  },
  {
    id: "ROOD",
    label: "Rood",
    categorie: "B-8-tal",
    kleurCss: "#ef4444",
    leeftijdRange: "13–19 jaar",
    spelvorm: "8-tal",
    doelgroep: "KORFBALPLEZIER",
    isBCategorie: true,
    isUTeam: false,
    knkvInfo: "Paal 3,5m · Bal 4 · 2×20m · Vrije wissels · Leeftijdsspreiding max 3 jaar",
  },
  {
    id: "ORANJE",
    label: "Oranje",
    categorie: "B-8-tal",
    kleurCss: "#f97316",
    leeftijdRange: "11–14 jaar",
    spelvorm: "8-tal",
    doelgroep: "ONTWIKKELHART",
    isBCategorie: true,
    isUTeam: false,
    knkvInfo: "Paal 3,5m · Bal 4 · 2×20m · Vrije wissels · Leeftijdsspreiding max 3 jaar",
  },
  {
    id: "GEEL8",
    label: "Geel 8-tal",
    categorie: "B-8-tal",
    kleurCss: "#eab308",
    leeftijdRange: "9–12 jaar",
    spelvorm: "8-tal",
    doelgroep: "ONTWIKKELHART",
    isBCategorie: true,
    isUTeam: false,
    knkvInfo: "Paal 3,0m · Bal 4 · 2×15m · Vrije wissels · Leeftijdsspreiding max 3 jaar",
  },
  {
    id: "GEEL4",
    label: "Geel 4-tal",
    categorie: "B-4-tal",
    kleurCss: "#eab308",
    leeftijdRange: "9–12 jaar",
    spelvorm: "4-tal",
    doelgroep: "ONTWIKKELHART",
    isBCategorie: true,
    isUTeam: false,
    knkvInfo: "Paal 3,0m · Bal 4 · 2×12m · Vrije wissels · Leeftijdsspreiding max 3 jaar",
  },
  {
    id: "GROEN",
    label: "Groen",
    categorie: "B-4-tal",
    kleurCss: "#22c55e",
    leeftijdRange: "7–10 jaar",
    spelvorm: "4-tal",
    doelgroep: "KWEEKVIJVER",
    isBCategorie: true,
    isUTeam: false,
    knkvInfo: "Paal 2,5m · Bal 3 · 2×10m · Vrije wissels · Leeftijdsspreiding max 2 jaar",
  },
  {
    id: "BLAUW",
    label: "Blauw",
    categorie: "B-4-tal",
    kleurCss: "#3b82f6",
    leeftijdRange: "5–8 jaar",
    spelvorm: "4-tal",
    doelgroep: "KWEEKVIJVER",
    isBCategorie: true,
    isUTeam: false,
    knkvInfo: "Paal 2,5m · Bal 3 · 2×10m · Vrije wissels · Leeftijdsspreiding max 2 jaar",
  },
];

/** Categorie-beschrijving voor groep-header */
export const CATEGORIE_DESC: Record<string, string> = {
  Senioren: "19+ · 8-tal",
  "A-categorie": "Leeftijdsbegrensd · 8-tal",
  "B-8-tal": "Leeftijdsbandbreedte · Gender vrij",
  "B-4-tal": "Kleinveld · Kweekvijver + Opleidingshart",
};

/** Defaults voor teamtype kaders. */
export const TC_DEFAULTS: Record<string, TcKader> = {
  SEN_A: {
    teamMin: 8,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 6,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 6,
  },
  SEN_B: {
    teamMin: 10,
    teamIdeaal: 12,
    teamMax: 14,
    damesMin: 4,
    damesIdeaal: 6,
    damesMax: 8,
    herenMin: 4,
    herenIdeaal: 6,
    herenMax: 8,
  },
  U19: {
    teamMin: 8,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 6,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 6,
    maxLeeftijdPerSpeler: 19.0,
  },
  U17: {
    teamMin: 8,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 6,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 6,
    maxLeeftijdPerSpeler: 17.0,
  },
  U15: {
    teamMin: 8,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 6,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 6,
    maxLeeftijdPerSpeler: 15.0,
  },
  ROOD: {
    teamMin: 9,
    teamIdeaal: 11,
    teamMax: 13,
    damesMin: 2,
    damesIdeaal: 5,
    damesMax: 8,
    herenMin: 2,
    herenIdeaal: 5,
    herenMax: 8,
    gemLeeftijdMin: 13.4,
    gemLeeftijdMax: 18.5,
    bandbreedteMax: 3,
  },
  ORANJE: {
    teamMin: 9,
    teamIdeaal: 11,
    teamMax: 13,
    damesMin: 2,
    damesIdeaal: 5,
    damesMax: 8,
    herenMin: 2,
    herenIdeaal: 5,
    herenMax: 8,
    gemLeeftijdMin: 11.3,
    gemLeeftijdMax: 14.4,
    bandbreedteMax: 3,
  },
  GEEL8: {
    teamMin: 9,
    teamIdeaal: 11,
    teamMax: 13,
    damesMin: 2,
    damesIdeaal: 5,
    damesMax: 8,
    herenMin: 2,
    herenIdeaal: 5,
    herenMax: 8,
    gemLeeftijdMin: 9.2,
    gemLeeftijdMax: 12.1,
    bandbreedteMax: 3,
  },
  GEEL4: {
    teamMin: 4,
    teamIdeaal: 5,
    teamMax: 5,
    damesMin: 2,
    damesIdeaal: 3,
    damesMax: 4,
    herenMin: 2,
    herenIdeaal: 3,
    herenMax: 4,
    gemLeeftijdMin: 9.2,
    gemLeeftijdMax: 12.1,
    bandbreedteMax: 3,
  },
  GROEN: {
    teamMin: 4,
    teamIdeaal: 5,
    teamMax: 6,
    damesMin: 2,
    damesIdeaal: 3,
    damesMax: 4,
    herenMin: 2,
    herenIdeaal: 3,
    herenMax: 4,
    gemLeeftijdMin: 7.5,
    gemLeeftijdMax: 9.7,
    bandbreedteMax: 2,
  },
  BLAUW: {
    teamMin: 4,
    teamIdeaal: 5,
    teamMax: 6,
    damesMin: 2,
    damesIdeaal: 3,
    damesMax: 4,
    herenMin: 2,
    herenIdeaal: 3,
    herenMax: 4,
    gemLeeftijdMin: 5.5,
    gemLeeftijdMax: 8.2,
    bandbreedteMax: 2,
  },
};

export function mergeMetDefaults(
  opgeslagen: Record<string, unknown> | null
): Record<string, TcKader> {
  if (!opgeslagen) return { ...TC_DEFAULTS };
  const result: Record<string, TcKader> = { ...TC_DEFAULTS };
  for (const id of Object.keys(TC_DEFAULTS)) {
    if (opgeslagen[id] && typeof opgeslagen[id] === "object") {
      result[id] = { ...TC_DEFAULTS[id], ...(opgeslagen[id] as Partial<TcKader>) };
    }
  }
  return result;
}
