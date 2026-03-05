const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  const match = await c.query(`SELECT COUNT(*) FROM "Speler" s JOIN leden l ON s.id = l.rel_code`);
  const total = await c.query(`SELECT COUNT(*) FROM "Speler"`);
  const zonder = await c.query(
    `SELECT COUNT(*) FROM "Speler" s WHERE NOT EXISTS (SELECT 1 FROM leden l WHERE l.rel_code = s.id)`
  );
  console.log("Totaal Speler records:", total.rows[0].count);
  console.log("Met geldige rel_code:", match.rows[0].count);
  console.log("Zonder rel_code match:", zonder.rows[0].count);

  // Voorbeelden zonder match
  const voorbeelden = await c.query(
    `SELECT id, "roepnaam", "achternaam", "geboortejaar" FROM "Speler" s
     WHERE NOT EXISTS (SELECT 1 FROM leden l WHERE l.rel_code = s.id)
     ORDER BY "achternaam" LIMIT 15`
  );
  console.log("\nVoorbeelden zonder rel_code match (= aangemaakt met cuid):");
  voorbeelden.rows.forEach((r) =>
    console.log(`  ${r.id} | ${r.roepnaam} ${r.achternaam} (${r.geboortejaar})`)
  );

  // Hoeveel van die "foute" spelers zitten in een team?
  const inTeam = await c.query(
    `SELECT s.id, s."roepnaam", s."achternaam", t.naam as team
     FROM "Speler" s
     JOIN "TeamSpeler" ts ON ts."spelerId" = s.id
     JOIN "Team" t ON t.id = ts."teamId"
     WHERE NOT EXISTS (SELECT 1 FROM leden l WHERE l.rel_code = s.id)
     ORDER BY s."achternaam"`
  );
  console.log(`\n${inTeam.rows.length} spelers met cuid-ID zitten in een team:`);
  inTeam.rows.forEach((r) => console.log(`  ${r.id} | ${r.roepnaam} ${r.achternaam} → ${r.team}`));

  // Kun je ze koppelen aan leden op naam+geboortejaar?
  console.log("\nKoppelbaar aan leden:");
  for (const r of inTeam.rows) {
    const kern = r.achternaam.replace(/^(van |de |den |der |het |van der |van de |van den )/i, "");
    const lid = await c.query(
      `SELECT rel_code, roepnaam, tussenvoegsel, achternaam FROM leden
       WHERE roepnaam = $1 AND achternaam ILIKE '%' || $2 || '%'
       LIMIT 3`,
      [r.roepnaam, kern]
    );
    if (lid.rows.length > 0) {
      const l = lid.rows[0];
      const naam = l.tussenvoegsel ? `${l.tussenvoegsel} ${l.achternaam}` : l.achternaam;
      console.log(
        `  ${r.roepnaam} ${r.achternaam} (${r.id}) → rel_code: ${l.rel_code} (${l.roepnaam} ${naam})`
      );
    } else {
      console.log(`  ${r.roepnaam} ${r.achternaam} (${r.id}) → GEEN MATCH in leden`);
    }
  }

  await c.end();
}
main().catch(console.error);
