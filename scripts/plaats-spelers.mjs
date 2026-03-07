#!/usr/bin/env node
/**
 * CLI tool voor het snel plaatsen van spelers in scenario-teams.
 *
 * Gebruik:
 *   node scripts/plaats-spelers.mjs --scenario "0.1" --show
 *   node scripts/plaats-spelers.mjs --scenario "0.1" --team "Groen-2" --huidig-team "Groen E3"
 *   node scripts/plaats-spelers.mjs --scenario "0.1" --team "Blauw-1" --geslacht M --jaar 2010-2012
 *   node scripts/plaats-spelers.mjs --scenario "0.1" --team "Oranje-3" --kleur ORANJE --geslacht V
 *   node scripts/plaats-spelers.mjs --scenario "0.1" --team "Blauw-1" --ids "NJH39X4,ABC123"
 *   node scripts/plaats-spelers.mjs --scenario "0.1" --pool              # toon beschikbare spelers
 *   node scripts/plaats-spelers.mjs --scenario "0.1" --pool --kleur GROEN
 *
 * Voeg --dry toe om alleen te zien wat er zou gebeuren zonder wijzigingen.
 */

import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const scenarioNaam = getArg("scenario");
const teamNaam = getArg("team");
const huidigTeam = getArg("huidig-team");
const kleur = getArg("kleur");
const geslacht = getArg("geslacht");
const jaarRange = getArg("jaar");
const spelerIds = getArg("ids");
const showMode = hasFlag("show");
const poolMode = hasFlag("pool");
const dryRun = hasFlag("dry");

