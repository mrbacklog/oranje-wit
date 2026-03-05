const { Client } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

function cuid() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 16);
}

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  const GEEL1_ID = "cmm5aupqb001884t8l05rfa74";

  const missing = [
    { roepnaam: "Nurefsan", achternaam: "Kombe", geboortejaar: 2013, geslacht: "V" },
    { roepnaam: "Esther", achternaam: "Oosse", geboortejaar: 2013, geslacht: "V" },
  ];

  for (const sp of missing) {
    const spelerId = cuid();
    const lid = await c.query(
      `SELECT geboortedatum FROM leden WHERE roepnaam = $1 AND achternaam = $2 AND geboortejaar = $3 LIMIT 1`,
      [sp.roepnaam, sp.achternaam, sp.geboortejaar]
    );
    const geboortedatum = lid.rows[0]?.geboortedatum || null;

    await c.query(
      `INSERT INTO "Speler" (id, "roepnaam", "achternaam", "geboortedatum", "geboortejaar", "geslacht", "status", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6::"Geslacht", 'BESCHIKBAAR'::"SpelerStatus", NOW())`,
      [spelerId, sp.roepnaam, sp.achternaam, geboortedatum, sp.geboortejaar, sp.geslacht]
    );
    console.log(`Speler aangemaakt: ${sp.roepnaam} ${sp.achternaam} (${spelerId})`);

    const tsId = cuid();
    await c.query(
      `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId") VALUES ($1, $2, $3)
       ON CONFLICT ("teamId", "spelerId") DO NOTHING`,
      [tsId, GEEL1_ID, spelerId]
    );
    console.log(`  ${sp.roepnaam} ${sp.achternaam} → Geel-1`);
  }

  // Verify
  const check = await c.query(
    `SELECT s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text
     FROM "TeamSpeler" ts JOIN "Speler" s ON s.id = ts."spelerId"
     WHERE ts."teamId" = $1 ORDER BY s."achternaam"`,
    [GEEL1_ID]
  );
  console.log(`\nGeel-1 heeft nu ${check.rows.length} spelers:`);
  check.rows.forEach((r) =>
    console.log(`  ${r.roepnaam} ${r.achternaam} (${r.geboortejaar}, ${r.geslacht})`)
  );

  await c.end();
}
main().catch(console.error);
