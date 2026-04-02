# OWTeam Naamgeving Structureel — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vervang het verouderde OW-teamnaamgevingssysteem (A1/B2/C3) door een structureel systeem met kleur+nummer namen, een optionele alias per team, en een harde FK-koppeling van elke competitiespeler-rij aan het juiste OW-seizoensteam.

**Architecture:** Prisma-migratie voegt `OWTeamType` enum + `alias` veld toe aan `teams` en `ow_team_id` FK aan `competitie_spelers`. Een datamigratescript ruimt 2025-2026 op en vult de alias-tabel. De VIEW `speler_seizoenen` krijgt OW-teamvelden via LEFT JOIN. Het import-script krijgt een alias-stap die na elke import `ow_team_id` invult.

**Tech Stack:** Prisma 7, PostgreSQL 16, Node.js (pg), TypeScript (tsx), Vitest

---

## Bestandsoverzicht

| Bestand | Actie | Verantwoordelijkheid |
|---|---|---|
| `packages/database/prisma/schema.prisma` | Wijzigen | `OWTeamType` enum, `alias` op OWTeam, `owTeamId` op CompetitieSpeler |
| `packages/database/prisma/migrations/20260402500000_ow_team_type_alias_fk/` | Aanmaken | SQL migratie |
| `scripts/migrate-teams-2025-2026.ts` | Aanmaken | OW-teams opschonen, nieuwe aanmaken, aliases vullen, backfill owTeamId |
| `scripts/migrate-teams-historisch.ts` | Aanmaken | Alias-tabel vullen voor seizoenen 2010-2024, owTeamId backfill |
| `scripts/import/import-sportlink-zaal.ts` | Wijzigen | Alias-stap na import: owTeamId oplossen |
| `apps/web/src/lib/monitor/queries/teams.ts` | Wijzigen | `alias` en `teamType` meegeven in TeamRegisterEntry |
| `apps/web/src/lib/monitor/queries/teams.test.ts` | Wijzigen | Tests bijwerken voor nieuwe velden |
| `apps/web/src/lib/db/ensure-views.ts` (of SQL in migratie) | Wijzigen | VIEW `speler_seizoenen` herbouwen met `ow_team_id`, `ow_team_naam`, `ow_team_kleur` |

---

## Task 1: Prisma schema — OWTeamType enum + alias + owTeamId FK

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Stap 1: Voeg OWTeamType enum toe aan schema**

Voeg toe na de `SeizoenStatus` enum in `packages/database/prisma/schema.prisma`:

```prisma
enum OWTeamType {
  JEUGD
  SELECTIE
  SENIOREN
  OVERIG
}
```

- [ ] **Stap 2: Pas OWTeam model aan**

Vervang in het `OWTeam` model:
```prisma
  naam           String?
```
door:
```prisma
  naam           String
  alias          String?
  teamType       OWTeamType @default(JEUGD) @map("team_type")
```

- [ ] **Stap 3: Voeg owTeamId FK toe aan CompetitieSpeler**

Voeg toe in het `CompetitieSpeler` model, na het `betrouwbaar` veld:
```prisma
  owTeamId   Int?     @map("ow_team_id")
  owTeamRef  OWTeam?  @relation(fields: [owTeamId], references: [id], onDelete: SetNull)
```

Voeg toe in het `OWTeam` model bij de relaties:
```prisma
  competitieSpelers CompetitieSpeler[]
```

- [ ] **Stap 4: Genereer Prisma client**

```bash
pnpm db:generate
```

Verwacht: `✔ Generated Prisma Client` zonder errors.

- [ ] **Stap 5: Maak migratie aan**

```bash
pnpm db:migrate
```

Geef als naam: `ow_team_type_alias_fk`

Verwacht: nieuwe map `packages/database/prisma/migrations/20260402500000_ow_team_type_alias_fk/` met `migration.sql`.

- [ ] **Stap 6: Controleer gegenereerde SQL**

Open de `migration.sql` en verifieer dat deze bevat:
- `CREATE TYPE "OWTeamType" AS ENUM ('JEUGD', 'SELECTIE', 'SENIOREN', 'OVERIG');`
- `ALTER TABLE "teams" ADD COLUMN "alias" TEXT;`
- `ALTER TABLE "teams" ADD COLUMN "team_type" "OWTeamType" NOT NULL DEFAULT 'JEUGD';`
- `ALTER TABLE "competitie_spelers" ADD COLUMN "ow_team_id" INTEGER;`
- `ALTER TABLE "competitie_spelers" ADD CONSTRAINT ... FOREIGN KEY ("ow_team_id") REFERENCES "teams"("id") ON DELETE SET NULL;`

