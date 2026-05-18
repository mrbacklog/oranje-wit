/**
 * Sectie 1.8 — Fictieve Nederlandse namen-pool.
 * Genereert deterministische namen op basis van rel_code als seed.
 *
 * Verdeling:
 *   80% standaard (vnamen + achternamen, 30% met tussenvoegsel)
 *   10% diakritisch + apostrof
 *    5% streepjesnamen
 *    3% lengte-extremen
 *    2% naam-collisies (zelfde voor+achternaam, ander rel_code)
 *
 * OPMERKING: RANDOM_NAAM() is deterministisch maar garandeert GEEN uniciteit
 * bij grote aantallen spelers. Gebruik voor bulk-seeding getUniekeNaam() uit
 * namen-pool.ts.
 */

import { VOORNAMEN_V, VOORNAMEN_M, ACHTERNAMEN, TUSSENVOEGSELS } from "./namen-pool";

// -- Speciale naam-pools (edge-case categorieën) ------------------------------

// Diakritisch + apostrof
const VOORNAMEN_DIAK_V = ["Renée", "Noëlle", "Zoë", "Léa", "Anouk"];
const VOORNAMEN_DIAK_M = ["Léon", "Iñaki", "Quint", "Kévin", "André"];
const ACHTERNAMEN_DIAK = [
  "Möller",
  "García",
  "Çelik",
  "Brugière",
  "d'Hondt",
  "d'Anvers",
  "O'Brien",
];

// Streepjesnamen
const VOORNAMEN_STREEP_V = ["Eva-Marie", "Anne-Sophie", "Marie-Claire"];
const VOORNAMEN_STREEP_M = ["Jan-Willem", "Pieter-Jan", "Mark-Jan"];
const ACHTERNAMEN_STREEP = ["Jansen-de Vries", "Bakker-Smits", "van der Berg-Mulder"];

// Lengte-extremen
const VOORNAMEN_LANG_V = ["Alexandrina-Maximiliana"];
const VOORNAMEN_LANG_M = ["M"];
const ACHTERNAMEN_LANG = ["Li", "Vandenberghe-Vanderhaeghen"];

// Naam-collisies: zelfde naam, ander rel_code
const COLLISION_NAMEN = [
  { roepnaam: "Sanne", tussenvoegsel: null, achternaam: "Bakker" },
  { roepnaam: "Tom", tussenvoegsel: null, achternaam: "Visser" },
];

// -- Deterministische pick via lineaire seed ---------------------------------

function seed(relCode: string): number {
  let h = 0;
  for (let i = 0; i < relCode.length; i++) {
    h = (h * 31 + relCode.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(arr: T[], s: number): T {
  return arr[s % arr.length];
}

// -- Hoofdfunctie: RANDOM_NAAM -----------------------------------------------

export interface NaamResult {
  roepnaam: string;
  /**
   * Volledige achternaam inclusief eventueel tussenvoegsel.
   * Speler-model heeft geen apart tussenvoegsel-veld.
   */
  achternaam: string;
}

/**
 * Geeft deterministisch een naam op basis van rel_code.
 * Categorie-verdeling is hardcoded per spec 1.8.
 *
 * rel_code mod 100:
 *   0–79  → standaard (incl. tussenvoegsel ~30%)
 *   80–89 → diakritisch / apostrof
 *   90–94 → streepje
 *   95–97 → lengte-extremen
 *   98–99 → naam-collisie
 *
 * Let op: deterministisch maar NIET uniek bij grote aantallen.
 * Gebruik getUniekeNaam() uit namen-pool.ts voor bulk-seeding.
 */
export function RANDOM_NAAM(relCode: string, geslacht: "M" | "V"): NaamResult {
  const s = seed(relCode);
  const bucket = s % 100;

  // Collisie-namen (2%)
  if (bucket >= 98) {
    const c = COLLISION_NAMEN[(s >> 8) % COLLISION_NAMEN.length];
    return { roepnaam: c.roepnaam, achternaam: c.achternaam };
  }

  // Lengte-extremen (3%)
  if (bucket >= 95) {
    const vnamen = geslacht === "V" ? VOORNAMEN_LANG_V : VOORNAMEN_LANG_M;
    return {
      roepnaam: pick(vnamen, s >> 4),
      achternaam: pick(ACHTERNAMEN_LANG, (s >> 8) % ACHTERNAMEN_LANG.length),
    };
  }

  // Streepjesnamen (5%)
  if (bucket >= 90) {
    const vnamen = geslacht === "V" ? VOORNAMEN_STREEP_V : VOORNAMEN_STREEP_M;
    return {
      roepnaam: pick(vnamen, s >> 4),
      achternaam: pick(ACHTERNAMEN_STREEP, (s >> 8) % ACHTERNAMEN_STREEP.length),
    };
  }

  // Diakritisch + apostrof (10%)
  if (bucket >= 80) {
    const vnamen = geslacht === "V" ? VOORNAMEN_DIAK_V : VOORNAMEN_DIAK_M;
    return {
      roepnaam: pick(vnamen, s >> 4),
      achternaam: pick(ACHTERNAMEN_DIAK, (s >> 8) % ACHTERNAMEN_DIAK.length),
    };
  }

  // Standaard (80%) — gebruik de grote pool uit namen-pool.ts
  const vnamen = geslacht === "V" ? VOORNAMEN_V : VOORNAMEN_M;
  const roepnaam = pick(vnamen, s >> 4);
  const basisAchternaam = pick(ACHTERNAMEN, (s >> 8) % ACHTERNAMEN.length);

  // ~30% kans op tussenvoegsel — opgenomen in achternaam-string
  const metTussenvoegsel = (s >> 16) % 10 < 3;
  const tussenvoegselOpties = TUSSENVOEGSELS.filter((t) => t !== null) as string[];
  const achternaam = metTussenvoegsel
    ? `${pick(tussenvoegselOpties, (s >> 20) % tussenvoegselOpties.length)} ${basisAchternaam}`
    : basisAchternaam;

  return { roepnaam, achternaam };
}
