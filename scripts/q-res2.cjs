process.loadEnvFile(".env");
const path = require("path");
const { Client } = require(path.resolve("node_modules/.pnpm/pg@8.19.0/node_modules/pg"));
const c = new Client(process.env.DATABASE_URL);
c.connect().then(async () => {
  // Reserves (75): per laatst gespeeld seizoen
  const r1 = await c.query(`
    WITH reserves AS (
      SELECT l.rel_code, l.roepnaam, l.achternaam, l.geboortejaar,
             MAX(cp.seizoen) as laatst_gespeeld
      FROM leden l
      INNER JOIN competitie_spelers cp ON cp.rel_code = l.rel_code
      WHERE l.afmelddatum IS NULL AND l.lidsoort = 'Bondslid'
        AND l.rel_code NOT IN (SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026')
      GROUP BY l.rel_code, l.roepnaam, l.achternaam, l.geboortejaar
    )
    SELECT laatst_gespeeld, COUNT(*)::int as aantal FROM reserves GROUP BY 1 ORDER BY 1 DESC
  `);
  console.log("RESERVES per laatst gespeeld:");
  r1.rows.forEach((r) => console.log("  " + r.laatst_gespeeld + ": " + r.aantal));
  console.log(
    "  TOTAAL:",
    r1.rows.reduce((s, r) => s + r.aantal, 0)
  );

  // Staf toewijzingen kolommen
  const r2 = await c.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='staf_toewijzingen' ORDER BY ordinal_position`
  );
  console.log("\nSTAF_TOEWIJZINGEN kolommen:", r2.rows.map((r) => r.column_name).join(", "));

  // Check staf overlap met reserves
  const r3 = await c.query(`
    WITH reserves AS (
      SELECT DISTINCT l.rel_code
      FROM leden l
      INNER JOIN competitie_spelers cp ON cp.rel_code = l.rel_code
      WHERE l.afmelddatum IS NULL AND l.lidsoort = 'Bondslid'
        AND l.rel_code NOT IN (SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026')
    )
    SELECT COUNT(DISTINCT st.rel_code)::int as overlap
    FROM staf_toewijzingen st
    INNER JOIN reserves r ON r.rel_code = st.rel_code
  `);
  console.log("Reserves die ook in staf_toewijzingen:", JSON.stringify(r3.rows));

  // Voorbeeld: oudere reserves (geb < 1980) die lang geleden speelden
  const r4 = await c.query(`
    SELECT l.roepnaam, l.achternaam, l.geboortejaar, MAX(cp.seizoen) as laatst
    FROM leden l
    INNER JOIN competitie_spelers cp ON cp.rel_code = l.rel_code
    WHERE l.afmelddatum IS NULL AND l.lidsoort = 'Bondslid'
      AND l.rel_code NOT IN (SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026')
      AND l.geboortejaar < 1980
    GROUP BY l.rel_code, l.roepnaam, l.achternaam, l.geboortejaar
    ORDER BY laatst DESC LIMIT 10
  `);
  console.log("\nOudere reserves (geb < 1980):", JSON.stringify(r4.rows));

  await c.end();
});
