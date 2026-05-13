/**
 * Bron-data uit Sportlink wint altijd van een TC-statusOverride wanneer de
 * speler bij de bondsadministratie is afgemeld of niet meer speelt. Reden:
 * een handmatige TC-keuze mag een afmelding niet maskeren — de teamindeling
 * moet direct zien dat een speler niet beschikbaar is.
 */
const AFMELD_STATUSSEN = new Set<string>(["GAAT_STOPPEN", "NIET_SPELEND"]);

export function effectieveSpelerStatus(
  spelerStatus: string | null | undefined,
  override: string | null | undefined
): string {
  if (spelerStatus && AFMELD_STATUSSEN.has(spelerStatus)) return spelerStatus;
  return override ?? spelerStatus ?? "BESCHIKBAAR";
}

export function isAfmeldStatus(status: string | null | undefined): boolean {
  return !!status && AFMELD_STATUSSEN.has(status);
}