Als `naam` al NOT NULL was kun je `naam` kolom-wijziging overslaan — check of de migratie een `ALTER COLUMN naam SET NOT NULL` bevat. Als `naam` nullable was in productie: voeg eerst een `UPDATE teams SET naam = ow_code WHERE naam IS NULL` toe aan de migration.sql vóór de NOT NULL constraint.

- [ ] **Stap 7: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/
git commit -m "feat(db): OWTeamType enum + alias + ow_team_id FK op competitie_spelers"
```

---

## Task 2: Datamigratescript 2025-2026

Ruimt de huidige verkeerde OW-teams voor 2025-2026 op en maakt de 31 correcte teams aan met vrije naam, kleur, teamType en J-nummer per fase. Vult daarna de `team_aliases` tabel en backfilt `ow_team_id` in `competitie_spelers`.

**Files:**
- Create: `scripts/migrate-teams-2025-2026.ts`

- [ ] **Stap 1: Maak het script aan**

```typescript
/**
 * Datamigratescript: OW-teams 2025-2026 opschonen en opnieuw aanmaken.
 *
 * Gebruik:
 *   npx tsx scripts/migrate-teams-2025-2026.ts
 *
 * Wat dit doet:
 * 1. Verwijdert verouderde OW-teams voor 2025-2026 (A1-A3, B1-B3, C1-C3)
 * 2. Maakt 31 correcte OW-teams aan met naam, kleur, teamType
 * 3. Vult TeamPeriode met j_nummer per fase voor jeugdteams
 * 4. Vult team_aliases voor 2025-2026
 * 5. Backfilt ow_team_id in competitie_spelers via aliases
 */

import "dotenv/config";
import { Client } from "pg";

const SEIZOEN = "2025-2026";

// Jeugdteams: naam → { kleur, veld_najaar_j, zaal_j, veld_voorjaar_j (indien bekend) }
const JEUGD_TEAMS: {
  naam: string;
  kleur: string;
  owCode: string;
  aliases: { fase: string; knkvNaam: string }[];
}[] = [
  {
    naam: "Rood-1", kleur: "ROOD", owCode: "OW-ROOD-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J1" },
      { fase: "zaal",        knkvNaam: "J1" },
    ],
  },
  {
    naam: "Rood-2", kleur: "ROOD", owCode: "OW-ROOD-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J2" },
      { fase: "zaal",        knkvNaam: "J2" },
    ],
  },
  {
    naam: "Oranje-1", kleur: "ORANJE", owCode: "OW-ORANJE-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J4" },
      { fase: "zaal",        knkvNaam: "J4" },
    ],
  },
  {
    naam: "Oranje-2", kleur: "ORANJE", owCode: "OW-ORANJE-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J3" },
      { fase: "zaal",        knkvNaam: "J3" },
    ],
  },
  {
    naam: "Oranje-3", kleur: "ORANJE", owCode: "OW-ORANJE-3",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J5" },
      { fase: "zaal",        knkvNaam: "J5" },
    ],
  },
  {
    naam: "Oranje-4", kleur: "ORANJE", owCode: "OW-ORANJE-4",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J6" },
      { fase: "zaal",        knkvNaam: "J6" },
    ],
  },
  {
    naam: "Geel-1", kleur: "GEEL", owCode: "OW-GEEL-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J7" },
      { fase: "zaal",        knkvNaam: "J7" },
    ],
  },
  {
    naam: "Geel-2", kleur: "GEEL", owCode: "OW-GEEL-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J8" },
      { fase: "zaal",        knkvNaam: "J8" },
    ],
  },
  {
    naam: "Geel-3", kleur: "GEEL", owCode: "OW-GEEL-3",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J9" },
      { fase: "zaal",        knkvNaam: "J9" },
    ],
  },
  {
    naam: "Geel-4", kleur: "GEEL", owCode: "OW-GEEL-4",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J10" },
      { fase: "zaal",        knkvNaam: "J10" },
    ],
  },
  {
    naam: "Groen-1", kleur: "GROEN", owCode: "OW-GROEN-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J11" },
      { fase: "zaal",        knkvNaam: "J11" },
    ],
  },
  {
    naam: "Groen-2", kleur: "GROEN", owCode: "OW-GROEN-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J12" },
      { fase: "zaal",        knkvNaam: "J12" },
    ],
  },
  {
    naam: "Groen-3", kleur: "GROEN", owCode: "OW-GROEN-3",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J13" },
      { fase: "zaal",        knkvNaam: "J13" },
    ],
  },
  {
    naam: "Groen-4", kleur: "GROEN", owCode: "OW-GROEN-4",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J14" },
      { fase: "zaal",        knkvNaam: "J14" },
    ],
  },
  {
    naam: "Blauw-1", kleur: "BLAUW", owCode: "OW-BLAUW-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J15" },
      { fase: "zaal",        knkvNaam: "J15" },
    ],
  },
  {
    naam: "Blauw-2", kleur: "BLAUW", owCode: "OW-BLAUW-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J17" },
      { fase: "zaal",        knkvNaam: "J17" },
    ],
  },
  {
    naam: "Blauw-3", kleur: "BLAUW", owCode: "OW-BLAUW-3",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J16" },
      { fase: "zaal",        knkvNaam: "J16" },
    ],
  },
  {
    naam: "Blauw-4", kleur: "BLAUW", owCode: "OW-BLAUW-4",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J18" },
      { fase: "zaal",        knkvNaam: "J18" },
    ],
  },
];