if (!scenarioNaam) {
  console.log(`Gebruik: node scripts/plaats-spelers.mjs --scenario "0.1" [opties]

Opties:
  --show                   Toon huidige teamindeling
  --pool                   Toon beschikbare (niet-ingedeelde) spelers
  --team "Groen-2"         Doelteam voor plaatsing
  --huidig-team "Groen E3" Filter op huidig team (bevat-match)
  --kleur GROEN            Filter op huidige kleurgroep
  --geslacht M             Filter op geslacht (M/V)
  --jaar 2014-2015         Filter op geboortejaar (range of enkel)
  --ids "NJH39X4,ABC123"   Specifieke speler-IDs
  --dry                    Dry-run: toon wat er zou gebeuren`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Zoek scenario
const { rows: scenarios } = await client.query(
  `SELECT s.id, s.naam, s.status FROM "Scenario" s WHERE s.naam LIKE $1`,
  [`%${scenarioNaam}%`]
);

if (scenarios.length === 0) {
  console.error(`Geen scenario gevonden met naam "${scenarioNaam}"`);
  await client.end();
  process.exit(1);
}
if (scenarios.length > 1) {
  console.error(`Meerdere scenario's gevonden: ${scenarios.map((s) => s.naam).join(", ")}`);
  await client.end();
  process.exit(1);
}

const scenario = scenarios[0];
console.log(`\nScenario: ${scenario.naam} (${scenario.status})`);

// Haal laatste versie
const { rows: versies } = await client.query(
  `SELECT id, nummer FROM "Versie" WHERE "scenarioId" = $1 ORDER BY nummer DESC LIMIT 1`,
  [scenario.id]
);
const versie = versies[0];
if (!versie) {
  console.error("Geen versie gevonden");
  await client.end();
  process.exit(1);
}

// Haal alle teams met spelers
const { rows: teams } = await client.query(
  `SELECT id, naam, categorie, kleur, volgorde, "selectieGroepId" FROM "Team" WHERE "versieId" = $1 ORDER BY volgorde`,
  [versie.id]
);

// === SHOW MODE ===
if (showMode) {
  let totaalSpelers = 0;

  const { rows: selectieGroepen } = await client.query(
    `SELECT sg.id, sg.naam FROM "SelectieGroep" sg WHERE sg."versieId" = $1`,
    [versie.id]
  );
  const selectieGroepMap = new Map();
  for (const sg of selectieGroepen) {
    const { rows: sgSpelers } = await client.query(
      `SELECT sp.id, sp.roepnaam, sp.achternaam, sp.geslacht, sp.geboortejaar, sp.huidig
       FROM "SelectieSpeler" ss JOIN "Speler" sp ON sp.id = ss."spelerId"
       WHERE ss."selectieGroepId" = $1 ORDER BY sp.geboortejaar DESC, sp.roepnaam`,
      [sg.id]
    );
    selectieGroepMap.set(sg.id, sgSpelers);
  }

  for (const team of teams) {
    if (team.selectieGroepId && selectieGroepMap.has(team.selectieGroepId)) {
      const selSpelers = selectieGroepMap.get(team.selectieGroepId);
      const m = selSpelers.filter((s) => s.geslacht === "M").length;
      const v = selSpelers.filter((s) => s.geslacht === "V").length;
      console.log(
        `\n  ${team.naam} [${team.categorie}${team.kleur ? ", " + team.kleur : ""}] — SELECTIE (${selSpelers.length} spelers, ${m}M/${v}V)`
      );
      for (const sp of selSpelers) {
        const h = sp.huidig;
        const huidig = h?.team ? ` ← ${h.team}` : "";
        console.log(
          `    ${sp.roepnaam} ${sp.achternaam} (${sp.geslacht}, ${sp.geboortejaar})${huidig}`
        );
      }
    } else {
      const { rows: spelers } = await client.query(
        `SELECT sp.id, sp.roepnaam, sp.achternaam, sp.geslacht, sp.geboortejaar, sp.huidig
         FROM "TeamSpeler" ts JOIN "Speler" sp ON sp.id = ts."spelerId"
         WHERE ts."teamId" = $1 ORDER BY sp.geboortejaar DESC, sp.roepnaam`,
        [team.id]
      );
      const m = spelers.filter((s) => s.geslacht === "M").length;
      const v = spelers.filter((s) => s.geslacht === "V").length;
      console.log(
        `\n  ${team.naam} [${team.categorie}${team.kleur ? ", " + team.kleur : ""}] — ${spelers.length} spelers (${m}M/${v}V)`
      );
      for (const sp of spelers) {
        const h = sp.huidig;
        const huidig = h?.team ? ` ← ${h.team}` : "";
        console.log(
          `    ${sp.roepnaam} ${sp.achternaam} (${sp.geslacht}, ${sp.geboortejaar})${huidig}`
        );
      }
      totaalSpelers += spelers.length;
    }
  }
  for (const [, sgSpelers] of selectieGroepMap) {
    totaalSpelers += sgSpelers.length;
  }
  console.log(`\nTotaal: ${totaalSpelers} spelers in ${teams.length} teams`);
  await client.end();
  process.exit(0);
}

// Verzamel alle al-ingedeelde speler-IDs
const { rows: ingedeeld } = await client.query(
  `SELECT ts."spelerId" FROM "TeamSpeler" ts
   JOIN "Team" t ON t.id = ts."teamId"
   WHERE t."versieId" = $1`,
  [versie.id]
);
const ingedeeldIds = new Set(ingedeeld.map((r) => r.spelerId));

const { rows: selectieIngedeeld } = await client.query(
  `SELECT ss."spelerId" FROM "SelectieSpeler" ss
   JOIN "SelectieGroep" sg ON sg.id = ss."selectieGroepId"
   WHERE sg."versieId" = $1`,
  [versie.id]
);
for (const r of selectieIngedeeld) {
  ingedeeldIds.add(r.spelerId);
}

// === POOL MODE ===
if (poolMode) {
  const pool = await haalSpelers();
  let beschikbaar = pool.filter((s) => !ingedeeldIds.has(s.id));
  // Pas dezelfde filters toe als bij plaatsing
  if (huidigTeam) {
    const zoek = huidigTeam.toLowerCase();
    beschikbaar = beschikbaar.filter((s) => s.huidig?.team?.toLowerCase().includes(zoek));
  }
  if (kleur) {
    const zoek = kleur.toUpperCase();
    beschikbaar = beschikbaar.filter((s) => s.huidig?.kleur?.toUpperCase() === zoek);
  }
  if (geslacht) {
    beschikbaar = beschikbaar.filter((s) => s.geslacht === geslacht.toUpperCase());
  }
  if (jaarRange) {
    const [van, tot] = jaarRange.includes("-")
      ? jaarRange.split("-").map(Number)
      : [Number(jaarRange), Number(jaarRange)];
    beschikbaar = beschikbaar.filter((s) => s.geboortejaar >= van && s.geboortejaar <= tot);
  }
  console.log(`\nBeschikbare spelers (${beschikbaar.length}):`);
  for (const sp of beschikbaar) {
    const h = sp.huidig;
    const huidig = h?.team ? ` [${h.team}]` : "";
    const hkleur = h?.kleur ? ` (${h.kleur})` : "";
    console.log(
      `  ${sp.roepnaam} ${sp.achternaam} — ${sp.geslacht}, ${sp.geboortejaar}${huidig}${hkleur} — ${sp.id}`
    );
  }
  await client.end();
  process.exit(0);
}

// === PLAATS MODE ===
if (!teamNaam) {
  console.error("Geef --team op voor plaatsing, of gebruik --show / --pool");
  await client.end();
  process.exit(1);
}

// Zoek doelteam
const doelTeam = teams.find((t) => t.naam.toLowerCase() === teamNaam.toLowerCase());
if (!doelTeam) {
  console.error(
    `Team "${teamNaam}" niet gevonden. Beschikbaar:\n${teams.map((t) => `  ${t.naam}`).join("\n")}`
  );
  await client.end();
  process.exit(1);
}

const isSelectie = doelTeam.selectieGroepId != null;
const selectieGroepId = doelTeam.selectieGroepId;

// Haal spelers op met filters
const pool = await haalSpelers();
let gefilterd = pool.filter((s) => !ingedeeldIds.has(s.id));

if (huidigTeam) {
  const zoek = huidigTeam.toLowerCase();
  gefilterd = gefilterd.filter((s) => {
    const h = s.huidig;
    return h?.team?.toLowerCase().includes(zoek);
  });
}
if (kleur) {
  const zoek = kleur.toUpperCase();
  gefilterd = gefilterd.filter((s) => {
    const h = s.huidig;
    return h?.kleur?.toUpperCase() === zoek;
  });
}
if (geslacht) {
  gefilterd = gefilterd.filter((s) => s.geslacht === geslacht.toUpperCase());
}
if (jaarRange) {
  const [van, tot] = jaarRange.includes("-")
    ? jaarRange.split("-").map(Number)
    : [Number(jaarRange), Number(jaarRange)];
  gefilterd = gefilterd.filter((s) => s.geboortejaar >= van && s.geboortejaar <= tot);
}
if (spelerIds) {
  const ids = new Set(spelerIds.split(",").map((s) => s.trim()));
  gefilterd = gefilterd.filter((s) => ids.has(s.id));
}

console.log(`\n${gefilterd.length} spelers gevonden → ${doelTeam.naam}:`);
for (const sp of gefilterd) {
  const h = sp.huidig;
  const huidig = h?.team ? ` ← ${h.team}` : "";
  console.log(`  ${sp.roepnaam} ${sp.achternaam} (${sp.geslacht}, ${sp.geboortejaar})${huidig}`);
}

if (gefilterd.length === 0) {
  console.log("Niets te plaatsen.");
  await client.end();
  process.exit(0);
}

if (dryRun) {
  console.log("\n[DRY RUN] Geen wijzigingen gemaakt.");
  await client.end();
  process.exit(0);
}

// Plaats spelers
if (isSelectie) {
  const values = gefilterd.map((_, i) => `(gen_random_uuid(), $1, $${i + 2})`).join(", ");
  const params = [selectieGroepId, ...gefilterd.map((s) => s.id)];
  await client.query(
    `INSERT INTO "SelectieSpeler" (id, "selectieGroepId", "spelerId") VALUES ${values}
     ON CONFLICT ("selectieGroepId", "spelerId") DO NOTHING`,
    params
  );
} else {
  const values = gefilterd.map((_, i) => `(gen_random_uuid(), $1, $${i + 2})`).join(", ");
  const params = [doelTeam.id, ...gefilterd.map((s) => s.id)];
  await client.query(
    `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId") VALUES ${values}
     ON CONFLICT ("teamId", "spelerId") DO NOTHING`,
    params
  );
}

console.log(`\n✓ ${gefilterd.length} spelers geplaatst in ${doelTeam.naam}`);

await client.end();

// === HELPERS ===
async function haalSpelers() {
  const where = [];
  const params = [];

  // Standaard: niet GAAT_STOPPEN
  where.push(`status != 'GAAT_STOPPEN'`);

  const { rows } = await client.query(
    `SELECT id, roepnaam, achternaam, geslacht, geboortejaar, huidig, status
     FROM "Speler" WHERE ${where.join(" AND ")}
     ORDER BY geboortejaar ASC, achternaam ASC`,
    params
  );
  return rows;
}
