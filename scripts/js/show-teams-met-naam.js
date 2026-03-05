const { Client } = require("pg");

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const { rows } = await c.query(`
    SELECT t.ow_code, t.naam, t.categorie, t.kleur,
           string_agg(ta.alias, ', ' ORDER BY ta.alias) as aliases
    FROM teams t
    LEFT JOIN team_aliases ta ON ta.ow_team_id = t.id
    WHERE t.seizoen = '2025-2026'
    GROUP BY t.id, t.ow_code, t.naam, t.categorie, t.kleur
    ORDER BY t.categorie,
      CASE t.kleur WHEN 'Rood' THEN 1 WHEN 'Oranje' THEN 2 WHEN 'Geel' THEN 3 WHEN 'Groen' THEN 4 WHEN 'Blauw' THEN 5 ELSE 0 END,
      t.ow_code COLLATE "C"
  `);

  console.log("ow_code".padEnd(16) + "naam (werktitel)".padEnd(24) + "aliases");
  console.log("-".repeat(80));
  for (const r of rows) {
    const naam = r.naam || "(geen)";
    console.log(`${r.ow_code.padEnd(16)}${naam.padEnd(24)}${r.aliases || "-"}`);
  }

  await c.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
