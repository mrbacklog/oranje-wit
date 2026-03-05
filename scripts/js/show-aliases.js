const { Client } = require("pg");

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const { rows } = await c.query(`
    SELECT ta.ow_code, ta.alias, t.naam, t.categorie, t.kleur
    FROM team_aliases ta
    JOIN teams t ON t.id = ta.ow_team_id
    WHERE ta.seizoen = '2025-2026'
    ORDER BY t.categorie,
      CASE t.kleur WHEN 'Rood' THEN 1 WHEN 'Oranje' THEN 2 WHEN 'Geel' THEN 3 WHEN 'Groen' THEN 4 WHEN 'Blauw' THEN 5 ELSE 0 END,
      t.ow_code COLLATE "C",
      ta.alias COLLATE "C"
  `);

  const teams = new Map();
  for (const r of rows) {
    if (!teams.has(r.ow_code))
      teams.set(r.ow_code, { naam: r.naam, categorie: r.categorie, kleur: r.kleur, aliases: [] });
    teams.get(r.ow_code).aliases.push(r.alias);
  }

  for (const [owCode, t] of teams) {
    const label = t.naam || owCode;
    const cat = t.categorie === "a" ? "A-cat" : "B-cat";
    const kleur = t.kleur ? ` (${t.kleur})` : "";
    console.log(`\n${label} [ow_code: ${owCode}] — ${cat}${kleur}`);
    console.log(`  Aliases: ${t.aliases.join(", ")}`);
  }

  console.log(`\nTotaal: ${rows.length} aliases voor ${teams.size} teams`);
  await c.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
