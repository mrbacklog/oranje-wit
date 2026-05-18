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

export const TUSSENVOEGSELS: Array<string | null> = [
  null, null, null, null, // ~50% geen tussenvoegsel
  "van", "van", "de", "de",
  "van der", "van de",
  "ten", "te",
  "der", "den",
];

// -- Unieke naam picker -------------------------------------------------------

export interface NaamResultFull {
  roepnaam: string;
  tussenvoegsel: string | null;
  /** achternaam zonder tussenvoegsel */
  achternaam: string;
}

/**
 * Trekt een unieke roepnaam+achternaam combinatie uit de pool.
 * Uniciteit wordt bewaakt via `usedSet` (roepnaam + "·" + achternaam).
 * Tussenvoegsel telt NIET mee voor uniciteit.
 *
 * @param usedSet  Set die bijgehouden wordt over de gehele seed-run
 * @param geslacht "M" of "V" — bepaalt welke voornamen gebruikt worden
 * @returns        NaamResultFull of null als de pool uitgeput is (>4800 spelers)
 */
export function getUniekeNaam(
  usedSet: Set<string>,
  geslacht: "M" | "V"
): NaamResultFull | null {
  const vnamen = geslacht === "V" ? VOORNAMEN_V : VOORNAMEN_M;
  const maxPogingen = vnamen.length * ACHTERNAMEN.length;

  for (let poging = 0; poging < maxPogingen; poging++) {
    const roepnaam = vnamen[Math.floor(Math.random() * vnamen.length)];
    const achternaam = ACHTERNAMEN[Math.floor(Math.random() * ACHTERNAMEN.length)];
    const key = `${roepnaam}·${achternaam}`;

    if (!usedSet.has(key)) {
      usedSet.add(key);
      const tussenvoegsel =
        TUSSENVOEGSELS[Math.floor(Math.random() * TUSSENVOEGSELS.length)];
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
