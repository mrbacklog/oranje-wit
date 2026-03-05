const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // J7 spelers — match op roepnaam + achternaam (meer betrouwbaar)
  const j7 = await c.query(
    `SELECT DISTINCT ON (l.roepnaam, l.achternaam)
       l.roepnaam, l.achternaam, l.geboortejaar, l.geslacht, s.id as speler_id
     FROM competitie_spelers cp
     JOIN leden l ON cp.rel_code = l.rel_code
     LEFT JOIN "Speler" s ON s."roepnaam" = l.roepnaam AND s."achternaam" = l.achternaam
     WHERE cp.seizoen = '2025-2026' AND (cp.team = 'OW J7' OR cp.team = 'J7')
     ORDER BY l.roepnaam, l.achternaam`
  );
  console.log("J7 spelers:");
  j7.rows.forEach((r) =>
    console.log(r.roepnaam, r.achternaam, r.geboortejaar, r.geslacht, r.speler_id || "GEEN ID")
  );

  // Check waar ze nu in zitten
  const ids = j7.rows.filter((r) => r.speler_id).map((r) => r.speler_id);
  if (ids.length > 0) {
    const existing = await c.query(
      `SELECT s."roepnaam", s."achternaam", t.naam
       FROM "TeamSpeler" ts
       JOIN "Speler" s ON s.id = ts."spelerId"
       JOIN "Team" t ON t.id = ts."teamId"
       WHERE ts."spelerId" = ANY($1)
       ORDER BY s."achternaam"`,
      [ids]
    );
    console.log("\nHuidige team-plaatsing:");
    existing.rows.forEach((r) => console.log(`  ${r.roepnaam} ${r.achternaam} → ${r.naam}`));
  }

  await c.end();
}
main().catch(console.error);
