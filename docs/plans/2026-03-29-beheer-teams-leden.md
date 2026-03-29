# Beheer/Teams & Leden — CSV Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CSV-upload UI in Beheer/Teams waarmee de TC leden synchroniseert en teams-snapshots maakt vanuit Sportlink exports, met kolomherkenning op naam en diff-preview.

**Architecture:** Hergebruik de bestaande `leden-csv.ts` parser (refactor naar kolomnaam-gebaseerd), voeg een nieuwe `teams-csv.ts` parser toe, bouw server actions voor preview+verwerk, en maak een sync-pagina met twee tabs (Leden / Teams). De bestaande `/beheer/teams/sync/` pagina wordt vervangen.

**Tech Stack:** Next.js 16 server actions, Prisma, React 19, Tailwind CSS 4, design tokens uit `packages/ui/`

**Spec:** `docs/specs/2026-03-29-beheer-teams-leden-design.md`

---

## File Map

### Nieuw
- `apps/web/src/lib/beheer/csv-parser.ts` — Gedeelde CSV-parser op kolomnaam
- `apps/web/src/lib/beheer/leden-sync.ts` — Leden diff-berekening en verwerking
- `apps/web/src/lib/beheer/teams-snapshot.ts` — Teams snapshot diff en opslag
- `apps/web/src/app/(beheer)/beheer/teams/sync/actions.ts` — Server actions voor preview + verwerk
- `apps/web/src/components/beheer/csv-upload.tsx` — Drag & drop CSV upload component
- `apps/web/src/components/beheer/leden-sync-panel.tsx` — Leden import tab (preview + diff + verwerk)
- `apps/web/src/components/beheer/teams-snapshot-panel.tsx` — Teams import tab (preview + diff + verwerk)

### Wijzigen
- `apps/web/src/app/(beheer)/beheer/teams/sync/page.tsx` — Vervang placeholder door werkende sync-pagina

### Niet meer nodig (na migratie)
- `apps/web/src/lib/teamindeling/leden-csv.ts` — Wordt vervangen door `beheer/csv-parser.ts`

---

### Taak 1: Gedeelde CSV-parser op kolomnaam

**Files:**
- Create: `apps/web/src/lib/beheer/csv-parser.ts`

De kern van alles: een parser die kolommen op naam vindt, niet op positie.

- [ ] **Stap 1: Schrijf csv-parser.ts**

```typescript
// apps/web/src/lib/beheer/csv-parser.ts

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

/** Normaliseer kolomnaam voor matching (lowercase, strip whitespace) */
function normaliseer(naam: string): string {
  return naam.toLowerCase().replace(/[()]/g, "").trim();
}

/** Bouw een kolomindex: kolomnaam → positie in de CSV */
function bouwKolomIndex(
  headerVelden: string[],
  verplicht: string[],
  optioneel: string[]
): { index: Map<string, number>; herkend: string[]; ontbrekend: string[]; genegeerd: string[] } {
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

/** Normaliseer geslacht: Male/Female/Man/Vrouw → M/V */
function normaliseerGeslacht(raw: string | null): "M" | "V" {
  if (!raw) return "M";
  const lower = raw.toLowerCase();
  if (lower === "male" || lower === "man" || lower === "m") return "M";
  return "V";
}

/** Normaliseer datum: accepteert ISO (2012-09-26) en NL (26-09-2012) */
function normaliseerDatum(raw: string | null): string | null {
  if (!raw) return null;
  // Al ISO-formaat?
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // NL-formaat: dd-mm-yyyy
  const match = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return raw;
}

// ── Leden CSV ────────────────────────────────────────────────

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
}

const LEDEN_VERPLICHT = [
  "Rel. code",
  "Roepnaam",
  "Achternaam",
  "Geslacht",
  "Geb.dat.",
];

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
    const geboortejaar = gebdat ? parseInt(gebdat.split("-")[0], 10) : 0;

    rijen.push({
      relCode,
      roepnaam: kolom(r, index, "Roepnaam") ?? "",
      achternaam: kolom(r, index, "Achternaam") ?? "",
      tussenvoegsel: kolom(r, index, "Tussenvoegsel(s)"),
      voorletters: kolom(r, index, "Voorletter(s)"),
      geslacht: normaliseerGeslacht(kolom(r, index, "Geslacht")),
      geboortedatum: gebdat,
      geboortejaar,
      lidsoort: kolom(r, index, "Lidsoort") ?? "",
      email: kolom(r, index, "E-mailadres"),
      lidSinds: normaliseerDatum(kolom(r, index, "Lid sinds")),
      afmelddatum: normaliseerDatum(kolom(r, index, "Afmelddatum")),
    });
  }

  return { rijen, herkend, ontbrekend, genegeerd, totaalRegels: lines.length - 1 };
}

// ── Teams CSV ────────────────────────────────────────────────

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

const TEAMS_OPTIONEEL = [
  "Teamsoort",
  "Functie",
  "Geslacht",
  "Geb.dat.",
];

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
```

