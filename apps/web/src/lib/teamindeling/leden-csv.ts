/**
 * CSV-parser voor Sportlink "alle leden.csv"
 *
 * Semicolon-delimited, 17 kolommen (vaste volgorde):
 * 0: Naam, 1: Roepnaam, 2: Voorletter(s), 3: Tussenvoegsel(s), 4: Achternaam,
 * 5: Lidsoort, 6: Rel. code, 7: Geslacht, 8: Geb.dat., 9: E-mailadres,
 * 10: Leeftijdscategorie, 11: Lokale teams, 12: Spelactiviteiten (vereniging),
 * 13: Spelactiviteiten (bond), 14: Registratie in Sportlink, 15: Lid sinds,
 * 16: Afmelddatum
 */

export interface LidCsvRij {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  voorletters: string | null;
  geslacht: "M" | "V";
  geboortedatum: string | null;
  geboortejaar: number;
  lidsoort: string;
  email: string | null;
  lidSinds: string | null;
  afmelddatum: string | null;
  registratieDatum: string | null;
}

/** Parse een semicolon-delimited CSV-regel, respecteert quotes */
function parseCsvLine(line: string): string[] {
  const vals: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (line[i] === ";" && !inQuote) {
      vals.push(current);
      current = "";
      continue;
    }
    current += line[i];
  }
  vals.push(current);
  return vals;
}

/** Parse de volledige CSV-string naar gestructureerde rijen */
export function parseCsvContent(csvContent: string): LidCsvRij[] {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV bevat geen data (alleen header of leeg)");

  const header = parseCsvLine(lines[0]);
  if (header.length < 16) {
    throw new Error(
      `Ongeldig CSV-formaat: verwacht minimaal 16 kolommen, gevonden ${header.length}`
    );
  }

  const rijen: LidCsvRij[] = [];

  for (let i = 1; i < lines.length; i++) {
    const r = parseCsvLine(lines[i]);
    const relCode = r[6]?.trim();
    if (!relCode) continue;

    const geslachtRaw = r[7]?.trim();
    const geslacht: "M" | "V" = geslachtRaw === "Man" ? "M" : "V";
    const gebdat = r[8]?.trim() || null;
    const geboortejaar = gebdat ? parseInt(gebdat.split("-")[0], 10) : 0;

    rijen.push({
      relCode,
      roepnaam: r[1]?.trim() || "",
      achternaam: r[4]?.trim() || "",
      tussenvoegsel: r[3]?.trim() || null,
      voorletters: r[2]?.trim() || null,
      geslacht,
      geboortedatum: gebdat,
      geboortejaar,
      lidsoort: r[5]?.trim() || "",
      email: r[9]?.trim() || null,
      lidSinds: r[15]?.trim() || null,
      afmelddatum: r[16]?.trim() || null,
      registratieDatum: r[14]?.trim() || null,
    });
  }

  return rijen;
}
