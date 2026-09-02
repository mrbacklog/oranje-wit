/**
 * Vult competitie_spelers voor de veldcompetitie 2026-2027 vanuit het Sportlink-teamregister.
 *
 * Bron: data/seizoenen/2026-2027/teams-sportlink.json (30 veldteams)
 * Koppeling naar ow_team_id via team_aliases (het J-nummer is als alias vastgelegd).
 *
 * Draait standaard als DRY-RUN. Toepassen:
 *   node scripts/vul-competitie-spelers-2026-2027.mjs --apply
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const SEIZOEN = "2026-2027";
const COMPETITIE = "veld_najaar";
const BRON = "sportlink";
const APPLY = process.argv.includes("--apply");
const out = (s) => process.stdout.write(s + "\n");

const teams = JSON.parse(
  readFileSync(resolve(__dirname, `../data/seizoenen/${SEIZOEN}/teams-sportlink.json`), "utf8")
);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows: aliasRijen } = await client.query(
  `SELECT alias, ow_team_id, ow_code FROM team_aliases WHERE seizoen = $1`,
  [SEIZOEN]
);
const owTeamVan = new Map(aliasRijen.map((r) => [r.alias, r]));

const { rows: ledenRijen } = await client.query(`SELECT rel_code, geslacht FROM leden`);
const geslachtVan = new Map(ledenRijen.map((r) => [r.rel_code, r.geslacht]));

const rijen = [];
const zonderTeam = [];
const zonderLid = [];

for (const t of teams) {
  const alias = owTeamVan.get(t.code);
  if (!alias) {
    zonderTeam.push(t.code);
    continue;
  }
  for (const s of t.spelers) {
    if (!geslachtVan.has(s.relCode)) {
      zonderLid.push({ rc: s.relCode, naam: s.naam, team: t.code });
      continue;
    }
    rijen.push({
      relCode: s.relCode,
      team: t.code,
      owTeamId: alias.ow_team_id,
      geslacht: geslachtVan.get(s.relCode),
    });
  }
}

out(`Sportlink-veldteams: ${teams.length}`);
out(`Te schrijven rijen:  ${rijen.length}`);
if (zonderTeam.length) out(`GEEN alias voor team: ${zonderTeam.join(", ")}`);
if (zonderLid.length) {
  out(`\nNiet in de leden-tabel (${zonderLid.length}) — worden overgeslagen:`);
  for (const z of zonderLid) out(`  ${z.rc}  ${z.naam}  (${z.team})`);
}

const { rows: bestaand } = await client.query(
  `SELECT COUNT(*)::int AS n FROM competitie_spelers WHERE seizoen = $1 AND competitie = $2`,
  [SEIZOEN, COMPETITIE]
);
out(`\nAl aanwezig voor ${SEIZOEN}/${COMPETITIE}: ${bestaand[0].n} rijen`);

const perTeam = new Map();
for (const r of rijen) perTeam.set(r.team, (perTeam.get(r.team) ?? 0) + 1);
out("\nPer team:");
for (const [team, n] of perTeam) out(`  ${team.padEnd(7)} ${n}`);

if (!APPLY) {
  out("\nDry-run. Draai met --apply om weg te schrijven.");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
try {
  for (const r of rijen) {
    await client.query(
      `INSERT INTO competitie_spelers (rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar, ow_team_id)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7)
       ON CONFLICT (rel_code, seizoen, competitie) DO UPDATE
         SET team = EXCLUDED.team, geslacht = EXCLUDED.geslacht,
             bron = EXCLUDED.bron, ow_team_id = EXCLUDED.ow_team_id`,
      [r.relCode, SEIZOEN, COMPETITIE, r.team, r.geslacht, BRON, r.owTeamId]
    );
  }
  await client.query("COMMIT");
  out(`\nCOMMIT — ${rijen.length} rijen weggeschreven.`);
} catch (e) {
  await client.query("ROLLBACK");
  out(`\nFOUT — teruggedraaid: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