const SELECTIE_TEAMS: { naam: string; owCode: string; aliasNamen: string[] }[] = [
  { naam: "U15-1", owCode: "OW-U15-1", aliasNamen: ["U15-1"] },
  { naam: "U17-1", owCode: "OW-U17-1", aliasNamen: ["U17-1"] },
  { naam: "U17-2", owCode: "OW-U17-2", aliasNamen: ["U17-2", "U17"] },
  { naam: "U19-1", owCode: "OW-U19-1", aliasNamen: ["U19-1"] },
  { naam: "U19-2", owCode: "OW-U19-2", aliasNamen: ["U19-2", "U19"] },
];

const SENIOREN_TEAMS: { naam: string; owCode: string; aliasNamen: string[] }[] = [
  { naam: "Senioren 1", owCode: "OW-S1", aliasNamen: ["S1", "1"] },
  { naam: "Senioren 2", owCode: "OW-S2", aliasNamen: ["S2", "2"] },
  { naam: "Senioren 3", owCode: "OW-S3", aliasNamen: ["S3", "3"] },
  { naam: "Senioren 4", owCode: "OW-S4", aliasNamen: ["S4", "4"] },
  { naam: "Senioren 5", owCode: "OW-S5", aliasNamen: ["S5", "5"] },
  { naam: "Senioren 6", owCode: "OW-S6", aliasNamen: ["S6", "6"] },
];

