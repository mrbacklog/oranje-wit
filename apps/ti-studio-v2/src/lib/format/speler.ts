import { logger } from "@oranje-wit/types";
import type { LeeftijdCategorie } from "@/components/speler/primitives";

// ── Tussenvoegsel afkortingen ─────────────────────────────────────────────────

const TVS_AFKORTINGEN: Array<[RegExp, string]> = [
  [/^van der$/i, "vd"],
  [/^van de$/i, "vd"],
  [/^van$/i, "v"],
  [/^de$/i, "d"],
  [/^den$/i, "d"],
  [/^ter$/i, "t"],
  [/^te$/i, "t"],
];

function kortTussenvoegsel(tvs: string): string {
  for (const [patroon, afkorting] of TVS_AFKORTINGEN) {
    if (patroon.test(tvs.trim())) return afkorting;
  }
  // Onbekend tussenvoegsel: geef het terug zoals het is
  return tvs;
}

// ── Naam-formatter ────────────────────────────────────────────────────────────

type CompactVariant = "compact" | "normaal" | "rijk" | "tabel";
type ObjectVariant = "hero" | "hover";
type NaamVariant = CompactVariant | ObjectVariant;

export function formatSpelerNaam(
  speler: { roepnaam: string; tussenvoegsel?: string | null; achternaam: string },
  variant: NaamVariant
): string | { hoofd: string; sub: string } {
  const { roepnaam, tussenvoegsel, achternaam } = speler;
  const tvs = tussenvoegsel?.trim() ?? "";

  switch (variant) {
    case "compact": {
      // "Freek vd L."
      const afkorting = tvs ? `${kortTussenvoegsel(tvs)} ` : "";
      const initiaal = achternaam[0] ? `${achternaam[0].toUpperCase()}.` : "";
      return `${roepnaam} ${afkorting}${initiaal}`.trim();
    }

    case "normaal": {
      // "Freek vd Laban"
      const afkorting = tvs ? `${kortTussenvoegsel(tvs)} ` : "";
      return `${roepnaam} ${afkorting}${achternaam}`.trim();
    }

    case "rijk":
    case "tabel": {
      // "Freek van der Laban"
      const volledig = tvs ? `${tvs} ` : "";
      return `${roepnaam} ${volledig}${achternaam}`.trim();
    }

    case "hero": {
      // { hoofd: "Freek", sub: "van der Laban" }
      const sub = tvs ? `${tvs} ${achternaam}` : achternaam;
      return { hoofd: roepnaam, sub };
    }

    case "hover": {
      // { hoofd: "FREEK", sub: "van der Laban" }
      const sub = tvs ? `${tvs} ${achternaam}` : achternaam;
      return { hoofd: roepnaam.toUpperCase(), sub };
    }
  }
}

// ── Nieuw-lid helper ──────────────────────────────────────────────────────────

export function isNieuwLid(lidSinds: string | null, seizoenStart: Date): boolean {
  if (!lidSinds) return false;

  const parsed = new Date(lidSinds);
  if (isNaN(parsed.getTime())) {
    logger.warn("isNieuwLid: ongeldige lidSinds-waarde:", lidSinds);
    return false;
  }

  return parsed >= seizoenStart;
}

// ── Leeftijdscategorie ────────────────────────────────────────────────────────

export function leeftijdscategorie(jaren: number): LeeftijdCategorie {
  if (jaren <= 5) return "kangoeroe";
  if (jaren <= 7) return "blauw";
  if (jaren <= 9) return "groen";
  if (jaren <= 12) return "geel";
  if (jaren <= 15) return "oranje";
  if (jaren <= 18) return "rood";
  return "senior";
}
