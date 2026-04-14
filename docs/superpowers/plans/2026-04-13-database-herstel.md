# Database Herstel — Productie Data Recovery

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Herstel de verloren productiedata (leden, seizoenen, competitie_spelers, ledenverloop, cohort_seizoenen, signalering) stap voor stap vanuit lokale bronbestanden.

**Architecture:** Zes herstelscripts die elk één tabel vullen, in volgorde van afhankelijkheid. Elke stap verifieert het resultaat met een COUNT query voordat de volgende begint. Scripts draaien direct tegen de Railway productiedatabase via DATABASE_URL uit `apps/web/.env`. Na herstel genereert de bestaande pipeline (bereken-verloop, bereken-cohorten, genereer-signalering) de afgeleide tabellen opnieuw.

**Tech Stack:** Node.js scripts (CJS), pg client, dotenv. Geen Prisma (directe SQL voor maximale controle). Productie DATABASE_URL: `apps/web/.env`.

**Permanente dataverlies (niet herstelbaar):** competitie_spelers vóór 2021-2022 voor leden die inmiddels zijn uitgestroomd. Enige bron hiervoor zou de Sportlink-exporthistorie zijn die niet lokaal beschikbaar is.

---

## Bronbestanden

| Bron | Inhoud | Beschikbaar |
|---|---|---|
| `data/leden/alle-leden.json` | 1690 leden stamgegevens (t/m feb 2026) | ✅ |
| `data/leden/Leden 528 personen gevonden.csv` | Actuele leden + teams 13 apr 2026 | ✅ |
| `data/export/export-2026-2027.json` | 253 actieve spelers + spelerspaden 2021-2026 | ✅ |
| `scripts/js/bereken-verloop.js` | Berekent ledenverloop uit DB | ✅ |
| `scripts/js/bereken-cohorten.js` | Berekent cohort_seizoenen uit DB | ✅ |
| `scripts/js/genereer-signalering.js` | Genereert signalering uit DB | ✅ |

## Bestandsstructuur

| Actie | Bestand |
|---|---|
| **Create** | `scripts/herstel/01-seizoenen.js` |
| **Create** | `scripts/herstel/02-leden.js` |
| **Create** | `scripts/herstel/03-competitie-spelers.js` |
| **Create** | `scripts/herstel/04-run-verloop.sh` |
| **Create** | `scripts/herstel/05-run-cohorten.sh` |
| **Create** | `scripts/herstel/06-run-signalering.sh` |
| **Create** | `scripts/herstel/07-verify.js` |

---

## Task 1: Seizoenen seeden (16 seizoenen 2010–2026)

De `seizoenen` tabel is een FK-afhankelijkheid voor alle andere Monitor-tabellen.

**Files:**
- Create: `scripts/herstel/01-seizoenen.js`

- [ ] **Stap 1: Maak de herstel-directory aan**

```bash
mkdir -p scripts/herstel
```

- [ ] **Stap 2: Schrijf 01-seizoenen.js**

Maak `scripts/herstel/01-seizoenen.js` met deze inhoud:

