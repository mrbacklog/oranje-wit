/**
 * build-team-aliases.js
 *
 * Vult de team_aliases tabel voor een seizoen.
 * Genereert alle bekende KNKV-teamnamen (aliases) per OWTeam,
 * zodat CompetitieSpeler.team altijd via een simpele JOIN naar ow_code mapt.
 *
 * Gebruik:
 *   node -r dotenv/config scripts/js/build-team-aliases.js 2025-2026
 *   node -r dotenv/config scripts/js/build-team-aliases.js          # alle seizoenen
 */

const { Client } = require("pg");

async function buildTeamAliases(client, seizoen) {
  // 1. Haal alle teams + periodes op
  const { rows: teams } = await client.query(
    `SELECT t.id, t.ow_code, t.categorie, t.kleur, t.leeftijdsgroep
     FROM teams t WHERE t.seizoen = $1`,
    [seizoen]
  );

  const { rows: periodes } = await client.query(
    `SELECT tp.team_id, tp.j_nummer
     FROM team_periodes tp
     JOIN teams t ON t.id = tp.team_id
     WHERE t.seizoen = $1 AND tp.j_nummer IS NOT NULL`,
    [seizoen]
  );

  // Groepeer j_nummers per team
  const jNummersPerTeam = new Map();
  for (const p of periodes) {
    if (!jNummersPerTeam.has(p.team_id)) jNummersPerTeam.set(p.team_id, new Set());
    jNummersPerTeam.get(p.team_id).add(p.j_nummer);
  }

  // 2. Genereer aliases
  // Map: alias → { owTeamId, owCode } (eerste match wint bij duplicaat)
  const aliasMap = new Map();

  function addAlias(alias, owTeamId, owCode) {
    if (!alias || aliasMap.has(alias)) return;
    aliasMap.set(alias, { owTeamId, owCode });
  }

  for (const team of teams) {
    const { id, ow_code, categorie, leeftijdsgroep } = team;

    // Direct match: ow_code zelf
    addAlias(ow_code, id, ow_code);

    // J-nummer aliases (uit periodes)
    const jNummers = jNummersPerTeam.get(id) || new Set();
    for (const jNr of jNummers) {
      // Zaal-conventie: "J1", "J7", etc.
      addAlias(jNr, id, ow_code);

      // Veld-conventie: "OW J1", "OW J7", etc.
      const nummer = jNr.substring(1); // "J1" → "1"
      addAlias(`OW J${nummer}`, id, ow_code);
    }

    // Senioren: "S{n}" als ow_code numeriek is
    if (/^\d+$/.test(ow_code)) {
      addAlias(`S${ow_code}`, id, ow_code);
    }
  }

  // Selectie-aliases → selectie-teams (echte OWTeam records)
  // S1/S2 en S1S2 wijzen naar het selectie-team, niet naar individuele teams
  const senSelectie = teams.find((t) => t.ow_code === "S-selectie");
  if (senSelectie) {
    addAlias("S1/S2", senSelectie.id, senSelectie.ow_code);
    addAlias("S1S2", senSelectie.id, senSelectie.ow_code);
  }

  // U17, U19, U15 selectie-aliases → selectie-teams
  for (const prefix of ["U15", "U17", "U19"]) {
    const selectieTeam = teams.find((t) => t.ow_code === `${prefix}-selectie`);
    if (selectieTeam) {
      addAlias(prefix, selectieTeam.id, selectieTeam.ow_code);
    }
  }

  // Kangoeroes — kan als echt team bestaan, of als "virtueel" team zonder OWTeam-record
  const kangoeroe = teams.find((t) => t.ow_code === "Kangoeroes" || t.ow_code === "K");
  if (kangoeroe) {
    addAlias("Kangoeroes", kangoeroe.id, kangoeroe.ow_code);
    addAlias("K", kangoeroe.id, kangoeroe.ow_code);
  }

  // 3. Verwijder bestaande aliases voor dit seizoen
  await client.query("DELETE FROM team_aliases WHERE seizoen = $1", [seizoen]);

  // 4. Bulk-insert
  if (aliasMap.size === 0) {
    console.log(`  ${seizoen}: geen teams gevonden`);
    return 0;
  }

  const values = [];
  const params = [];
  let i = 1;
  for (const [alias, { owTeamId, owCode }] of aliasMap) {
    values.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`);
    params.push(seizoen, alias, owTeamId, owCode);
    i += 4;
  }

  await client.query(
    `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code) VALUES ${values.join(", ")}`,
    params
  );

  console.log(`  ${seizoen}: ${aliasMap.size} aliases aangemaakt`);
  return aliasMap.size;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const targetSeizoen = process.argv[2];

  if (targetSeizoen) {
    await buildTeamAliases(client, targetSeizoen);
  } else {
    // Alle seizoenen met teams
    const { rows } = await client.query("SELECT DISTINCT seizoen FROM teams ORDER BY seizoen");
    for (const { seizoen } of rows) {
      await buildTeamAliases(client, seizoen);
    }
  }

  await client.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