const OVERIG_TEAMS: { naam: string; owCode: string; aliasNamen: string[] }[] = [
  { naam: "MW1",        owCode: "OW-MW1",        aliasNamen: ["MW1"] },
  { naam: "Kangoeroes", owCode: "OW-KANGOEROES", aliasNamen: ["Kangoeroes"] },
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("=== Migratie OW-teams 2025-2026 ===\n");

  // Stap 1: Verwijder verouderde jeugdteams (A1-A3, B1-B3, C1-C3)
  const verouderd = ["OW-A1","OW-A2","OW-A3","OW-B1","OW-B2","OW-B3","OW-C1","OW-C2","OW-C3"];
  const res = await client.query(
    `SELECT id FROM teams WHERE seizoen = $1 AND ow_code = ANY($2)`,
    [SEIZOEN, verouderd]
  );
  const verouderdIds = res.rows.map((r: any) => r.id);
  if (verouderdIds.length > 0) {
    await client.query(`DELETE FROM team_periodes WHERE team_id = ANY($1)`, [verouderdIds]);
    await client.query(`DELETE FROM team_aliases WHERE ow_team_id = ANY($1)`, [verouderdIds]);
    await client.query(`DELETE FROM teams WHERE id = ANY($1)`, [verouderdIds]);
    console.log(`✓ ${verouderdIds.length} verouderde teams verwijderd`);
  }

  // Stap 2: Maak jeugdteams aan
  for (const team of JEUGD_TEAMS) {
    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, kleur, team_type)
       VALUES ($1, $2, $3, 'b', $4, 'JEUGD')
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, kleur = EXCLUDED.kleur, team_type = EXCLUDED.team_type
       RETURNING id`,
      [SEIZOEN, team.owCode, team.naam, team.kleur]
    );
    const teamId = ins.rows[0].id;

    // Team periodes (j_nummer per fase)
    for (const alias of team.aliases) {
      await client.query(
        `INSERT INTO team_periodes (team_id, periode, j_nummer)
         VALUES ($1, $2, $3)
         ON CONFLICT (team_id, periode) DO UPDATE SET j_nummer = EXCLUDED.j_nummer`,
        [teamId, alias.fase, alias.knkvNaam.replace("OW ", "")]
      );
      // Alias
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id, ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias.knkvNaam, teamId, team.owCode]
      );
    }
    console.log(`  ✓ ${team.naam} (${team.owCode})`);
  }

  // Stap 3: Selectieteams
  for (const team of SELECTIE_TEAMS) {
    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, team_type)
       VALUES ($1, $2, $3, 'a', 'SELECTIE')
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, team_type = EXCLUDED.team_type
       RETURNING id`,
      [SEIZOEN, team.owCode, team.naam]
    );
    const teamId = ins.rows[0].id;
    for (const alias of team.aliasNamen) {
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id, ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias, teamId, team.owCode]
      );
    }
    console.log(`  ✓ ${team.naam} (SELECTIE)`);
  }

  // Stap 4: Senioren
  for (const team of SENIOREN_TEAMS) {
    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, team_type)
       VALUES ($1, $2, $3, 'a', 'SENIOREN')
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, team_type = EXCLUDED.team_type
       RETURNING id`,
      [SEIZOEN, team.owCode, team.naam]
    );
    const teamId = ins.rows[0].id;
    for (const alias of team.aliasNamen) {
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id, ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias, teamId, team.owCode]
      );
    }
    console.log(`  ✓ ${team.naam} (SENIOREN)`);
  }

  // Stap 5: Overig
  for (const team of OVERIG_TEAMS) {
    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, team_type)
       VALUES ($1, $2, $3, 'b', 'OVERIG')
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, team_type = EXCLUDED.team_type
       RETURNING id`,
      [SEIZOEN, team.owCode, team.naam]
    );
    const teamId = ins.rows[0].id;
    for (const alias of team.aliasNamen) {
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id, ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias, teamId, team.owCode]
      );
    }
    console.log(`  ✓ ${team.naam} (OVERIG)`);
  }

  // Stap 6: Backfill ow_team_id in competitie_spelers
  const backfill = await client.query(`
    UPDATE competitie_spelers cs
    SET ow_team_id = a.ow_team_id
    FROM team_aliases a
    WHERE a.seizoen = cs.seizoen
      AND a.alias = cs.team
      AND cs.seizoen = $1
      AND cs.ow_team_id IS NULL
  `, [SEIZOEN]);
  console.log(`\n✓ ${backfill.rowCount} competitie_spelers rijen gekoppeld (ow_team_id)`);

  // Rapport: hoeveel zijn nog null?
  const nullCheck = await client.query(
    `SELECT COUNT(*)::int as null_count FROM competitie_spelers WHERE seizoen = $1 AND ow_team_id IS NULL`,
    [SEIZOEN]
  );
  console.log(`⚠ ${nullCheck.rows[0].null_count} rijen zonder ow_team_id (onbekende KNKV-teamnamen)`);

  await client.end();
  console.log("\n=== Klaar ===");
}