```js
#!/usr/bin/env node
/**
 * Herstel: seed de seizoenen tabel (2010-2011 t/m 2025-2026).
 * Gebruik: DATABASE_URL=... node scripts/herstel/01-seizoenen.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../apps/web/.env") });
const { Client } = require("pg");

const SEIZOENEN = [
  "2010-2011","2011-2012","2012-2013","2013-2014","2014-2015",
  "2015-2016","2016-2017","2017-2018","2018-2019","2019-2020",
  "2020-2021","2021-2022","2022-2023","2023-2024","2024-2025","2025-2026",
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let aangemaakt = 0;
  let overgeslagen = 0;

  for (const seizoen of SEIZOENEN) {
    const [startStr, eindStr] = seizoen.split("-");
    const startJaar = parseInt(startStr);
    const eindJaar = parseInt(eindStr);
    const startDatum = `${startJaar}-08-01`;
    const eindDatum = `${eindJaar}-06-30`;
    const peildatum = `${startJaar}-12-31`;

    try {
      await client.query(
        `INSERT INTO seizoenen (seizoen, start_jaar, eind_jaar, start_datum, eind_datum, peildatum, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIEF')
         ON CONFLICT (seizoen) DO NOTHING`,
        [seizoen, startJaar, eindJaar, startDatum, eindDatum, peildatum]
      );
      aangemaakt++;
      console.log(`✓ ${seizoen}`);
    } catch (e) {
      console.error(`✗ ${seizoen}: ${e.message}`);
      overgeslagen++;
    }
  }

  const { rows } = await client.query("SELECT COUNT(*) FROM seizoenen");
  console.log(`\nResultaat: ${aangemaakt} aangemaakt, ${overgeslagen} overgeslagen`);
  console.log(`Totaal in DB: ${rows[0].count} seizoenen`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Stap 3: Script uitvoeren**

```bash
node scripts/herstel/01-seizoenen.js
```

Verwacht output:
```
✓ 2010-2011
✓ 2011-2012
... (16 regels)
Resultaat: 16 aangemaakt, 0 overgeslagen
Totaal in DB: 16 seizoenen
```

- [ ] **Stap 4: Verifieer in DB**

```bash
node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT COUNT(*) FROM seizoenen')).then(r => { console.log('Seizoenen:', r.rows[0].count); c.end(); });
"
```

Verwacht: `Seizoenen: 16`

---

## Task 2: Leden herstellen (1690 records)

De `leden` tabel bevat stamgegevens van alle leden ooit ingeschreven. Bron: `data/leden/alle-leden.json`.

**Files:**
- Create: `scripts/herstel/02-leden.js`

- [ ] **Stap 1: Controleer schema leden tabel**

```bash
node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect()
  .then(() => c.query(\"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leden' ORDER BY ordinal_position\"))
  .then(r => { r.rows.forEach(row => console.log(row.column_name, ':', row.data_type)); c.end(); });
"
```

Noteer de kolommen — gebruik deze in het script hieronder.

- [ ] **Stap 2: Schrijf 02-leden.js**

Maak `scripts/herstel/02-leden.js`:

```js
#!/usr/bin/env node
/**
 * Herstel: laad leden-stamgegevens uit data/leden/alle-leden.json.
 * Gebruik: DATABASE_URL=... node scripts/herstel/02-leden.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../apps/web/.env") });
const { Client } = require("pg");
const path = require("path");
const fs = require("fs");

const JSON_PATH = path.resolve(__dirname, "../../data/leden/alle-leden.json");

async function main() {
  const { leden } = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
  console.log(`Geladen: ${leden.length} leden uit JSON`);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let nieuw = 0;
  let bijgewerkt = 0;
  let fouten = 0;

  for (const lid of leden) {
    if (!lid.rel_code) { fouten++; continue; }

    try {
      const result = await client.query(
        `INSERT INTO leden (rel_code, roepnaam, achternaam, tussenvoegsel, voorletters,
                            geslacht, geboortedatum, geboortejaar, lid_sinds, afmelddatum, lidsoort)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (rel_code) DO UPDATE SET
           roepnaam = EXCLUDED.roepnaam,
           achternaam = EXCLUDED.achternaam,
           tussenvoegsel = EXCLUDED.tussenvoegsel,
           voorletters = EXCLUDED.voorletters,
           geslacht = EXCLUDED.geslacht,
           geboortedatum = EXCLUDED.geboortedatum,
           geboortejaar = EXCLUDED.geboortejaar,
           lid_sinds = EXCLUDED.lid_sinds,
           afmelddatum = EXCLUDED.afmelddatum,
           lidsoort = EXCLUDED.lidsoort
         RETURNING (xmax = 0) AS inserted`,
        [
          lid.rel_code,
          lid.roepnaam || null,
          lid.achternaam || null,
          lid.tussenvoegsel || null,
          lid.voorletters || null,
          lid.geslacht || null,
          lid.geboortedatum || null,
          lid.geboortejaar || null,
          lid.lid_sinds || null,
          lid.afmelddatum || null,
          lid.lidsoort || null,
        ]
      );
      if (result.rows[0]?.inserted) nieuw++; else bijgewerkt++;
    } catch (e) {
      console.error(`✗ ${lid.rel_code}: ${e.message}`);
      fouten++;
    }
  }

  const { rows } = await client.query("SELECT COUNT(*) FROM leden");
  console.log(`\nResultaat: ${nieuw} nieuw, ${bijgewerkt} bijgewerkt, ${fouten} fouten`);
  console.log(`Totaal in DB: ${rows[0].count} leden`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Stap 3: Script uitvoeren**

```bash
node scripts/herstel/02-leden.js
```

Verwacht output:
```
Geladen: 1690 leden uit JSON
Resultaat: ~1690 nieuw, 0 bijgewerkt, 0 fouten
Totaal in DB: 1690 leden
```

Als er fouten zijn met kolommen: loop eerst stap 1 uit en pas het INSERT-statement aan op de gevonden kolomnamen.

- [ ] **Stap 4: Verifieer**

```bash
node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect()
  .then(() => c.query('SELECT COUNT(*) as n, COUNT(CASE WHEN afmelddatum IS NULL THEN 1 END) as actief FROM leden'))
  .then(r => { console.log('Leden:', r.rows[0].n, '| Actief (geen afmelddatum):', r.rows[0].actief); c.end(); });
"
```

---

## Task 3: competitie_spelers herstellen

Herstel historische spelersdata uit de export (2021–2026) + actuele Sportlink CSV (2025-2026 veld_voorjaar).

**Files:**
- Create: `scripts/herstel/03-competitie-spelers.js`

**Beperking:** Spelerspaden in de export bevatten slechts 1 team per speler per seizoen (geen uitsplitsing naar veld_najaar/zaal/veld_voorjaar). We schrijven deze in als `competitie = 'veld_najaar'` zodat de VIEW `speler_seizoenen` correct werkt. Data vóór 2021-2022 voor inmiddels vertrokken spelers is permanent verloren.

- [ ] **Stap 1: Schrijf 03-competitie-spelers.js**

Maak `scripts/herstel/03-competitie-spelers.js`:

```js
#!/usr/bin/env node
/**
 * Herstel: laad competitie_spelers uit export-2026-2027.json (spelerspaden 2021-2026)
 * én uit de actuele Sportlink CSV voor 2025-2026 veld_voorjaar.
 *
 * Bron 1: data/export/export-2026-2027.json → spelerspaden per speler
 * Bron 2: data/leden/Leden 528 personen gevonden.csv → actieve leden 2025-2026
 *
 * Gebruik: DATABASE_URL=... node scripts/herstel/03-competitie-spelers.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../apps/web/.env") });
const { Client } = require("pg");
const path = require("path");
const fs = require("fs");

const EXPORT_PATH = path.resolve(__dirname, "../../data/export/export-2026-2027.json");
const CSV_PATH = path.resolve(__dirname, "../../data/leden/Leden 528 personen gevonden.csv");

// Parse semicolon-separated CSV (met quoted fields)
function parseCsvLine(line) {
  const vals = [];
  let current = "";
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ";" && !inQuote) { vals.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  vals.push(current.trim());
  return vals;
}

function parseSportlinkCsv(csvContent) {
  const lines = csvContent.split("\n").filter(l => l.trim());
  const header = parseCsvLine(lines[0]);
  // Kolommen: Naam;Roepnaam;Voorletter(s);Tussenvoegsel(s);Achternaam;Lidsoort;Rel. code;Geslacht;Geb.dat.;...;Lokale teams;...
  const relIdx = header.findIndex(h => h.includes("Rel. code"));
  const geslIdx = header.findIndex(h => h.includes("Geslacht"));
  const teamIdx = header.findIndex(h => h.includes("Lokale teams"));
  const lidsoortIdx = header.findIndex(h => h.includes("Lidsoort"));

  const spelers = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const relCode = cols[relIdx];
    const geslacht = cols[geslIdx] === "Man" ? "M" : cols[geslIdx] === "Vrouw" ? "V" : null;
    const teams = cols[teamIdx] ? cols[teamIdx].split(",").map(t => t.trim()).filter(Boolean) : [];
    const lidsoort = cols[lidsoortIdx] || "";

    if (!relCode || !relCode.match(/^[A-Z]{3}\d{2}[A-Z]\d$/)) continue;
    if (!["Bondslid", "Recreatielid"].includes(lidsoort)) continue; // skip oud-leden

    spelers.push({ relCode, geslacht, teams });
  }
  return spelers;
}

async function upsertRecord(client, { relCode, seizoen, competitie, team, geslacht }) {
  await client.query(
    `INSERT INTO competitie_spelers (rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar)
     VALUES ($1, $2, $3, $4, $5, 'herstel', true)
     ON CONFLICT (rel_code, seizoen, competitie) DO UPDATE SET
       team = EXCLUDED.team,
       geslacht = COALESCE(EXCLUDED.geslacht, competitie_spelers.geslacht),
       bron = EXCLUDED.bron`,
    [relCode, seizoen, competitie, team || null, geslacht || null]
  );
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Laad geslacht-lookup vanuit leden tabel
  const { rows: ledenRows } = await client.query("SELECT rel_code, geslacht FROM leden");
  const geslachtMap = {};
  ledenRows.forEach(r => { geslachtMap[r.rel_code] = r.geslacht; });
  console.log(`Geslacht-lookup: ${ledenRows.length} leden`);

  let totaal = 0;
  let fouten = 0;

  // === BRON 1: Spelerspaden uit export (2021-2026) ===
  console.log("\nBron 1: spelerspaden uit export-2026-2027.json");
  const { spelers } = JSON.parse(fs.readFileSync(EXPORT_PATH, "utf-8"));

  for (const speler of spelers) {
    const geslacht = speler.geslacht || geslachtMap[speler.id] || null;
    for (const pad of (speler.spelerspad || [])) {
      if (!pad.seizoen || !pad.team) continue;
      try {
        await upsertRecord(client, {
          relCode: speler.id,
          seizoen: pad.seizoen,
          competitie: "veld_najaar", // beste benadering voor seizoenssamenvatting
          team: pad.team,
          geslacht,
        });
        totaal++;
      } catch (e) {
        console.error(`✗ ${speler.id} ${pad.seizoen}: ${e.message}`);
        fouten++;
      }
    }
  }
  console.log(`  → ${totaal} spelerspad-records ingevoegd`);

  // === BRON 2: Sportlink CSV 2025-2026 veld_voorjaar ===
  console.log("\nBron 2: Sportlink CSV 2025-2026");
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const csvSpelers = parseSportlinkCsv(csvContent);
  console.log(`  Gevonden: ${csvSpelers.length} actieve leden`);

  let csvNieuw = 0;
  for (const s of csvSpelers) {
    const geslacht = s.geslacht || geslachtMap[s.relCode] || null;
    // Gebruik het eerste lokale team (primaire team)
    const team = s.teams[0] || null;
    try {
      await upsertRecord(client, {
        relCode: s.relCode,
        seizoen: "2025-2026",
        competitie: "veld_voorjaar",
        team,
        geslacht,
      });
      csvNieuw++;
    } catch (e) {
      if (!e.message.includes("foreign key")) {
        console.error(`✗ CSV ${s.relCode}: ${e.message}`);
        fouten++;
      }
    }
  }
  console.log(`  → ${csvNieuw} CSV-records ingevoegd/bijgewerkt`);

  // Eindtelling
  const { rows } = await client.query("SELECT COUNT(*) FROM competitie_spelers");
  const { rows: r2 } = await client.query("SELECT COUNT(DISTINCT rel_code) as spelers, COUNT(DISTINCT seizoen) as seizoenen FROM competitie_spelers");
  console.log(`\nTotaal competitie_spelers: ${rows[0].count} records`);
  console.log(`Unieke spelers: ${r2[0].spelers} | Unieke seizoenen: ${r2[0].seizoenen}`);
  console.log(`Fouten: ${fouten}`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Stap 2: Script uitvoeren**

```bash
node scripts/herstel/03-competitie-spelers.js
```

Verwacht output:
```
Geslacht-lookup: 1690 leden
Bron 1: spelerspaden uit export-2026-2027.json
  → ~914 spelerspad-records ingevoegd
Bron 2: Sportlink CSV 2025-2026
  Gevonden: ~400 actieve leden
  → ~400 CSV-records ingevoegd/bijgewerkt
Totaal competitie_spelers: ~1100+ records
Unieke spelers: ~400+ | Unieke seizoenen: 5
Fouten: 0
```

- [ ] **Stap 3: FK-fouten oplossen (indien aanwezig)**

Als je FK-fouten ziet voor seizoen: controleer of seizoen in de seizoenen tabel staat:
```bash
node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT seizoen FROM seizoenen ORDER BY seizoen')).then(r => { r.rows.forEach(row => console.log(row.seizoen)); c.end(); });
"
```

Als FK-fouten voor rel_code: controleer leden tabel (Task 2 nog niet gerund?).

- [ ] **Stap 4: VIEW controleren**

De `speler_seizoenen` VIEW is een afgeleide view. Controleer of deze nog bestaat:
```bash
node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect()
  .then(() => c.query('SELECT COUNT(*) FROM speler_seizoenen WHERE seizoen = \'2025-2026\''))
  .then(r => { console.log('speler_seizoenen 2025-2026:', r.rows[0].count); c.end(); })
  .catch(e => { console.error('VIEW ONTBREEKT:', e.message); c.end(); });
"
```

Als de VIEW ontbreekt, herstel deze:
```bash
pnpm db:ensure-views
```

---

## Task 4: Ledenverloop herberekenen

Ledenverloop berekent uitstroom, instroom en retentie per seizoenspaar.

**Files:**
- Create: `scripts/herstel/04-run-verloop.sh`

- [ ] **Stap 1: Schrijf 04-run-verloop.sh**

Maak `scripts/herstel/04-run-verloop.sh`:

```bash
#!/bin/bash
# Herstel: herbereken ledenverloop tabel
set -e

echo "=== Ledenverloop herberekenen ==="

# Leeg de tabel eerst (anders dubbele records)
node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('TRUNCATE ledenverloop')).then(() => { console.log('ledenverloop geleegd'); c.end(); });
"

# Herbereken
DATABASE_URL=$(node -e "require('dotenv').config({path:'apps/web/.env'}); console.log(process.env.DATABASE_URL)") \
  node -r dotenv/config scripts/js/bereken-verloop.js

# Verifieer
node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT COUNT(*) FROM ledenverloop')).then(r => { console.log('ledenverloop records:', r.rows[0].count); c.end(); });
"
```

- [ ] **Stap 2: Script uitvoeren**

```bash
bash scripts/herstel/04-run-verloop.sh
```

Verwacht output:
```
ledenverloop geleegd
Ledenverloop berekenen uit database...
... (bereken-verloop output)
ledenverloop records: 1000+
```

---

## Task 5: Cohort_seizoenen herberekenen

Cohortdata groepeert retentie per geboortejaar × geslacht × seizoen.

**Files:**
- Create: `scripts/herstel/05-run-cohorten.sh`

- [ ] **Stap 1: Schrijf 05-run-cohorten.sh**

Maak `scripts/herstel/05-run-cohorten.sh`:

```bash
#!/bin/bash
set -e

echo "=== Cohort_seizoenen herberekenen ==="

node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('TRUNCATE cohort_seizoenen')).then(() => { console.log('cohort_seizoenen geleegd'); c.end(); });
"

DATABASE_URL=$(node -e "require('dotenv').config({path:'apps/web/.env'}); console.log(process.env.DATABASE_URL)") \
  node -r dotenv/config scripts/js/bereken-cohorten.js

node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT COUNT(*) FROM cohort_seizoenen')).then(r => { console.log('cohort_seizoenen records:', r.rows[0].count); c.end(); });
"
```

- [ ] **Stap 2: Script uitvoeren**

```bash
bash scripts/herstel/05-run-cohorten.sh
```

Verwacht: `cohort_seizoenen records: 500+`

---

## Task 6: Signalering herberekenen

Stoplicht-alerts op basis van ledenverloop en cohortdata.

**Files:**
- Create: `scripts/herstel/06-run-signalering.sh`

- [ ] **Stap 1: Schrijf 06-run-signalering.sh**

Maak `scripts/herstel/06-run-signalering.sh`:

```bash
#!/bin/bash
set -e

echo "=== Signalering herberekenen ==="

node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('TRUNCATE signalering')).then(() => { console.log('signalering geleegd'); c.end(); });
"

DATABASE_URL=$(node -e "require('dotenv').config({path:'apps/web/.env'}); console.log(process.env.DATABASE_URL)") \
  node -r dotenv/config scripts/js/genereer-signalering.js

node -e "
require('dotenv').config({ path: 'apps/web/.env' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT id, type, niveau FROM signalering')).then(r => { r.rows.forEach(r => console.log(r.niveau, r.type)); c.end(); });
"
```

- [ ] **Stap 2: Script uitvoeren**

```bash
bash scripts/herstel/06-run-signalering.sh
```

---

## Task 7: Eindverificatie

Controleer het volledige herstel en rapporteer de toestand.

**Files:**
- Create: `scripts/herstel/07-verify.js`

- [ ] **Stap 1: Schrijf 07-verify.js**

Maak `scripts/herstel/07-verify.js`:

```js
#!/usr/bin/env node
/**
 * Eindverificatie na database herstel.
 * Gebruik: DATABASE_URL=... node scripts/herstel/07-verify.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../apps/web/.env") });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const checks = [
    { label: "seizoenen", query: "SELECT COUNT(*) FROM seizoenen", min: 16 },
    { label: "leden", query: "SELECT COUNT(*) FROM leden", min: 1000 },
    { label: "competitie_spelers", query: "SELECT COUNT(*) FROM competitie_spelers", min: 500 },
    { label: "speler_seizoenen (VIEW)", query: "SELECT COUNT(*) FROM speler_seizoenen WHERE seizoen = '2025-2026'", min: 100 },
    { label: "ledenverloop", query: "SELECT COUNT(*) FROM ledenverloop", min: 100 },
    { label: "cohort_seizoenen", query: "SELECT COUNT(*) FROM cohort_seizoenen", min: 50 },
    { label: "signalering", query: "SELECT COUNT(*) FROM signalering", min: 0 },
    { label: "Speler (TI Studio)", query: 'SELECT COUNT(*) FROM "Speler"', min: 250 },
    { label: "werkindelingen", query: "SELECT COUNT(*) FROM werkindelingen", min: 1 },
  ];

  console.log("=== Database Herstel Verificatie ===\n");
  let ok = true;
  for (const check of checks) {
    try {
      const { rows } = await client.query(check.query);
      const count = parseInt(rows[0].count);
      const status = count >= check.min ? "✅" : "⚠️ ";
      console.log(`${status} ${check.label}: ${count} records (min: ${check.min})`);
      if (count < check.min) ok = false;
    } catch (e) {
      console.log(`❌ ${check.label}: FOUT — ${e.message}`);
      ok = false;
    }
  }

  // Seizoenen-dekking
  const { rows: dekking } = await client.query(
    `SELECT seizoen, COUNT(DISTINCT rel_code)::int as spelers
     FROM competitie_spelers
     GROUP BY seizoen
     ORDER BY seizoen`
  );
  console.log("\n=== Spelers per seizoen ===");
  dekking.forEach(r => console.log(`  ${r.seizoen}: ${r.spelers} spelers`));

  console.log(`\n${ok ? "✅ Herstel geslaagd" : "⚠️  Herstel gedeeltelijk — zie waarschuwingen hierboven"}`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Stap 2: Verificatie uitvoeren**

```bash
node scripts/herstel/07-verify.js
```

Verwacht eindresultaat (na alle tasks):
```
✅ seizoenen: 16 records
✅ leden: 1690 records
✅ competitie_spelers: 900+ records
✅ speler_seizoenen (VIEW): 200+ records (2025-2026)
✅ ledenverloop: 1000+ records
✅ cohort_seizoenen: 500+ records
✅ signalering: variabel
✅ Speler (TI Studio): 253 records
✅ werkindelingen: 1 record
✅ Herstel geslaagd
```

---

## Uitvoervolgorde (samenvatting)

```
Task 1: node scripts/herstel/01-seizoenen.js
Task 2: node scripts/herstel/02-leden.js
Task 3: node scripts/herstel/03-competitie-spelers.js
Task 4: bash scripts/herstel/04-run-verloop.sh
Task 5: bash scripts/herstel/05-run-cohorten.sh
Task 6: bash scripts/herstel/06-run-signalering.sh
Task 7: node scripts/herstel/07-verify.js
```

**Elke stap pas starten als de vorige succesvol is afgerond.**

---

## Bekende beperkingen

| Beperking | Impact |
|---|---|
| competitie_spelers vóór 2021-2022 van uitgestroomde leden: verloren | Ledenverloop-berekeningen minder accuraat voor vroege seizoenen |
| Competitie-type (veld_najaar/zaal/veld_voorjaar) uit spelerspaden niet bekend | Spelerspaden geïmporteerd als veld_najaar; veld_voorjaar uit CSV |
| Geen historische export vóór 2021 | 2010-2020 dekking afhankelijk van wie nog actief is |

## Na herstel: back-up strategie opzetten

Na succesvol herstel: zie `docs/superpowers/plans/` voor een apart plan om Railway back-ups te activeren en wekelijkse dumps te automatiseren. Dit incident maakt duidelijk dat we automatische backups nodig hebben.
