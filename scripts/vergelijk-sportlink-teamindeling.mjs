/**
 * Vergelijkt de Sportlink-veldteams (data/seizoenen/2026-2027/teams-sportlink.json)
 * met de voorlopige teamindeling in de database.
 *
 * Gebruik: node scripts/vergelijk-sportlink-teamindeling.mjs [versieId]
 *          zonder argument: toont de beschikbare werkindelingen/versies
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const out = (s) => process.stdout.write(s + "\n");
const VERSIE_ID = process.argv[2];

const sportlink = JSON.parse(
  readFileSync(resolve(__dirname, "../data/seizoenen/2026-2027/teams-sportlink.json"), "utf8")
);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

if (!VERSIE_ID) {
  const { rows } = await client.query(`
    SELECT v.id, v.nummer, v.naam, v."createdAt"::date::text AS datum, w.naam AS werkindeling,
           k.seizoen, (SELECT COUNT(*)::int FROM "Team" t WHERE t."versieId" = v.id) AS teams,
           (SELECT COUNT(*)::int FROM "TeamSpeler" ts
              JOIN "Team" t2 ON t2.id = ts."teamId" WHERE t2."versieId" = v.id) AS spelers
      FROM "Versie" v
      JOIN werkindelingen w ON w.id = v."werkindelingId"
      JOIN "Kaders" k ON k.id = w."kadersId"
     ORDER BY k.seizoen DESC, v."createdAt" DESC
     LIMIT 20
  `);
  out("### Beschikbare versies (nieuwste eerst)");
  for (const r of rows) {
    out(
      `  ${r.id}  ${r.seizoen}  "${r.werkindeling}" v${r.nummer} ${r.naam ?? ""}  ${r.teams} teams / ${r.spelers} spelers  (${r.datum})`
    );
  }
  out("\nDraai opnieuw met een versieId om te vergelijken.");
  await client.end();
  process.exit(0);
}

const { rows: dbRijen } = await client.query(
  `SELECT t.naam AS team, t.alias, t.j_nummer AS "jNummer", ts."spelerId" AS rel_code,
          s.roepnaam, s.achternaam, 'team' AS herkomst
     FROM "Team" t
     JOIN "TeamSpeler" ts ON ts."teamId" = t.id
     JOIN "Speler" s ON s.id = ts."spelerId"
    WHERE t."versieId" = $1
   UNION ALL
   SELECT COALESCE(g.naam, 'Selectiegroep') AS team, NULL, NULL, ss."spelerId",
          s.roepnaam, s.achternaam, 'selectie' AS herkomst
     FROM "SelectieGroep" g
     JOIN "SelectieSpeler" ss ON ss."selectieGroepId" = g.id
     JOIN "Speler" s ON s.id = ss."spelerId"
    WHERE g."versieId" = $1`,
  [VERSIE_ID]
);

const dbPerSpeler = new Map();
for (const r of dbRijen) dbPerSpeler.set(r.rel_code, r);

const slPerSpeler = new Map();
for (const t of sportlink) {
  for (const s of t.spelers) slPerSpeler.set(s.relCode, { ...s, team: t.code });
}

out(`Sportlink: ${slPerSpeler.size} spelers in ${sportlink.length} veldteams`);
out(`Database:  ${dbPerSpeler.size} spelers in de gekozen versie\n`);

// De database gebruikt kleur-namen (Rood 1, Oranje 1), Sportlink J-nummers (J1, J2).
// Er is geen naam-koppeling, dus leid de mapping af uit de spelers zelf:
// per Sportlink-team kijken we in welk databaseteam de meeste spelers zitten.
const dbTeamVan = (rc) => {
  const r = dbPerSpeler.get(rc);
  return r ? r.jNummer || r.alias || r.team : null;
};

out(`### Teamkoppeling (afgeleid uit spelers)
`);

const alleenSportlink = [];
let afwijkend = 0;
let overeenkomend = 0;

for (const t of sportlink) {
  const tellingen = new Map();
  const onbekend = [];
  for (const s of t.spelers) {
    const dbt = dbTeamVan(s.relCode);
    if (!dbt) {
      onbekend.push(s);
      continue;
    }
    tellingen.set(dbt, (tellingen.get(dbt) ?? 0) + 1);
  }
  const gesorteerd = [...tellingen.entries()].sort((a, b) => b[1] - a[1]);
  const [besteTeam, besteAantal] = gesorteerd[0] ?? [null, 0];
  const rest = gesorteerd.slice(1);

  const status = onbekend.length === 0 && rest.length === 0 ? "OK" : "LET OP";
  out(
    `  ${t.code.padEnd(7)} → ${(besteTeam ?? "geen match").padEnd(14)} ${besteAantal}/${t.spelers.length}  ${status}`
  );
  overeenkomend += besteAantal;
  for (const [team, n] of rest) {
    afwijkend += n;
    const namen = t.spelers
      .filter((s) => dbTeamVan(s.relCode) === team)
      .map((s) => s.naam)
      .join(", ");
    out(`      ${n}x uit ${team}: ${namen}`);
  }
  for (const s of onbekend) {
    alleenSportlink.push({ ...s, team: t.code });
    out(`      niet in de indeling: ${s.relCode}  ${s.naam}`);
  }
}

out(`
### Samenvatting`);
out(`  spelers in het verwachte team: ${overeenkomend}`);
out(`  spelers uit een ander databaseteam: ${afwijkend}`);
out(`  spelers zonder plek in de indeling: ${alleenSportlink.length}`);

const slCodes = new Set([...slPerSpeler.keys()]);
const nietInVeldteam = [...dbPerSpeler.entries()].filter(([rc]) => !slCodes.has(rc));
out(`  wel ingedeeld, geen Sportlink-veldteam: ${nietInVeldteam.length}`);
for (const [rc, db] of nietInVeldteam) {
  out(`      ${rc}  ${db.roepnaam} ${db.achternaam}  (${db.jNummer || db.alias || db.team})`);
}

await client.end();