main().catch((err) => {
  console.error("Migratie mislukt:", err);
  process.exit(1);
});
```

- [ ] **Stap 2: Draai migratie (lokaal eerst)**

```bash
DATABASE_URL="postgresql://postgres:owdb2026secret@localhost:5434/oranjewit" npx tsx scripts/migrate-teams-2025-2026.ts
```

Verwacht output eindigt met `✓ ... competitie_spelers rijen gekoppeld` en `⚠ X rijen zonder ow_team_id`. Controleer: het aantal null-rijen moet de `S1/S2` gecombineerde registratie + eventuele onbekende tegenstanders zijn.

- [ ] **Stap 3: Verifieer in database**

```bash
DATABASE_URL="postgresql://postgres:owdb2026secret@localhost:5434/oranjewit" node -r dotenv/config -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT t.naam, t.team_type, COUNT(cs.id)::int as spelers FROM teams t LEFT JOIN competitie_spelers cs ON cs.ow_team_id = t.id WHERE t.seizoen = '2025-2026' GROUP BY t.naam, t.team_type ORDER BY t.team_type, t.naam\").then(r => { r.rows.forEach(x => console.log(x.team_type, x.naam, x.spelers)); pool.end(); });
"
```

Verwacht: 31 teams, elk met een logisch aantal spelers.

- [ ] **Stap 4: Draai op productie**

```bash
npx tsx scripts/migrate-teams-2025-2026.ts
```

(`.env` wijst naar productie-DATABASE_URL)

- [ ] **Stap 5: Commit**

```bash
git add scripts/migrate-teams-2025-2026.ts
git commit -m "feat(db): datamigratescript OW-teams 2025-2026 — kleur+nummer + aliases + owTeamId backfill"
```

---

## Task 3: Historische alias-backfill (2024-2025 en eerder)

De oude OW-teamnamen (A1, B1, C1 etc.) waren gelijk aan de KNKV-namen. Alias-tabel vullen per seizoen zodat `ow_team_id` ook historisch klopt.

**Files:**
- Create: `scripts/migrate-teams-historisch.ts`

- [ ] **Stap 1: Maak het script aan**

```typescript
/**
 * Historische alias-backfill: team_aliases vullen voor 2010-2011 t/m 2024-2025.
 *
 * In die seizoenen waren de OW-teamnamen gelijk aan de KNKV-namen (A1 = A1 etc.),
 * dus elke ow_code wordt als alias van zichzelf geregistreerd.
 *
 * Gebruik:
 *   npx tsx scripts/migrate-teams-historisch.ts
 */

import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("=== Historische alias-backfill ===\n");

  // Haal alle historische OW-teams op (niet 2025-2026)
  const teams = await client.query(
    `SELECT id, seizoen, ow_code, naam FROM teams WHERE seizoen != '2025-2026' ORDER BY seizoen, ow_code`
  );

  let aliasInserted = 0;
  for (const team of teams.rows) {
    // De historische KNKV-naam is de ow_code zonder "OW-" prefix
    // bv. "OW-A1" → KNKV-naam "A1"
    const knkvNaam = team.ow_code.replace(/^OW-/, "");

    await client.query(
      `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (seizoen, alias) DO NOTHING`,
      [team.seizoen, knkvNaam, team.id, team.ow_code]
    );
    aliasInserted++;
  }
  console.log(`✓ ${aliasInserted} historische aliases aangemaakt`);

  // Backfill ow_team_id voor alle historische seizoenen
  const backfill = await client.query(`
    UPDATE competitie_spelers cs
    SET ow_team_id = a.ow_team_id
    FROM team_aliases a
    WHERE a.seizoen = cs.seizoen
      AND a.alias = cs.team
      AND cs.seizoen != '2025-2026'
      AND cs.ow_team_id IS NULL
  `);
  console.log(`✓ ${backfill.rowCount} historische competitie_spelers rijen gekoppeld`);

  const nullCheck = await client.query(
    `SELECT seizoen, COUNT(*)::int as null_count FROM competitie_spelers WHERE seizoen != '2025-2026' AND ow_team_id IS NULL GROUP BY seizoen ORDER BY seizoen DESC`
  );
  if (nullCheck.rows.length > 0) {
    console.log("⚠ Nog ontkoppelde rijen per seizoen:");
    nullCheck.rows.forEach((r: any) => console.log(`  ${r.seizoen}: ${r.null_count} rijen`));
  }

  await client.end();
  console.log("\n=== Klaar ===");
}

