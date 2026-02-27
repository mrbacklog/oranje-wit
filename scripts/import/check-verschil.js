#!/usr/bin/env node
const pg = require("pg");

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  // MW1 per seizoen
  for (const sz of ["2017-2018","2018-2019","2019-2020","2020-2021","2021-2022"]) {
    const r1 = await c.query(
      "SELECT cs.team, COUNT(*)::int as n FROM competitie_spelers cs JOIN speler_seizoenen ss ON cs.speler_seizoen_id = ss.id WHERE ss.seizoen = $1 AND cs.competitie = 'veld_najaar' AND cs.team LIKE '%MW%' GROUP BY cs.team", [sz]
    );
    const mw1 = r1.rows.length > 0 ? r1.rows.map(x => x.team+"="+x.n).join(", ") : "GEEN";
    const r2 = await c.query(
      "SELECT cs.team, COUNT(*)::int as n FROM competitie_spelers cs JOIN speler_seizoenen ss ON cs.speler_seizoen_id = ss.id WHERE ss.seizoen = $1 AND cs.competitie = 'veld_voorjaar' AND cs.team LIKE '%MW%' GROUP BY cs.team", [sz]
    );
    const mw2 = r2.rows.length > 0 ? r2.rows.map(x => x.team+"="+x.n).join(", ") : "GEEN";
    console.log(sz + ": telling MW: " + mw1 + "  |  snapshot MW: " + mw2);
  }

  // Top teams van extra spelers per seizoen
  for (const sz of ["2017-2018","2018-2019","2019-2020"]) {
    const r = await c.query(`
      SELECT cs.team, COUNT(*)::int as n
      FROM speler_seizoenen ss
      JOIN competitie_spelers cs ON cs.speler_seizoen_id = ss.id AND cs.competitie = 'veld_voorjaar'
      WHERE ss.seizoen = $1
      AND NOT EXISTS (SELECT 1 FROM competitie_spelers cs2 WHERE cs2.speler_seizoen_id = ss.id AND cs2.competitie = 'veld_najaar')
      GROUP BY cs.team ORDER BY n DESC
    `, [sz]);
    console.log("\n" + sz + ": " + r.rows.reduce((s,x)=>s+x.n,0) + " extra spelers in veld_voorjaar, verdeling:");
    for (const row of r.rows) console.log("  " + row.team + ": " + row.n);
  }

  // Steekproef: neem 5 extra spelers van 2018-2019 en check of ze in telling 2017-2018 of 2019-2020 zitten
  console.log("\n--- Steekproef: 10 extra spelers 2018-2019 ---");
  const steek = await c.query(`
    SELECT ss.rel_code, cs.team as vv_team, l.roepnaam, l.achternaam
    FROM speler_seizoenen ss
    JOIN competitie_spelers cs ON cs.speler_seizoen_id = ss.id AND cs.competitie = 'veld_voorjaar'
    JOIN leden l ON l.rel_code = ss.rel_code
    WHERE ss.seizoen = '2018-2019'
    AND NOT EXISTS (SELECT 1 FROM competitie_spelers cs2 WHERE cs2.speler_seizoen_id = ss.id AND cs2.competitie = 'veld_najaar')
    LIMIT 10
  `);
  for (const row of steek.rows) {
    // Check of ze in telling van aangrenzende seizoenen zitten
    const prev = await c.query(
      "SELECT cs.team FROM competitie_spelers cs JOIN speler_seizoenen ss ON cs.speler_seizoen_id = ss.id WHERE ss.rel_code = $1 AND ss.seizoen = '2017-2018' AND cs.competitie = 'veld_najaar'",
      [row.rel_code]
    );
    const next = await c.query(
      "SELECT cs.team FROM competitie_spelers cs JOIN speler_seizoenen ss ON cs.speler_seizoen_id = ss.id WHERE ss.rel_code = $1 AND ss.seizoen = '2019-2020' AND cs.competitie = 'veld_najaar'",
      [row.rel_code]
    );
    console.log(
      "  " + row.roepnaam + " " + row.achternaam + " → vv:" + row.vv_team +
      " | telling 17-18: " + (prev.rows[0]?.team || "-") +
      " | telling 19-20: " + (next.rows[0]?.team || "-")
    );
  }

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