- [ ] **Stap 2: Verifieer dat het compileert**

Run: `npx tsc --noEmit apps/web/src/lib/beheer/csv-parser.ts 2>&1 | head -20`

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/lib/beheer/csv-parser.ts
git commit -m "feat(beheer): gedeelde CSV-parser op kolomnaam"
```

---

### Taak 2: Leden sync logica

**Files:**
- Create: `apps/web/src/lib/beheer/leden-sync.ts`
- Read: `apps/web/src/lib/teamindeling/leden-diff.ts` (hergebruik patroon)

Diff-berekening en verwerking voor leden CSV. Gebaseerd op het bestaande patroon in `leden-diff.ts` maar als server-side lib in beheer.

- [ ] **Stap 1: Schrijf leden-sync.ts**

```typescript
// apps/web/src/lib/beheer/leden-sync.ts

import { prisma } from "@/lib/db/prisma";
import type { LidCsvRij } from "./csv-parser";
import { logger } from "@oranje-wit/types";

// ── Types ────────────────────────────────────────────────────

export interface LedenDiffResult {
  nieuw: { relCode: string; naam: string; geslacht: string; geboortejaar: number }[];
  gewijzigd: { relCode: string; naam: string; wijzigingen: { veld: string; oud: string | null; nieuw: string | null }[] }[];
  afgemeld: { relCode: string; naam: string; afmelddatum: string }[];
  verdwenen: { relCode: string; naam: string }[];
  ongewijzigd: number;
  totaalCsv: number;
  totaalDb: number;
}

export interface LedenSyncResult {
  aangemaakt: number;
  bijgewerkt: number;
  afgemeldGemarkeerd: number;
  signaleringen: string[];
}

// ── Diff ─────────────────────────────────────────────────────

function maakNaam(rij: LidCsvRij): string {
  return [rij.roepnaam, rij.tussenvoegsel, rij.achternaam].filter(Boolean).join(" ");
}

function verschilt(oud: string | null | undefined, nieuw: string | null | undefined): boolean {
  return (oud ?? "") !== (nieuw ?? "");
}