main().catch((err) => {
  console.error("Mislukt:", err);
  process.exit(1);
});
```

- [ ] **Stap 2: Draai lokaal, verifieer output**

```bash
DATABASE_URL="postgresql://postgres:owdb2026secret@localhost:5434/oranjewit" npx tsx scripts/migrate-teams-historisch.ts
```

Verwacht: honderden aliases aangemaakt, nul of weinig null-rijen over.

- [ ] **Stap 3: Draai op productie**

```bash
npx tsx scripts/migrate-teams-historisch.ts
```

- [ ] **Stap 4: Commit**

```bash
git add scripts/migrate-teams-historisch.ts
git commit -m "feat(db): historische alias-backfill + owTeamId koppeling pre-2025-2026"
```

---

## Task 4: VIEW speler_seizoenen uitbreiden

**Files:**
- Modify: `apps/web/src/lib/db/ensure-views.ts` (of het SQL-bestand dat de VIEW definieert)

- [ ] **Stap 1: Zoek de VIEW-definitie**

```bash
grep -rn "speler_seizoenen" packages/database/prisma/migrations --include="*.sql" -l
grep -rn "CREATE.*VIEW.*speler_seizoenen\|speler_seizoenen" apps/web/src/lib/db/ -l
```

- [ ] **Stap 2: Vervang de VIEW**

Zoek de `CREATE OR REPLACE VIEW speler_seizoenen` definitie en voeg drie kolommen toe via LEFT JOIN:

```sql
CREATE OR REPLACE VIEW speler_seizoenen AS
SELECT DISTINCT ON (cs.rel_code, cs.seizoen)
  cs.rel_code,
  cs.seizoen,
  cs.competitie,
  cs.team,
  cs.geslacht,
  cs.bron,
  cs.betrouwbaar,
  cs.ow_team_id,
  t.naam  AS ow_team_naam,
  t.alias AS ow_team_alias,
  t.kleur AS ow_team_kleur
FROM competitie_spelers cs
LEFT JOIN teams t ON t.id = cs.ow_team_id
ORDER BY cs.rel_code, cs.seizoen,
  CASE cs.competitie
    WHEN 'veld_najaar'  THEN 1
    WHEN 'zaal'         THEN 2
    WHEN 'veld_voorjaar' THEN 3
    ELSE 4
  END;
```

Pas de exacte kolommen aan op wat de VIEW al retourneert (voeg de vier nieuwe kolommen toe, verwijder niets).

- [ ] **Stap 3: Herstel de VIEW**

```bash
pnpm db:ensure-views
```

Verwacht: `✓ VIEW speler_seizoenen aangemaakt/bijgewerkt`

- [ ] **Stap 4: Verifieer**

```bash
node -r dotenv/config -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT rel_code, team, ow_team_id, ow_team_naam, ow_team_kleur FROM speler_seizoenen WHERE seizoen = '2025-2026' LIMIT 5\").then(r => { r.rows.forEach(x => console.log(JSON.stringify(x))); pool.end(); });
"
```

Verwacht: rijen met ingevulde `ow_team_naam` en `ow_team_kleur` voor bekende teams.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/lib/db/ensure-views.ts  # of het betreffende SQL bestand
git commit -m "feat(db): VIEW speler_seizoenen uitbreiden met ow_team_id, naam, alias, kleur"
```

---

## Task 5: Import-script — alias-stap na import

**Files:**
- Modify: `scripts/import/import-sportlink-zaal.ts`

- [ ] **Stap 1: Voeg alias-stap toe na de insert-loop**

Voeg toe na de bestaande insert-loop (na `console.log(\`✓ ${inserted} spelers...\`)`):

```typescript
  // Alias-stap: koppel ow_team_id via team_aliases
  const aliasResult = await client.query(`
    UPDATE competitie_spelers cs
    SET ow_team_id = a.ow_team_id
    FROM team_aliases a
    WHERE a.seizoen = cs.seizoen
      AND a.alias = cs.team
      AND cs.seizoen = $1
      AND cs.competitie = $2
      AND cs.ow_team_id IS NULL
  `, [SEIZOEN, COMPETITIE]);
  console.log(`✓ ${aliasResult.rowCount} spelers gekoppeld aan OW-team (ow_team_id)`);

  // Waarschuw voor onbekende teams
  const onbekend = await client.query(`
    SELECT DISTINCT cs.team, COUNT(*)::int as spelers
    FROM competitie_spelers cs
    WHERE cs.seizoen = $1 AND cs.competitie = $2 AND cs.ow_team_id IS NULL
    GROUP BY cs.team ORDER BY cs.team
  `, [SEIZOEN, COMPETITIE]);
  if (onbekend.rows.length > 0) {
    console.warn(`⚠ ${onbekend.rows.length} onbekende teams (geen alias gevonden):`);
    onbekend.rows.forEach((r: any) => console.warn(`  "${r.team}" (${r.spelers} spelers)`));
  }
```

