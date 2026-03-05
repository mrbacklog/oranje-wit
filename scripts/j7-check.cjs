const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // J7 spelers met hun Speler ID (cast geslacht to text for comparison)
  const j7 = await c.query(
    `SELECT DISTINCT ON (l.achternaam, l.geboortejaar, l.geslacht)
       l.roepnaam, l.achternaam, l.geboortejaar, l.geslacht, s.id as speler_id
     FROM competitie_spelers cp
     JOIN leden l ON cp.rel_code = l.rel_code
     LEFT JOIN "Speler" s ON s."achternaam" = l.achternaam
       AND s."geboortejaar" = l.geboortejaar AND s."geslacht"::text = l.geslacht
     WHERE cp.seizoen = '2025-2026' AND (cp.team = 'OW J7' OR cp.team = 'J7')
     ORDER BY l.achternaam, l.geboortejaar, l.geslacht`
  );
  console.log("J7 spelers met Speler ID:");
  j7.rows.forEach((r) =>
    console.log(r.roepnaam, r.achternaam, r.geboortejaar, r.geslacht, r.speler_id || "GEEN ID")
  );

  // Check welke al in een team zitten
  const ids = j7.rows.filter((r) => r.speler_id).map((r) => r.speler_id);
  if (ids.length > 0) {
    const existing = await c.query(
      `SELECT ts."spelerId", t.naam FROM "TeamSpeler" ts JOIN "Team" t ON t.id = ts."teamId" WHERE ts."spelerId" = ANY($1)`,
      [ids]
    );
    if (existing.rows.length > 0) {
      console.log("\nAl in een team:");
      existing.rows.forEach((r) => console.log(r.spelerId, "->", r.naam));
    } else {
      console.log("\nGeen van deze spelers zit al in een team.");
    }
  }

  await c.end();
}
main().catch(console.error);
