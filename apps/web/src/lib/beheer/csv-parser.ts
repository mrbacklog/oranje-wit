/**
 * Gedeelde CSV-parser die kolommen op NAAM herkent, niet op positie.
 * Werkt met Sportlink semicolon-delimited exports.
 */

export interface CsvParseResult<T> {
  rijen: T[];
  herkend: string[];
  ontbrekend: string[];
  genegeerd: string[];
  totaalRegels: number;
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
      vals.push(current.trim());
      current = "";
      continue;
    }
    current += line[i];
  }
  vals.push(current.trim());
  return vals;
}

/** Normaliseer kolomnaam voor matching (lowercase, strip haakjes en whitespace) */
function normaliseer(naam: string): string {
  return naam.toLowerCase().replace(/[()]/g, "").trim();
}

/** Bouw een kolomindex: kolomnaam -> positie in de CSV */
function bouwKolomIndex(
  headerVelden: string[],
  verplicht: string[],
  optioneel: string[]
): {
  index: Map<string, number>;
  herkend: string[];
  ontbrekend: string[];
  genegeerd: string[];
} {
  const alleGewenst = [...verplicht, ...optioneel];
  const normaalNaarOrigineel = new Map<string, string>();
  alleGewenst.forEach((k) => normaalNaarOrigineel.set(normaliseer(k), k));

  const index = new Map<string, number>();
  const herkend: string[] = [];
  const genegeerd: string[] = [];

  for (let i = 0; i < headerVelden.length; i++) {
    const norm = normaliseer(headerVelden[i]);
    const origineel = normaalNaarOrigineel.get(norm);
    if (origineel) {
      index.set(origineel, i);
      herkend.push(origineel);
    } else {
      genegeerd.push(headerVelden[i]);
    }
  }

  const ontbrekend = verplicht.filter((k) => !index.has(k));

  return { index, herkend, ontbrekend, genegeerd };
}

/** Haal een waarde op uit een rij via kolomnaam */
function kolom(rij: string[], index: Map<string, number>, naam: string): string | null {
  const pos = index.get(naam);
  if (pos === undefined) return null;
  const val = rij[pos]?.trim();
  return val || null;
}

/** Normaliseer geslacht: Male/Female/Man/Vrouw -> M/V */
function normaliseerGeslacht(raw: string | null): "M" | "V" {
  if (!raw) return "M";
  const lower = raw.toLowerCase();
  if (lower === "male" || lower === "man" || lower === "m") return "M";
  return "V";
}

/** Normaliseer datum: accepteert ISO (2012-09-26) en NL (26-09-2012) */
function normaliseerDatum(raw: string | null): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return raw;
}

// -- Leden CSV ---------------------------------------------------------------

export interface LidCsvRij {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  voorletters: string | null;
  geslacht: "M" | "V";
  geboortedatum: string | null;
  geboortejaar: number | null;
  lidsoort: string | null;
  email: string | null;
  lidSinds: string | null;
  afmelddatum: string | null;
}

const LEDEN_VERPLICHT = ["Rel. code", "Roepnaam", "Achternaam", "Geslacht", "Geb.dat."];

const LEDEN_OPTIONEEL = [
  "Tussenvoegsel(s)",
  "Voorletter(s)",
  "Lidsoort",
  "E-mailadres",
  "Lid sinds",
  "Afmelddatum",
];

export function parseLedenCsv(csvContent: string): CsvParseResult<LidCsvRij> {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV bevat geen data");

  const headerVelden = parseCsvLine(lines[0]);
  const { index, herkend, ontbrekend, genegeerd } = bouwKolomIndex(
    headerVelden,
    LEDEN_VERPLICHT,
    LEDEN_OPTIONEEL
  );

  if (ontbrekend.length > 0) {
    throw new Error(
      `Ontbrekende verplichte kolommen: ${ontbrekend.join(", ")}. ` +
        `Zorg dat deze kolommen in je Sportlink export staan.`
    );
  }

  const rijen: LidCsvRij[] = [];
  for (let i = 1; i < lines.length; i++) {
    const r = parseCsvLine(lines[i]);
    const relCode = kolom(r, index, "Rel. code");
    if (!relCode) continue;

    const gebdat = normaliseerDatum(kolom(r, index, "Geb.dat."));
    const geboortejaar = gebdat ? parseInt(gebdat.split("-")[0], 10) : null;

    rijen.push({
      relCode,
      roepnaam: kolom(r, index, "Roepnaam") ?? "",
      achternaam: kolom(r, index, "Achternaam") ?? "",
      tussenvoegsel: kolom(r, index, "Tussenvoegsel(s)"),
      voorletters: kolom(r, index, "Voorletter(s)"),
      geslacht: normaliseerGeslacht(kolom(r, index, "Geslacht")),
      geboortedatum: gebdat,
      geboortejaar,
      lidsoort: kolom(r, index, "Lidsoort"),
      email: kolom(r, index, "E-mailadres"),
      lidSinds: normaliseerDatum(kolom(r, index, "Lid sinds")),
      afmelddatum: normaliseerDatum(kolom(r, index, "Afmelddatum")),
    });
  }

  return { rijen, herkend, ontbrekend, genegeerd, totaalRegels: lines.length - 1 };
}

// -- Teams CSV ---------------------------------------------------------------

export interface TeamCsvRij {
  team: string;
  teamsoort: string | null;
  teamrol: string;
  functie: string | null;
  relCode: string;
  geslacht: "M" | "V";
  geboortedatum: string | null;
}

const TEAMS_VERPLICHT = ["Team", "Teamrol", "Rel. code"];

const TEAMS_OPTIONEEL = ["Teamsoort", "Functie", "Geslacht", "Geb.dat."];

export function parseTeamsCsv(csvContent: string): CsvParseResult<TeamCsvRij> {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV bevat geen data");

  const headerVelden = parseCsvLine(lines[0]);
  const { index, herkend, ontbrekend, genegeerd } = bouwKolomIndex(
    headerVelden,
    TEAMS_VERPLICHT,
    TEAMS_OPTIONEEL
  );

  if (ontbrekend.length > 0) {
    throw new Error(
      `Ontbrekende verplichte kolommen: ${ontbrekend.join(", ")}. ` +
        `Zorg dat deze kolommen in je Sportlink export staan.`
    );
  }

  const rijen: TeamCsvRij[] = [];
  for (let i = 1; i < lines.length; i++) {
    const r = parseCsvLine(lines[i]);
    const relCode = kolom(r, index, "Rel. code");
    if (!relCode) continue;

    rijen.push({
      team: kolom(r, index, "Team") ?? "",
      teamsoort: kolom(r, index, "Teamsoort"),
      teamrol: kolom(r, index, "Teamrol") ?? "",
      functie: kolom(r, index, "Functie"),
      relCode,
      geslacht: normaliseerGeslacht(kolom(r, index, "Geslacht")),
      geboortedatum: normaliseerDatum(kolom(r, index, "Geb.dat.")),
    });
  }

  return { rijen, herkend, ontbrekend, genegeerd, totaalRegels: lines.length - 1 };
}

/** Detecteer CSV-type op basis van headers */
export function detectCsvType(csvContent: string): "leden" | "teams" | "onbekend" {
  const eersteLijn = csvContent.split("\n")[0] ?? "";
  const headers = parseCsvLine(eersteLijn).map((h) => normaliseer(h));

  if (headers.includes("team") && headers.includes("teamrol")) return "teams";
  if (headers.includes("rel. code") && headers.includes("lidsoort")) return "leden";
  return "onbekend";
}