- [ ] **Stap 2: Draai het script opnieuw (idempotent)**

```bash
npx tsx scripts/import/import-sportlink-zaal.ts
```

Verwacht: script loopt door, alias-stap koppelt spelers, onbekende teams worden gemeld.

- [ ] **Stap 3: Commit**

```bash
git add scripts/import/import-sportlink-zaal.ts
git commit -m "feat(import): alias-stap na zaal-import — owTeamId koppelen via team_aliases"
```

---

## Task 6: Monitor teams query — alias en teamType toevoegen

**Files:**
- Modify: `apps/web/src/lib/monitor/queries/teams.ts`
- Modify: `apps/web/src/lib/monitor/queries/teams.test.ts`

- [ ] **Stap 1: Pas `TeamRegisterEntry` type aan**

Voeg toe in `apps/web/src/lib/monitor/queries/teams.ts`:

```typescript
export type TeamRegisterEntry = {
  id: number;
  ow_code: string;
  naam: string | null;
  alias: string | null;       // nieuw
  teamType: string | null;    // nieuw: "JEUGD" | "SELECTIE" | "SENIOREN" | "OVERIG"
  categorie: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
  spelvorm: string | null;
  isSelectie: boolean;
  selectieOwCode: string | null;
  sortOrder: number | null;
  periodes: Record<PeriodeNaam, PeriodeData | null>;
};
```

- [ ] **Stap 2: Voeg `alias` en `team_type` toe aan de raw query**

In de `$queryRaw` in `getTeamsRegister`, voeg toe aan de SELECT:
```sql
  t.alias,
  t.team_type,
```

En voeg toe aan het type van de raw query result:
```typescript
  alias: string | null;
  team_type: string | null;
```

- [ ] **Stap 3: Voeg toe aan de grouped entry mapping**

In de reduce/grouping logica waar een `TeamRegisterEntry` aangemaakt wordt:
```typescript
  alias: row.alias,
  teamType: row.team_type,
```

- [ ] **Stap 4: Pas de test aan**

In `apps/web/src/lib/monitor/queries/teams.test.ts`, voeg `alias: null` en `teamType: 'JEUGD'` toe aan de mock-data en expected output.

- [ ] **Stap 5: Draai de tests**

```bash
pnpm test -- teams
```

Verwacht: alle tests groen.

- [ ] **Stap 6: Typecheck**

```bash
pnpm --filter web typecheck
```

Verwacht: 0 errors.

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/lib/monitor/queries/teams.ts apps/web/src/lib/monitor/queries/teams.test.ts
git commit -m "feat(monitor): alias en teamType toevoegen aan TeamsRegister query"
```

---

## Task 7: Eindcontrole en typecheck

- [ ] **Stap 1: Draai alle unit tests**

```bash
pnpm test
```

Verwacht: 0 failures.

- [ ] **Stap 2: Typecheck volledig**

```bash
pnpm --filter web typecheck
```

Verwacht: 0 errors.

- [ ] **Stap 3: Verifieer /monitor/teams in de browser**

Start `pnpm dev` en open `http://localhost:3000/monitor/teams` voor seizoen 2025-2026.

Verwacht:
- 31 teams zichtbaar (18 jeugd + 5 selectie + 6 senioren + 2 overig)
- Jeugdteams tonen `Rood-1`, `Geel-3` etc. als naam
- Selecties tonen `U17-1`, `U19-2` etc.
- Senioren tonen `Senioren 1` t/m `Senioren 6`

- [ ] **Stap 4: Sluit PR**

```bash
git push origin main
```

---

## Openstaand: S1/S2 gecombineerde registratie

In `veld_najaar` 2025-2026 staat één KNKV-teamnaam `S1/S2` voor 22 spelers — dit zijn Senioren 1 én Senioren 2 gecombineerd. Na de migratie zullen deze spelers `ow_team_id = null` hebben want `S1/S2` matcht op geen van beide aliases.

**Beslissing bij implementatie:** óf voeg alias `S1/S2 → Senioren 1` toe (accepteer dat S2-spelers fout gekoppeld zijn), óf laat `null` staan en verwerk handmatig. TC adviseren welke spelers S1 vs S2 zijn voor dat seizoen.
