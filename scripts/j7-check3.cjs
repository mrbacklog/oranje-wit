const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // Zoek de ontbrekende spelers breder
  const missing = ["Dijl", "Oosse", "Weijde", "Kombe"];
  for (const naam of missing) {
    const r = await c.query(
      `SELECT id, "roepnaam", "achternaam", "geboortejaar", "geslacht"::text FROM "Speler" WHERE "achternaam" ILIKE $1`,
      [`%${naam}%`]
    );
    console.log(`Speler zoek "${naam}":`, r.rows.length > 0 ? r.rows : "NIET GEVONDEN");
  }

  // Totaal spelers in Speler tabel
  const total = await c.query(`SELECT COUNT(*) FROM "Speler"`);
  console.log("\nTotaal Speler records:", total.rows[0].count);

  // Alle J7-achternamen checken
  const j7names = await c.query(
    `SELECT DISTINCT l.roepnaam, l.achternaam, l.geboortejaar
     FROM competitie_spelers cp JOIN leden l ON cp.rel_code = l.rel_code
     WHERE cp.seizoen = '2025-2026' AND (cp.team = 'OW J7' OR cp.team = 'J7')
     ORDER BY l.achternaam`
  );
  console.log("\nJ7 namen uit leden-tabel:");
  for (const n of j7names.rows) {
    const sp = await c.query(
      `SELECT id FROM "Speler" WHERE "achternaam" = $1 AND "roepnaam" = $1`,
      [n.achternaam]
    );
    // Try more flexible
    const sp2 = await c.query(
      `SELECT id, "roepnaam", "achternaam" FROM "Speler" WHERE "achternaam" = $1`,
      [n.achternaam]
    );
    console.log(
      `  ${n.roepnaam} ${n.achternaam} (${n.geboortejaar}):`,
      sp2.rows.length > 0
        ? sp2.rows.map((r) => `${r.roepnaam} ${r.achternaam} (${r.id})`).join(", ")
        : "NIET IN SPELER"
    );
  }

  await c.end();
}
main().catch(console.error);
