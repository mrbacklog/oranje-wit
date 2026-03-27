import { PEILJAAR } from "@oranje-wit/types";

/**
 * Doorstroom-signalering: detecteert spelers die van categorie
 * moeten wisselen op basis van leeftijd en KNKV-regels.
 */

export interface DoorstroomSignalering {
  spelerId: string;
  type: DoorstroomType;
  beschrijving: string;
}

export type DoorstroomType =
  | "VERLAAT_U15"
  | "VERLAAT_U17"
  | "VERLAAT_U19"
  | "NAAR_SENIOREN"
  | "VERLAAT_KLEUR"
  | "INSTROOMT_U15"
  | "INSTROOMT_U17"
  | "INSTROOMT_U19";

interface SpelerInput {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  huidig: {
    kleur?: string | null;
    a_categorie?: string | null;
    team?: string | null;
  } | null;
}

/** A-categorie leeftijdsbanden (korfballeeftijd op 31 dec peiljaar). */
const A_CAT_BANDEN: Record<string, { min: number; max: number }> = {
  U15: { min: 13, max: 14 },
  U17: { min: 15, max: 16 },
  U19: { min: 17, max: 18 },
};

/** B-categorie kleur-leeftijdsbanden. */
const KLEUR_BANDEN: Record<string, { min: number; max: number }> = {
  BLAUW: { min: 5, max: 7 },
  GROEN: { min: 8, max: 9 },
  GEEL: { min: 10, max: 12 },
  ORANJE: { min: 13, max: 15 },
  ROOD: { min: 16, max: 18 },
};

function korfbalLeeftijd(geboortejaar: number): number {
  return PEILJAAR - geboortejaar;
}

function naam(s: SpelerInput): string {
  return `${s.roepnaam} ${s.achternaam}`;
}

/**
 * Detecteert doorstroom-signaleringen voor het volgende seizoen.
 * Peiljaar is het jaar waarin het nieuwe seizoen begint (bijv. 2026 voor 2026-2027).
 */
export function detecteerDoorstroom(spelers: SpelerInput[]): DoorstroomSignalering[] {
  const signaleringen: DoorstroomSignalering[] = [];

  for (const speler of spelers) {
    const leeftijd = korfbalLeeftijd(speler.geboortejaar);
    const huidig = speler.huidig;

    if (!huidig) continue;

    const huidigeACat = huidig.a_categorie?.toUpperCase();
    const huidigeKleur = huidig.kleur?.toUpperCase();

    // A-categorie: speler verlaat U-team (te oud)
    if (huidigeACat === "U15" && leeftijd > A_CAT_BANDEN.U15.max) {
      signaleringen.push({
        spelerId: speler.id,
        type: "VERLAAT_U15",
        beschrijving: `${naam(speler)} (${leeftijd}j) verlaat U15 — te oud`,
      });
    }
    if (huidigeACat === "U17" && leeftijd > A_CAT_BANDEN.U17.max) {
      signaleringen.push({
        spelerId: speler.id,
        type: "VERLAAT_U17",
        beschrijving: `${naam(speler)} (${leeftijd}j) verlaat U17 — te oud`,
      });
    }
    if (huidigeACat === "U19" && leeftijd > A_CAT_BANDEN.U19.max) {
      signaleringen.push({
        spelerId: speler.id,
        type: "VERLAAT_U19",
        beschrijving: `${naam(speler)} (${leeftijd}j) verlaat U19 — te oud`,
      });
    }

    // Naar senioren: 19+ en nog in U19 of Rood
    if (
      leeftijd >= 19 &&
      (huidigeACat === "U19" || huidigeKleur === "ROOD") &&
      !huidigeACat?.includes("SENIOREN")
    ) {
      signaleringen.push({
        spelerId: speler.id,
        type: "NAAR_SENIOREN",
        beschrijving: `${naam(speler)} (${leeftijd}j) gaat naar senioren`,
      });
    }

    // Instroomt in A-categorie (juiste leeftijd, nog niet in die A-cat)
    if (
      leeftijd >= A_CAT_BANDEN.U15.min &&
      leeftijd <= A_CAT_BANDEN.U15.max &&
      huidigeACat !== "U15"
    ) {
      signaleringen.push({
        spelerId: speler.id,
        type: "INSTROOMT_U15",
        beschrijving: `${naam(speler)} (${leeftijd}j) komt in aanmerking voor U15`,
      });
    }
    if (
      leeftijd >= A_CAT_BANDEN.U17.min &&
      leeftijd <= A_CAT_BANDEN.U17.max &&
      huidigeACat !== "U17"
    ) {
      signaleringen.push({
        spelerId: speler.id,
        type: "INSTROOMT_U17",
        beschrijving: `${naam(speler)} (${leeftijd}j) komt in aanmerking voor U17`,
      });
    }
    if (
      leeftijd >= A_CAT_BANDEN.U19.min &&
      leeftijd <= A_CAT_BANDEN.U19.max &&
      huidigeACat !== "U19"
    ) {
      signaleringen.push({
        spelerId: speler.id,
        type: "INSTROOMT_U19",
        beschrijving: `${naam(speler)} (${leeftijd}j) komt in aanmerking voor U19`,
      });
    }

    // B-categorie: speler verlaat huidige kleur (te oud)
    if (huidigeKleur && KLEUR_BANDEN[huidigeKleur]) {
      const band = KLEUR_BANDEN[huidigeKleur];
      if (leeftijd > band.max) {
        signaleringen.push({
          spelerId: speler.id,
          type: "VERLAAT_KLEUR",
          beschrijving: `${naam(speler)} (${leeftijd}j) verlaat ${huidigeKleur} — te oud`,
        });
      }
    }
  }

  return signaleringen;
}