export async function berekenLedenDiff(csvRijen: LidCsvRij[]): Promise<LedenDiffResult> {
  const csvMap = new Map(csvRijen.map((r) => [r.relCode, r]));

  const leden = await prisma.lid.findMany({
    select: {
      relCode: true,
      roepnaam: true,
      achternaam: true,
      tussenvoegsel: true,
      geslacht: true,
      email: true,
      afmelddatum: true,
      lidsoort: true,
    },
  });
  const dbMap = new Map(leden.map((l) => [l.relCode, l]));

  const nieuw: LedenDiffResult["nieuw"] = [];
  const gewijzigd: LedenDiffResult["gewijzigd"] = [];
  const afgemeld: LedenDiffResult["afgemeld"] = [];
  let ongewijzigd = 0;

  for (const rij of csvRijen) {
    const db = dbMap.get(rij.relCode);
    if (!db) {
      nieuw.push({ relCode: rij.relCode, naam: maakNaam(rij), geslacht: rij.geslacht, geboortejaar: rij.geboortejaar });
      continue;
    }

    // Check afmelddatum
    if (rij.afmelddatum && !db.afmelddatum) {
      afgemeld.push({ relCode: rij.relCode, naam: maakNaam(rij), afmelddatum: rij.afmelddatum });
      continue;
    }

    // Check wijzigingen
    const wijzigingen: { veld: string; oud: string | null; nieuw: string | null }[] = [];
    if (verschilt(db.roepnaam, rij.roepnaam)) wijzigingen.push({ veld: "roepnaam", oud: db.roepnaam, nieuw: rij.roepnaam });
    if (verschilt(db.achternaam, rij.achternaam)) wijzigingen.push({ veld: "achternaam", oud: db.achternaam, nieuw: rij.achternaam });
    if (verschilt(db.tussenvoegsel, rij.tussenvoegsel)) wijzigingen.push({ veld: "tussenvoegsel", oud: db.tussenvoegsel, nieuw: rij.tussenvoegsel });
    if (verschilt(db.geslacht, rij.geslacht)) wijzigingen.push({ veld: "geslacht", oud: db.geslacht, nieuw: rij.geslacht });
    if (verschilt(db.email, rij.email)) wijzigingen.push({ veld: "email", oud: db.email, nieuw: rij.email });

    if (wijzigingen.length > 0) {
      gewijzigd.push({ relCode: rij.relCode, naam: maakNaam(rij), wijzigingen });
    } else {
      ongewijzigd++;
    }
  }

  // Leden in DB die niet in CSV staan
  const verdwenen = leden
    .filter((l) => !csvMap.has(l.relCode) && !l.afmelddatum)
    .map((l) => ({
      relCode: l.relCode,
      naam: [l.roepnaam, l.tussenvoegsel, l.achternaam].filter(Boolean).join(" "),
    }));

  return {
    nieuw,
    gewijzigd,
    afgemeld,
    verdwenen,
    ongewijzigd,
    totaalCsv: csvRijen.length,
    totaalDb: leden.length,
  };
}

// ── Verwerk ──────────────────────────────────────────────────

