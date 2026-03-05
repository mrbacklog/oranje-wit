process.loadEnvFile(".env");
const path = require("path");
const { Client } = require(path.resolve("node_modules/.pnpm/pg@8.19.0/node_modules/pg"));
const c = new Client(process.env.DATABASE_URL);
c.connect().then(async () => {
  // Alle kolommen van leden tabel
  const r0 = await c.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leden' ORDER BY ordinal_position`
  );
  console.log("KOLOMMEN:", JSON.stringify(r0.rows));

  // De 75 reserves: leeftijdsverdeling
  const r1 = await c.query(`
    SELECT 
      CASE 
        WHEN geboortejaar >= 2015 THEN 'jeugd (<10)'
        WHEN geboortejaar >= 2005 THEN 'jeugd (10-20)'
        WHEN geboortejaar >= 1990 THEN 'senior (20-35)'
        ELSE 'veteraan (35+)'
      END as leeftijdsgroep,
      COUNT(*)::int as aantal
    FROM leden l
    INNER JOIN (SELECT DISTINCT rel_code FROM competitie_spelers) cp ON cp.rel_code = l.rel_code
    WHERE l.afmelddatum IS NULL
      AND l.lidsoort = 'Bondslid'
      AND l.rel_code NOT IN (SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026')
    GROUP BY 1 ORDER BY 1
  `);
  console.log("RESERVES leeftijd:", JSON.stringify(r1.rows));

  // Check of er staf-toewijzingen zijn voor deze 75 reserves
  const r2 = await c.query(`
    SELECT COUNT(DISTINCT l.rel_code)::int as reserves_die_staf_zijn
    FROM leden l
    INNER JOIN (SELECT DISTINCT rel_code FROM competitie_spelers) cp ON cp.rel_code = l.rel_code
    LEFT JOIN staf s ON s.rel_code = l.rel_code
    WHERE l.afmelddatum IS NULL
      AND l.lidsoort = 'Bondslid'
      AND l.rel_code NOT IN (SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026')
      AND s.rel_code IS NOT NULL
  `);
  console.log("RESERVES die ook staf zijn:", JSON.stringify(r2.rows));

  await c.end();
});
