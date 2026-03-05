const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // Welke teams zitten er in veld_najaar?
  const veld = await c.query(`
    SELECT team, COUNT(DISTINCT rel_code) as spelers
    FROM competitie_spelers
    WHERE seizoen = '2025-2026' AND competitie = 'veld_najaar'
    GROUP BY team ORDER BY team
  `);
  console.log("Veld najaar teams:");
  veld.rows.forEach((r) => console.log(`  ${r.team}: ${r.spelers} spelers`));

  // Vergelijk OW J1 (veld) vs J1 (zaal) voor Rood-1
  console.log("\n=== OW J1 (veld_najaar) vs J1 (zaal) ===");
  const owj1 = await c.query(`
    SELECT cp.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam
    FROM competitie_spelers cp JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026' AND cp.competitie = 'veld_najaar' AND cp.team = 'OW J1'
    ORDER BY l.achternaam
  `);
  const j1zaal = await c.query(`
    SELECT cp.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam
    FROM competitie_spelers cp JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026' AND cp.competitie = 'zaal' AND cp.team = 'J1'
    ORDER BY l.achternaam
  `);

  const owj1Codes = new Set(owj1.rows.map((r) => r.rel_code));
  const j1Codes = new Set(j1zaal.rows.map((r) => r.rel_code));

  console.log(`\nOW J1 (veld): ${owj1.rows.length} spelers`);
  owj1.rows.forEach((r) => {
    const naam = r.tussenvoegsel ? `${r.tussenvoegsel} ${r.achternaam}` : r.achternaam;
    const inZaal = j1Codes.has(r.rel_code) ? "" : " ← NIET in zaal J1";
    console.log(`  ${r.roepnaam} ${naam}${inZaal}`);
  });

  console.log(`\nJ1 (zaal): ${j1zaal.rows.length} spelers`);
  j1zaal.rows.forEach((r) => {
    const naam = r.tussenvoegsel ? `${r.tussenvoegsel} ${r.achternaam}` : r.achternaam;
    const inVeld = owj1Codes.has(r.rel_code) ? "" : " ← NIET in veld OW J1";
    console.log(`  ${r.roepnaam} ${naam}${inVeld}`);
  });

  // Nu voor OW J2 vs J2
  console.log("\n=== OW J2 (veld_najaar) vs J2 (zaal) ===");
  const owj2 = await c.query(`
    SELECT cp.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam
    FROM competitie_spelers cp JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026' AND cp.competitie = 'veld_najaar' AND cp.team = 'OW J2'
    ORDER BY l.achternaam
  `);
  const j2zaal = await c.query(`
    SELECT cp.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam
    FROM competitie_spelers cp JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026' AND cp.competitie = 'zaal' AND cp.team = 'J2'
    ORDER BY l.achternaam
  `);

  const owj2Codes = new Set(owj2.rows.map((r) => r.rel_code));
  const j2Codes = new Set(j2zaal.rows.map((r) => r.rel_code));

  console.log(`\nOW J2 (veld): ${owj2.rows.length} spelers`);
  owj2.rows.forEach((r) => {
    const naam = r.tussenvoegsel ? `${r.tussenvoegsel} ${r.achternaam}` : r.achternaam;
    const inZaal = j2Codes.has(r.rel_code) ? "" : " ← NIET in zaal J2";
    console.log(`  ${r.roepnaam} ${naam}${inZaal}`);
  });

  console.log(`\nJ2 (zaal): ${j2zaal.rows.length} spelers`);
  j2zaal.rows.forEach((r) => {
    const naam = r.tussenvoegsel ? `${r.tussenvoegsel} ${r.achternaam}` : r.achternaam;
    const inVeld = owj2Codes.has(r.rel_code) ? "" : " ← NIET in veld OW J2";
    console.log(`  ${r.roepnaam} ${naam}${inVeld}`);
  });

  await c.end();
}
main().catch(console.error);
