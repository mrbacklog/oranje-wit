process.loadEnvFile(".env");
const path = require("path");
const { Client } = require(path.resolve("node_modules/.pnpm/pg@8.19.0/node_modules/pg"));
const c = new Client(process.env.DATABASE_URL);
c.connect().then(async () => {
  // De 75 reserves: wanneer laatst gespeeld?
  const r1 = await c.query(`
    SELECT 
      MAX(cp.seizoen) as laatst_gespeeld,
      COUNT(*)::int as aantal
    FROM leden l
    INNER JOIN competitie_spelers cp ON cp.rel_code = l.rel_code
    WHERE l.afmelddatum IS NULL
      AND l.lidsoort = 'Bondslid'
      AND l.rel_code NOT IN (SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026')
    GROUP BY l.rel_code
    ORDER BY laatst_gespeeld DESC
  `);
  // Groepeer per seizoen
  const perSeizoen = {};
  r1.rows.forEach((r) => {
    perSeizoen[r.laatst_gespeeld] = (perSeizoen[r.laatst_gespeeld] || 0) + r.aantal;
  });
  console.log("RESERVES laatst gespeeld:", JSON.stringify(perSeizoen));

  // Staf tabel naam?
  const r2 = await c.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%staf%'`
  );
  console.log("STAF TABELLEN:", JSON.stringify(r2.rows));

  // Check staf_toewijzingen
  const r3 = await c.query(`
    SELECT COUNT(DISTINCT st.staf_rel_code)::int as staf_die_reserve_zijn
    FROM staf_toewijzingen st
    WHERE st.staf_rel_code IN (
      SELECT l.rel_code FROM leden l
      INNER JOIN (SELECT DISTINCT rel_code FROM competitie_spelers) cp ON cp.rel_code = l.rel_code
      WHERE l.afmelddatum IS NULL AND l.lidsoort = 'Bondslid'
        AND l.rel_code NOT IN (SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026')
    )
  `);
  console.log("RESERVES die ook staf-toewijzing hebben:", JSON.stringify(r3.rows));

  // Voorbeeld: reserves die NIET recent (na 2023) gespeeld hebben
  const r4 = await c.query(`
    SELECT l.roepnaam, l.achternaam, l.geboortejaar, MAX(cp.seizoen) as laatst
    FROM leden l
    INNER JOIN competitie_spelers cp ON cp.rel_code = l.rel_code
    WHERE l.afmelddatum IS NULL AND l.lidsoort = 'Bondslid'
      AND l.rel_code NOT IN (SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026')
    GROUP BY l.rel_code, l.roepnaam, l.achternaam, l.geboortejaar
    HAVING MAX(cp.seizoen) < '2023-2024'
    ORDER BY MAX(cp.seizoen) DESC LIMIT 15
  `);
  console.log("LANG NIET GESPEELD:", JSON.stringify(r4.rows));

  await c.end();
});
