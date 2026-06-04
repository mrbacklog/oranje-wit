/**
 * KNKV kleur-mapping + subtitle-helper.
 * Gekopieerd uit werkbord/TeamKaart.tsx (niet geëxporteerd daar).
 * Ondersteunt alleen de lowercase-tokens die de server levert (blauw/groen/geel/oranje/rood).
 * `paars` ontbreekt in de originele map — server mapt PAARS al op "blauw" via KLEUR_MAP.
 */

export const KNKV_KLEUR: Record<string, string> = {
  blauw: "var(--cat-blauw)",
  groen: "var(--cat-groen)",
  geel: "var(--cat-geel)",
  oranje: "var(--cat-oranje)",
  rood: "var(--cat-rood)",
  senior: "var(--cat-senior)",
};

/** Presentatie-label voor de kleur-bolletjes in de filterbar. */
export const KNKV_KLEUR_HEX: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
};

/** Volgorde van kleuren in de filter. */
export const KNKV_KLEUREN_VOLGORDE = ["rood", "oranje", "geel", "groen", "blauw"] as const;

interface SubtitelTeam {
  naam: string;
  kleur: string | null;
  teamCategorie: string | null;
  niveau: string | null;
  teamType: string | null;
}

/** Bouw de header-subtitle: formaat · kleur · niveau */
export function bouwSubtitel(team: SubtitelTeam): string {
  const formatLabel =
    team.teamType === "viertal" ? "Viertal" : team.teamType === "achttal" ? "Achttal" : null;
  const kleurLabel =
    team.kleur && team.kleur !== "senior"
      ? team.kleur.charAt(0).toUpperCase() + team.kleur.slice(1)
      : null;
  const niveauLabel = team.niveau ?? afkortLeeftijdUitNaam(team.naam);

  const delen: string[] = [];
  if (formatLabel) delen.push(formatLabel);
  if (kleurLabel) delen.push(kleurLabel);
  if (niveauLabel) delen.push(niveauLabel);

  if (delen.length > 0) return delen.join(" · ");

  // Fallback op categorie
  if (team.teamCategorie === "SENIOREN") return "Senioren · 19+";
  if (team.teamCategorie === "A_CATEGORIE") return "A-Categorie";
  if (team.teamCategorie === "B_CATEGORIE") return "Jeugd";
  return "";
}

function afkortLeeftijdUitNaam(naam: string): string | null {
  const m = naam.match(/\b(U\d{2})\b/i);
  if (m) return m[1].toUpperCase();
  return null;
}