export async function verwerkLedenSync(csvRijen: LidCsvRij[]): Promise<LedenSyncResult> {
  let aangemaakt = 0;
  let bijgewerkt = 0;
  let afgemeldGemarkeerd = 0;
  const signaleringen: string[] = [];

  for (const rij of csvRijen) {
    const bestaand = await prisma.lid.findUnique({ where: { relCode: rij.relCode } });

    if (!bestaand) {
      await prisma.lid.create({
        data: {
          relCode: rij.relCode,
          roepnaam: rij.roepnaam,
          achternaam: rij.achternaam,
          tussenvoegsel: rij.tussenvoegsel,
          voorletters: rij.voorletters,
          geslacht: rij.geslacht,
          geboortejaar: rij.geboortejaar,
          geboortedatum: rij.geboortedatum ? new Date(rij.geboortedatum) : null,
          lidsoort: rij.lidsoort,
          email: rij.email,
          lidSinds: rij.lidSinds ? new Date(rij.lidSinds) : null,
          afmelddatum: rij.afmelddatum ? new Date(rij.afmelddatum) : null,
        },
      });
      aangemaakt++;
      signaleringen.push(`Nieuw lid: ${maakNaam(rij)} (${rij.geslacht}, ${rij.geboortejaar})`);
    } else {
      await prisma.lid.update({
        where: { relCode: rij.relCode },
        data: {
          roepnaam: rij.roepnaam,
          achternaam: rij.achternaam,
          tussenvoegsel: rij.tussenvoegsel,
          voorletters: rij.voorletters,
          geslacht: rij.geslacht,
          geboortejaar: rij.geboortejaar,
          geboortedatum: rij.geboortedatum ? new Date(rij.geboortedatum) : null,
          lidsoort: rij.lidsoort,
          email: rij.email,
          lidSinds: rij.lidSinds ? new Date(rij.lidSinds) : null,
          afmelddatum: rij.afmelddatum ? new Date(rij.afmelddatum) : null,
        },
      });
      bijgewerkt++;

      // Signaleer als lid nu afgemeld is maar dat eerder niet was
      if (rij.afmelddatum && !bestaand.afmelddatum) {
        afgemeldGemarkeerd++;
        signaleringen.push(`Afgemeld: ${maakNaam(rij)}`);

        // Update Speler-status als die bestaat
        const speler = await prisma.speler.findUnique({ where: { id: rij.relCode } });
        if (speler && speler.status !== "GAAT_STOPPEN") {
          await prisma.speler.update({
            where: { id: rij.relCode },
            data: { status: "GAAT_STOPPEN" },
          });
          signaleringen.push(`→ Speler ${maakNaam(rij)} status → GAAT_STOPPEN`);
        }
      }
    }
  }

  logger.info(`[leden-sync] ${aangemaakt} aangemaakt, ${bijgewerkt} bijgewerkt, ${afgemeldGemarkeerd} afgemeld`);

  return { aangemaakt, bijgewerkt, afgemeldGemarkeerd, signaleringen };
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/lib/beheer/leden-sync.ts
git commit -m "feat(beheer): leden sync diff + verwerking"
```

---

### Taak 3: Teams snapshot logica

**Files:**
- Create: `apps/web/src/lib/beheer/teams-snapshot.ts`

- [ ] **Stap 1: Schrijf teams-snapshot.ts**

```typescript
// apps/web/src/lib/beheer/teams-snapshot.ts

import { prisma } from "@/lib/db/prisma";
import type { TeamCsvRij } from "./csv-parser";
import { logger } from "@oranje-wit/types";

// ── Types ────────────────────────────────────────────────────

export type CompetitieType = "veld_najaar" | "zaal_8" | "zaal_4" | "veld_voorjaar";

export interface TeamsPreview {
  teams: { naam: string; spelers: number; staf: number }[];
  totaalSpelers: number;
  totaalStaf: number;
  onbekendeRelCodes: string[];
}

export interface TeamsSnapshotDiff {
  nieuw: { relCode: string; naam: string; team: string }[];
  gewisseld: { relCode: string; naam: string; vanTeam: string; naarTeam: string }[];
  verdwenen: { relCode: string; naam: string; wasTeam: string }[];
}

export interface TeamsSnapshotResult {
  opgeslagen: number;
  stafOpgeslagen: number;
  signaleringen: string[];
}

// ── Preview ──────────────────────────────────────────────────

export async function berekenTeamsPreview(
  csvRijen: TeamCsvRij[]
): Promise<TeamsPreview> {
  // Groepeer per team
  const teamMap = new Map<string, { spelers: number; staf: number }>();
  for (const rij of csvRijen) {
    const entry = teamMap.get(rij.team) ?? { spelers: 0, staf: 0 };
    if (rij.teamrol === "Teamspeler") entry.spelers++;
    else entry.staf++;
    teamMap.set(rij.team, entry);
  }

  // Check onbekende rel_codes
  const relCodes = [...new Set(csvRijen.map((r) => r.relCode))];
  const bekendeLeden = await prisma.lid.findMany({
    where: { relCode: { in: relCodes } },
    select: { relCode: true },
  });
  const bekendeSet = new Set(bekendeLeden.map((l) => l.relCode));
  const onbekendeRelCodes = relCodes.filter((rc) => !bekendeSet.has(rc));

  const teams = [...teamMap.entries()]
    .map(([naam, counts]) => ({ naam, ...counts }))
    .sort((a, b) => a.naam.localeCompare(b.naam));

  return {
    teams,
    totaalSpelers: teams.reduce((s, t) => s + t.spelers, 0),
    totaalStaf: teams.reduce((s, t) => s + t.staf, 0),
    onbekendeRelCodes,
  };
}

// ── Diff ─────────────────────────────────────────────────────

export async function berekenTeamsSnapshotDiff(
  csvRijen: TeamCsvRij[],
  seizoen: string,
  competitie: CompetitieType
): Promise<TeamsSnapshotDiff> {
  const spelerRijen = csvRijen.filter((r) => r.teamrol === "Teamspeler");
  const csvMap = new Map(spelerRijen.map((r) => [r.relCode, r]));

  // Vorige snapshot
  const vorige = await prisma.competitieSpeler.findMany({
    where: { seizoen, competitie },
    include: {
      lid: { select: { roepnaam: true, achternaam: true, tussenvoegsel: true } },
    },
  });
  const vorigeMap = new Map(vorige.map((v) => [v.relCode, v]));

  const nieuw: TeamsSnapshotDiff["nieuw"] = [];
  const gewisseld: TeamsSnapshotDiff["gewisseld"] = [];

  for (const rij of spelerRijen) {
    const prev = vorigeMap.get(rij.relCode);
    if (!prev) {
      // Probeer naam uit leden tabel
      const lid = await prisma.lid.findUnique({
        where: { relCode: rij.relCode },
        select: { roepnaam: true, achternaam: true, tussenvoegsel: true },
      });
      const naam = lid
        ? [lid.roepnaam, lid.tussenvoegsel, lid.achternaam].filter(Boolean).join(" ")
        : rij.relCode;
      nieuw.push({ relCode: rij.relCode, naam, team: rij.team });
    } else if (prev.team !== rij.team) {
      const naam = [prev.lid.roepnaam, prev.lid.tussenvoegsel, prev.lid.achternaam].filter(Boolean).join(" ");
      gewisseld.push({ relCode: rij.relCode, naam, vanTeam: prev.team, naarTeam: rij.team });
    }
  }

  const verdwenen = vorige
    .filter((v) => !csvMap.has(v.relCode))
    .map((v) => ({
      relCode: v.relCode,
      naam: [v.lid.roepnaam, v.lid.tussenvoegsel, v.lid.achternaam].filter(Boolean).join(" "),
      wasTeam: v.team,
    }));

  return { nieuw, gewisseld, verdwenen };
}

// ── Opslaan ──────────────────────────────────────────────────

export async function verwerkTeamsSnapshot(
  csvRijen: TeamCsvRij[],
  seizoen: string,
  competitie: CompetitieType
): Promise<TeamsSnapshotResult> {
  const signaleringen: string[] = [];
  let opgeslagen = 0;
  let stafOpgeslagen = 0;

  // Verwijder bestaande records voor deze competitieperiode
  await prisma.competitieSpeler.deleteMany({
    where: { seizoen, competitie },
  });

  // Groepeer per team
  for (const rij of csvRijen) {
    if (rij.teamrol === "Teamspeler") {
      await prisma.competitieSpeler.create({
        data: {
          relCode: rij.relCode,
          seizoen,
          competitie,
          team: rij.team,
          geslacht: rij.geslacht,
          bron: "sportlink",
        },
      });
      opgeslagen++;
    } else {
      // Staf: registreer als StafToewijzing als het Staf-record bestaat
      const staf = await prisma.staf.findFirst({ where: { lidRelCode: rij.relCode } });
      if (staf) {
        stafOpgeslagen++;
      }
      // Staf wordt ook opgeslagen in competitie_spelers voor de snapshot
      await prisma.competitieSpeler.create({
        data: {
          relCode: rij.relCode,
          seizoen,
          competitie,
          team: rij.team,
          geslacht: rij.geslacht,
          bron: "sportlink",
        },
      });
      opgeslagen++;
    }
  }

  logger.info(`[teams-snapshot] ${seizoen}/${competitie}: ${opgeslagen} records, ${stafOpgeslagen} staf herkend`);
  signaleringen.push(`Snapshot opgeslagen: ${opgeslagen} records voor ${seizoen} ${competitie}`);

  return { opgeslagen, stafOpgeslagen, signaleringen };
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/lib/beheer/teams-snapshot.ts
git commit -m "feat(beheer): teams snapshot preview, diff en opslag"
```

---

### Taak 4: Server actions

**Files:**
- Create: `apps/web/src/app/(beheer)/beheer/teams/sync/actions.ts`

- [ ] **Stap 1: Schrijf server actions**

```typescript
// apps/web/src/app/(beheer)/beheer/teams/sync/actions.ts
"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { type ActionResult } from "@oranje-wit/types";
import { parseLedenCsv, parseTeamsCsv, detectCsvType } from "@/lib/beheer/csv-parser";
import {
  berekenLedenDiff,
  verwerkLedenSync,
  type LedenDiffResult,
  type LedenSyncResult,
} from "@/lib/beheer/leden-sync";
import {
  berekenTeamsPreview,
  berekenTeamsSnapshotDiff,
  verwerkTeamsSnapshot,
  type CompetitieType,
  type TeamsPreview,
  type TeamsSnapshotDiff,
  type TeamsSnapshotResult,
} from "@/lib/beheer/teams-snapshot";
import { revalidatePath } from "next/cache";

export async function detecteerCsvType(
  csvContent: string
): Promise<ActionResult<{ type: "leden" | "teams" | "onbekend" }>> {
  await requireTC();
  const type = detectCsvType(csvContent);
  return { ok: true, data: { type } };
}

export async function previewLedenSync(
  csvContent: string
): Promise<ActionResult<LedenDiffResult & { herkend: string[]; genegeerd: string[] }>> {
  await requireTC();
  try {
    const parsed = parseLedenCsv(csvContent);
    const diff = await berekenLedenDiff(parsed.rijen);
    return { ok: true, data: { ...diff, herkend: parsed.herkend, genegeerd: parsed.genegeerd } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function verwerkLedenSyncAction(
  csvContent: string
): Promise<ActionResult<LedenSyncResult>> {
  await requireTC();
  try {
    const parsed = parseLedenCsv(csvContent);
    const result = await verwerkLedenSync(parsed.rijen);
    revalidatePath("/beheer/teams");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function previewTeamsSnapshot(
  csvContent: string,
  seizoen: string,
  competitie: CompetitieType
): Promise<ActionResult<{ preview: TeamsPreview; diff: TeamsSnapshotDiff }>> {
  await requireTC();
  try {
    const parsed = parseTeamsCsv(csvContent);
    const preview = await berekenTeamsPreview(parsed.rijen);
    const diff = await berekenTeamsSnapshotDiff(parsed.rijen, seizoen, competitie);
    return { ok: true, data: { preview, diff } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function verwerkTeamsSnapshotAction(
  csvContent: string,
  seizoen: string,
  competitie: CompetitieType
): Promise<ActionResult<TeamsSnapshotResult>> {
  await requireTC();
  try {
    const parsed = parseTeamsCsv(csvContent);
    const result = await verwerkTeamsSnapshot(parsed.rijen, seizoen, competitie);
    revalidatePath("/beheer/teams");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/app/\(beheer\)/beheer/teams/sync/actions.ts
git commit -m "feat(beheer): server actions voor leden sync en teams snapshot"
```

---

### Taak 5: CSV upload component

**Files:**
- Create: `apps/web/src/components/beheer/csv-upload.tsx`

Een drag & drop upload component die het CSV-bestand inleest en de content doorgeeft.

- [ ] **Stap 1: Schrijf csv-upload.tsx**

Een client component met drag & drop zone, bestandsselectie, en loading state. Toont het gedetecteerde type (leden/teams) en het aantal regels. Geeft `csvContent: string` door aan de parent via een callback.

Gebruik design tokens (geen hardcoded kleuren), `var(--surface-card)`, `var(--border-default)`, etc. Kijk naar bestaande beheer-componenten voor stijlpatronen.

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/beheer/csv-upload.tsx
git commit -m "feat(beheer): CSV upload component met drag & drop"
```

---

### Taak 6: Leden sync panel component

**Files:**
- Create: `apps/web/src/components/beheer/leden-sync-panel.tsx`

Client component dat de leden-sync flow beheert: upload → preview → diff → verwerk.

- [ ] **Stap 1: Schrijf leden-sync-panel.tsx**

States: `idle` → `previewing` → `preview` → `verwerking` → `klaar`

Toont:
- CSV upload (via `csv-upload.tsx`)
- Na upload: diff-overzicht (nieuw groen, gewijzigd oranje, afgemeld rood, verdwenen grijs)
- Herkende en genegeerde kolommen
- "Verwerken" knop
- Na verwerking: resultaat + signaleringen

Gebruik `previewLedenSync` en `verwerkLedenSyncAction` server actions.

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/beheer/leden-sync-panel.tsx
git commit -m "feat(beheer): leden sync panel met diff preview"
```

---

### Taak 7: Teams snapshot panel component

**Files:**
- Create: `apps/web/src/components/beheer/teams-snapshot-panel.tsx`

Client component dat de teams-snapshot flow beheert.

- [ ] **Stap 1: Schrijf teams-snapshot-panel.tsx**

Zelfde patroon als leden-sync-panel, maar met:
- Seizoen-selector (dropdown)
- Competitieperiode-selector (`veld_najaar` / `zaal_8` / `zaal_4` / `veld_voorjaar`)
- Preview met team-overzicht (tabel: team, spelers, staf)
- Waarschuwing bij onbekende rel_codes
- Diff met vorige snapshot (teamwisselingen, nieuwe spelers, verdwenen)
- "Snapshot opslaan" knop

Gebruik `previewTeamsSnapshot` en `verwerkTeamsSnapshotAction` server actions.
Gebruik `getTeamSeizoenOpties()` uit bestaande actions voor seizoen-dropdown.

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/beheer/teams-snapshot-panel.tsx
git commit -m "feat(beheer): teams snapshot panel met diff en seizoen/competitie selectie"
```

---

### Taak 8: Sync pagina samenstellen

**Files:**
- Modify: `apps/web/src/app/(beheer)/beheer/teams/sync/page.tsx`

- [ ] **Stap 1: Vervang de placeholder pagina**

Vervang de volledige inhoud van `sync/page.tsx` door een pagina met twee tabs:
- Tab 1: "Leden" → `<LedenSyncPanel />`
- Tab 2: "Teams" → `<TeamsSnapshotPanel />`

Bovenaan: stats over laatste sync (hergebruik bestaande `prisma.import.findFirst` query).
Waarschuwing als laatste sync > 4 weken geleden.

De pagina is een server component die de initiele data laadt (laatste import, seizoen-opties) en de client panels rendert.

- [ ] **Stap 2: Test in browser**

Run: `pnpm dev`
Ga naar: `http://localhost:3000/beheer/teams/sync`
Verwacht: twee tabs, upload-functionaliteit

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/app/\(beheer\)/beheer/teams/sync/page.tsx
git commit -m "feat(beheer): sync pagina met leden en teams tabs"
```

---

### Taak 9: Test met echte data

**Files:**
- Read: `docs/onderzoek/Teams 223 personen gevonden.csv` (test-data)

- [ ] **Stap 1: Test leden sync**

Upload een Sportlink "alle leden" CSV (als die beschikbaar is in data/) via de UI.
Controleer:
- Kolommen worden herkend op naam
- Diff wordt correct getoond
- Verwerking lukt zonder fouten

- [ ] **Stap 2: Test teams snapshot**

Upload `docs/onderzoek/Teams 223 personen gevonden.csv` via de UI.
Controleer:
- Type wordt gedetecteerd als "teams"
- 223 personen worden geparsed
- Teams worden gegroepeerd
- Seizoen/competitie selectie werkt
- Snapshot wordt opgeslagen

- [ ] **Stap 3: Verifieer signalering**

Controleer dat bij afgemelde leden de Speler-status wordt bijgewerkt naar `GAAT_STOPPEN`.

- [ ] **Stap 4: Final commit**

```bash
git add -A
git commit -m "feat(beheer): Teams & Leden CSV sync compleet"
```
