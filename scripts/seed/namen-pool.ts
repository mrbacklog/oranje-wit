/**
 * Grote namen-pool voor seed-scripts.
 * Garandeert unieke roepnaam+achternaam combinaties via een Set-tracker.
 *
 * Pool-grootte: 40V + 40M voornamen × 60 achternamen = 4800 unieke combos.
 * Tussenvoegsels zijn decoratief en tellen NIET mee voor uniciteit
 * (uniciteit = roepnaam + achternaam zonder tussenvoegsel).
 */

import { logger } from "@oranje-wit/types";

// -- Voornamen ----------------------------------------------------------------

export const VOORNAMEN_V: string[] = [
  "Yara", "Lotte", "Sanne", "Tess", "Sophie", "Emma", "Lisa", "Nina",
  "Floor", "Roos", "Inge", "Femke", "Manon", "Laura", "Anne",
  "Eva", "Iris", "Saar", "Lieke", "Noor", "Anouk", "Lise", "Maud",
  "Lara", "Robin", "Pien", "Mila", "Sofie", "Liv", "Bo",
  "Esmee", "Britt", "Janne", "Merel", "Lynn", "Sterre", "Renske",
  "Demi", "Hanne", "Cato",
];

export const VOORNAMEN_M: string[] = [
  "Mees", "Bram", "Lucas", "Daan", "Stijn", "Tom", "Luc", "Joep",
  "Pim", "Lars", "Tim", "Quint", "Jesse", "Niek", "Ruben",
  "Sven", "Jasper", "Noah", "Sam", "Thijs", "Levi", "Luuk",
  "Boris", "Wessel", "Bas", "Tijn", "Jurre", "Cas", "Floris",
  "Hidde", "Mart", "Sjors", "Teun", "Olivier", "Stef", "Roel",
  "Twan", "Kjeld", "Joost", "Rik",
];

export const ACHTERNAMEN: string[] = [
  "Bakker", "Visser", "Mulder", "Smit", "Heeren", "Janssens", "Pluim",
  "Timmer", "Dijkstra", "Peters", "Hendriks", "Vermeer", "Hoekstra", "Boer",
  "Jansen", "de Vries", "Meijer", "Bos", "de Boer", "Dekker",
  "Brouwer", "de Wit", "Veenstra", "van der Meer", "Postma", "Vermeulen",
  "Willems", "van Dam", "de Jong", "Kuipers", "Maas", "de Groot",
  "Janssen", "Koster", "Bouma", "van Leeuwen", "Schouten", "Verhoeven",
  "Driessen", "Aarts", "Nijhof", "Tiemens", "Snijders", "Heerma",
  "Reinders", "Kemper", "Bekker", "Vink", "Bouwman", "Klaassen",
  "van Aalst", "Bosma", "Hekkert", "Brinkhuis", "Snellen", "Krediet",
  "Vrolijk", "Cornelissen", "Stevens", "Roelofs",
];

// Geldige Nederlandse tussenvoegsels. "der" / "ten" / "te" zijn alleen als
// onderdeel van "van der" / "ten X" — nooit op zichzelf vóór een achternaam.
export const TUSSENVOEGSELS: Array<string | null> = [
  null, null, null, null, null, null, // ~60% geen tussenvoegsel
  "van", "van", "van",
  "de", "de", "de",
  "van der", "van der",
  "van de",
  "den",
];

// -- Unieke naam picker -------------------------------------------------------

export interface NaamResultFull {
  roepnaam: string;
  tussenvoegsel: string | null;
  /** achternaam zonder tussenvoegsel */
  achternaam: string;
}

// Module-level Set zodat ALLE seed-scripts (default-spelers, status-edge,
// leeftijd-edge, data-incomplete, multi-team, staf, etc) cross-script unieke
// namen krijgen. Orchestrator roept `resetUniekeNamen()` aan het begin.
const globaalUsedSet = new Set<string>();

export function resetUniekeNamen(): void {
  globaalUsedSet.clear();
}

export function getGedeeldeUsedSet(): Set<string> {
  return globaalUsedSet;
}

/**
 * Trekt een unieke roepnaam+achternaam combinatie uit de pool.
 * Uniciteit wordt bewaakt via `usedSet` (roepnaam + "·" + achternaam).
 * Tussenvoegsel telt NIET mee voor uniciteit.
 *
 * @param usedSet  Set die bijgehouden wordt over de gehele seed-run (default: module-state)
 * @param geslacht "M" of "V" — bepaalt welke voornamen gebruikt worden
 * @returns        NaamResultFull of null als de pool uitgeput is (>4800 spelers)
 */
export function getUniekeNaam(
  usedSetOrGeslacht: Set<string> | "M" | "V",
  geslachtArg?: "M" | "V"
): NaamResultFull | null {
  // Overload: getUniekeNaam("M") gebruikt module-state; oude signature blijft werken.
  const usedSet = typeof usedSetOrGeslacht === "string" ? globaalUsedSet : usedSetOrGeslacht;
  const geslacht = typeof usedSetOrGeslacht === "string" ? usedSetOrGeslacht : geslachtArg!;
  const vnamen = geslacht === "V" ? VOORNAMEN_V : VOORNAMEN_M;
  const maxPogingen = vnamen.length * ACHTERNAMEN.length;

  for (let poging = 0; poging < maxPogingen; poging++) {
    const roepnaam = vnamen[Math.floor(Math.random() * vnamen.length)];
    const achternaam = ACHTERNAMEN[Math.floor(Math.random() * ACHTERNAMEN.length)];
    const key = `${roepnaam}·${achternaam}`;

    if (!usedSet.has(key)) {
      usedSet.add(key);
      // Achternaam met ingebouwd tussenvoegsel (start met lowercase: "de Vries",
      // "van der Meer", "van Dam") krijgt geen extra losse tussenvoegsel — anders
      // ontstaat "Lieke de van der Meer".
      const heeftIngebouwd = /^[a-z]/.test(achternaam);
      const tussenvoegsel = heeftIngebouwd
        ? null
        : TUSSENVOEGSELS[Math.floor(Math.random() * TUSSENVOEGSELS.length)];
      return { roepnaam, tussenvoegsel, achternaam };
    }
  }

  // Ultieme fallback: suffix op achternaam (vrijwel onmogelijk met 4800-pool en <500 spelers)
  const roepnaam = vnamen[usedSet.size % vnamen.length];
  const achternaam = `${ACHTERNAMEN[usedSet.size % ACHTERNAMEN.length]}#${usedSet.size}`;
  logger.warn(`[namen-pool] pool bijna uitgeput — fallback suffix: ${roepnaam} ${achternaam}`);
  usedSet.add(`${roepnaam}·${achternaam}`);
  return { roepnaam, tussenvoegsel: null, achternaam };
}
