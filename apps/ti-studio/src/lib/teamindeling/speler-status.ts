/**
 * Bron-data uit Sportlink wint alleen van een TC-statusOverride bij een ECHTE
 * bondsafmelding: GAAT_STOPPEN (afmelddatum in de toekomst) of GESTOPT (afgemeld
 * / niet meer actief lid). Reden: een handmatige TC-keuze mag een afmelding niet
 * maskeren — de teamindeling moet direct zien dat een speler niet beschikbaar is.
 *
 * NIET_SPELEND zit hier bewust NIET in: dat is geen afmelding maar "geen
 * competitie-spelactiviteit" (een actief lid zonder Veld/Zaal-registratie). Voor
 * die zachte status mag de TC met een override wél zelf bepalen dat de speler
 * beschikbaar is.
 */
const AFMELD_STATUSSEN = new Set<string>(["GAAT_STOPPEN", "GESTOPT"]);

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
